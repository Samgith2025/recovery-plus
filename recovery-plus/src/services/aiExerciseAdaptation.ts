import { aiService } from './openai';
import { supabase } from './supabase';
import { Exercise } from '../types';
import { exerciseLogger } from './logger';

export interface ExerciseModification {
  type:
    | 'intensity'
    | 'duration'
    | 'reps'
    | 'sets'
    | 'hold_time'
    | 'rest_time'
    | 'alternative'
    | 'form_cue';
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  value?: number | string; // New value if numeric change
}

export interface AdaptationRecommendation {
  exerciseId: string;
  exerciseName: string;
  modifications: ExerciseModification[];
  shouldReplace: boolean;
  alternativeExercise?: Exercise;
  reasoning: string;
  aiConfidence: number; // 0-1 confidence in recommendation
  urgency: 'immediate' | 'soon' | 'consider'; // When to apply changes
}

export interface UserFeedbackData {
  exerciseId: string;
  exerciseName: string;
  sessions: Array<{
    date: string;
    painLevel: number;
    difficultyRating: number;
    completed: boolean;
    notes?: string;
    setsCompleted?: number;
    repsCompleted?: number;
    modifications?: string[];
  }>;
  avgPainLevel: number;
  avgDifficultyRating: number;
  completionRate: number;
  trendDirection: 'improving' | 'stable' | 'declining';
}

class AIExerciseAdaptationService {
  /**
   * Generate AI-powered exercise adaptations based on user feedback and progress
   */
  async generatePersonalizedAdaptations(
    userId: string,
    exerciseIds?: string[]
  ): Promise<{
    adaptations: AdaptationRecommendation[];
    overallAnalysis: string;
    error?: string;
  }> {
    try {
      // Step 1: Gather comprehensive user feedback data
      const feedbackData = await this.getUserFeedbackData(userId, exerciseIds);

      if (feedbackData.length === 0) {
        return {
          adaptations: [],
          overallAnalysis:
            'No exercise feedback data available yet. Complete a few exercise sessions to get personalized adaptations.',
          error: 'No feedback data',
        };
      }

      // Step 2: Get user context for AI analysis
      const userContext = await this.getUserContext(userId);

      // Step 3: Generate AI-powered adaptations
      const adaptations = await this.getAIAdaptationRecommendations(
        feedbackData,
        userContext
      );

      // Step 4: Generate overall analysis
      const overallAnalysis = await this.generateOverallAnalysis(
        feedbackData,
        adaptations,
        userContext
      );

      return {
        adaptations,
        overallAnalysis,
      };
    } catch (error) {
      exerciseLogger.error('Failed to generate AI adaptations', {
        error,
        userId,
      });
      return {
        adaptations: await this.getFallbackAdaptations(userId, exerciseIds),
        overallAnalysis:
          'Using basic adaptation rules due to AI service unavailability.',
        error: 'AI service unavailable',
      };
    }
  }

  /**
   * Get comprehensive user feedback data from database
   */
  private async getUserFeedbackData(
    userId: string,
    exerciseIds?: string[]
  ): Promise<UserFeedbackData[]> {
    if (!supabase) return [];

    try {
      let query = supabase
        .from('exercise_sessions')
        .select(
          `
          exercise_id,
          completed,
          pain_level,
          difficulty_rating,
          notes,
          completed_at,
          created_at,
          exercises(title, sets, reps, difficulty, type, body_parts)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (exerciseIds && exerciseIds.length > 0) {
        query = query.in('exercise_id', exerciseIds);
      }

      const { data: sessions, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Group sessions by exercise
      const exerciseMap = new Map<string, any>();

      sessions?.forEach(session => {
        const exerciseId = session.exercise_id;
        const exercise = session.exercises as any;

        if (!exerciseMap.has(exerciseId)) {
          exerciseMap.set(exerciseId, {
            exerciseId,
            exerciseName: exercise?.title || 'Unknown Exercise',
            exerciseData: exercise,
            sessions: [],
          });
        }

        exerciseMap.get(exerciseId).sessions.push({
          date: session.completed_at || session.created_at,
          painLevel: session.pain_level || 0,
          difficultyRating: session.difficulty_rating || 5,
          completed: session.completed,
          notes: session.notes,
        });
      });

      // Calculate aggregated data for each exercise
      const feedbackData: UserFeedbackData[] = Array.from(
        exerciseMap.values()
      ).map(exercise => {
        const sessions = exercise.sessions;
        const painLevels = sessions
          .map((s: any) => s.painLevel)
          .filter((p: number) => p > 0);
        const difficultyRatings = sessions
          .map((s: any) => s.difficultyRating)
          .filter((d: number) => d > 0);
        const completedCount = sessions.filter((s: any) => s.completed).length;

        const avgPainLevel =
          painLevels.length > 0
            ? painLevels.reduce((sum: number, p: number) => sum + p, 0) /
              painLevels.length
            : 0;

        const avgDifficultyRating =
          difficultyRatings.length > 0
            ? difficultyRatings.reduce((sum: number, d: number) => sum + d, 0) /
              difficultyRatings.length
            : 5;

        const completionRate =
          sessions.length > 0 ? completedCount / sessions.length : 0;

        // Calculate trend (simple version - comparing recent vs older sessions)
        const trendDirection = this.calculateTrend(sessions);

        return {
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          sessions: sessions.slice(0, 10), // Last 10 sessions
          avgPainLevel,
          avgDifficultyRating,
          completionRate,
          trendDirection,
        };
      });

      return feedbackData.filter(data => data.sessions.length >= 2); // Need at least 2 sessions for adaptation
    } catch (error) {
      exerciseLogger.warn('Failed to get user feedback data', { error });
      return [];
    }
  }

  /**
   * Calculate trend from session data
   */
  private calculateTrend(
    sessions: any[]
  ): 'improving' | 'stable' | 'declining' {
    if (sessions.length < 3) return 'stable';

    // Sort by date
    const sorted = sessions.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const recentCount = Math.min(3, Math.floor(sessions.length / 2));
    const recent = sorted.slice(-recentCount);
    const older = sorted.slice(0, recentCount);

    const recentAvgPain =
      recent.reduce((sum, s) => sum + s.painLevel, 0) / recent.length;
    const olderAvgPain =
      older.reduce((sum, s) => sum + s.painLevel, 0) / older.length;

    const painChange = recentAvgPain - olderAvgPain;
    const recentCompletion =
      recent.filter(s => s.completed).length / recent.length;
    const olderCompletion =
      older.filter(s => s.completed).length / older.length;
    const completionChange = recentCompletion - olderCompletion;

    // Improving if pain decreased AND completion improved
    if (painChange < -0.5 && completionChange > 0.1) return 'improving';

    // Declining if pain increased OR completion dropped significantly
    if (painChange > 0.5 || completionChange < -0.2) return 'declining';

    return 'stable';
  }

  /**
   * Get user context for AI analysis
   */
  private async getUserContext(userId: string): Promise<any> {
    if (!supabase) return {};

    try {
      // Get questionnaire data
      const { data: questionnaire } = await supabase
        .from('questionnaire_responses')
        .select('responses')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get current recovery phase
      const { data: phase } = await supabase
        .from('recovery_phases')
        .select('phase, title, description')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      return {
        questionnaireData: questionnaire?.responses || {},
        currentPhase: phase?.phase || 1,
        phaseDescription: phase?.description || 'Early recovery phase',
      };
    } catch (error) {
      exerciseLogger.warn('Failed to get user context', { error });
      return {};
    }
  }

  /**
   * Generate AI-powered adaptation recommendations
   */
  private async getAIAdaptationRecommendations(
    feedbackData: UserFeedbackData[],
    userContext: any
  ): Promise<AdaptationRecommendation[]> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(
        feedbackData,
        userContext
      );

      const aiResponse = await aiService.generateCoachingResponse(
        [
          {
            role: 'system',
            content: `You are an AI exercise adaptation specialist. Analyze user feedback and provide precise exercise modifications.
          
          Return a JSON response with this format:
          {
            "adaptations": [
              {
                "exerciseId": "exercise-id",
                "exerciseName": "Exercise Name",
                "reasoning": "Why adaptations are needed",
                "modifications": [
                  {
                    "type": "intensity|duration|reps|sets|hold_time|rest_time|alternative|form_cue",
                    "description": "What to change",
                    "reason": "Why this change helps",
                    "priority": "high|medium|low",
                    "value": "new numeric value if applicable"
                  }
                ],
                "shouldReplace": false,
                "confidence": 0.85,
                "urgency": "immediate|soon|consider"
              }
            ]
          }
          
          Consider:
          - Pain levels and trends
          - Completion rates and difficulty ratings
          - Progressive overload principles
          - Safety and injury prevention
          - User's recovery phase and goals`,
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        {
          currentPhase: userContext.currentPhase,
        }
      );

      return this.parseAIAdaptations(aiResponse, feedbackData);
    } catch (error) {
      exerciseLogger.warn('AI adaptation analysis failed', { error });
      return this.getRuleBasedAdaptations(feedbackData);
    }
  }

  /**
   * Build comprehensive analysis prompt for AI
   */
  private buildAnalysisPrompt(
    feedbackData: UserFeedbackData[],
    userContext: any
  ): string {
    const contextInfo = [
      `Recovery Phase: ${userContext.currentPhase} (${userContext.phaseDescription})`,
      `User Goals: ${JSON.stringify(userContext.questionnaireData?.goals || [])}`,
      `Pain Areas: ${JSON.stringify(userContext.questionnaireData?.painAreas || [])}`,
    ];

    const exerciseAnalysis = feedbackData
      .map(exercise => {
        const recentSession = exercise.sessions[0];
        const trendEmoji = {
          improving: '📈',
          stable: '➡️',
          declining: '📉',
        }[exercise.trendDirection];

        return `
Exercise: ${exercise.exerciseName}
- Average Pain: ${exercise.avgPainLevel.toFixed(1)}/10
- Average Difficulty: ${exercise.avgDifficultyRating.toFixed(1)}/10  
- Completion Rate: ${Math.round(exercise.completionRate * 100)}%
- Trend: ${trendEmoji} ${exercise.trendDirection}
- Recent Sessions: ${exercise.sessions
          .slice(0, 3)
          .map(
            s =>
              `Pain: ${s.painLevel}, Difficulty: ${s.difficultyRating}, Completed: ${s.completed ? 'Yes' : 'No'}`
          )
          .join(' | ')}
- Notes: ${
          exercise.sessions
            .filter(s => s.notes)
            .slice(0, 2)
            .map(s => s.notes)
            .join('; ') || 'None'
        }`;
      })
      .join('\n');

    return `
User Context:
${contextInfo.join('\n')}

Exercise Feedback Analysis:
${exerciseAnalysis}

Please analyze this data and provide specific, actionable adaptations for exercises that need modification. Focus on:
1. Safety first - reduce anything causing high pain
2. Progressive challenge - increase difficulty for exercises that are too easy
3. Completion optimization - modify exercises with low completion rates
4. Trend-based adjustments - build on improving exercises, address declining ones

Only recommend adaptations for exercises that clearly need changes based on the data.`;
  }

  /**
   * Parse AI response into adaptation recommendations
   */
  private parseAIAdaptations(
    aiResponse: string,
    feedbackData: UserFeedbackData[]
  ): AdaptationRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      const parsed = JSON.parse(jsonMatch[0]);
      const adaptations: AdaptationRecommendation[] = [];

      for (const adaptation of parsed.adaptations || []) {
        // Validate the adaptation has required fields
        if (!adaptation.exerciseId || !adaptation.modifications) continue;

        adaptations.push({
          exerciseId: adaptation.exerciseId,
          exerciseName: adaptation.exerciseName || 'Unknown Exercise',
          modifications: adaptation.modifications.map((mod: any) => ({
            type: mod.type || 'intensity',
            description: mod.description || 'Modify exercise',
            reason: mod.reason || 'Based on your feedback',
            priority: mod.priority || 'medium',
            value: mod.value,
          })),
          shouldReplace: adaptation.shouldReplace || false,
          reasoning: adaptation.reasoning || 'AI recommended adaptation',
          aiConfidence: adaptation.confidence || 0.7,
          urgency: adaptation.urgency || 'consider',
        });
      }

      return adaptations;
    } catch (error) {
      exerciseLogger.warn('Failed to parse AI adaptations', { error });
      return this.getRuleBasedAdaptations(feedbackData);
    }
  }

  /**
   * Generate overall analysis summary
   */
  private async generateOverallAnalysis(
    feedbackData: UserFeedbackData[],
    adaptations: AdaptationRecommendation[],
    userContext: any
  ): Promise<string> {
    try {
      const summaryPrompt = `
User is in recovery phase ${userContext.currentPhase}. 
Analyzed ${feedbackData.length} exercises and generated ${adaptations.length} adaptation recommendations.

Exercise Summary:
${feedbackData.map(ex => `${ex.exerciseName}: ${ex.trendDirection} trend, ${Math.round(ex.completionRate * 100)}% completion, ${ex.avgPainLevel.toFixed(1)} avg pain`).join('\n')}

Provide a brief, encouraging 2-3 sentence summary of their progress and what the adaptations will help achieve.
Focus on positive aspects while being realistic about areas for improvement.`;

      const analysis = await aiService.generateCoachingResponse(
        [
          {
            role: 'system',
            content:
              'You are a supportive recovery coach. Provide encouraging but honest progress analysis.',
          },
          { role: 'user', content: summaryPrompt },
        ],
        { currentPhase: userContext.currentPhase }
      );

      return (
        analysis ||
        this.getDefaultAnalysis(feedbackData.length, adaptations.length)
      );
    } catch (error) {
      return this.getDefaultAnalysis(feedbackData.length, adaptations.length);
    }
  }

  /**
   * Fallback rule-based adaptations when AI is unavailable
   */
  private getRuleBasedAdaptations(
    feedbackData: UserFeedbackData[]
  ): AdaptationRecommendation[] {
    const adaptations: AdaptationRecommendation[] = [];

    for (const exercise of feedbackData) {
      const modifications: ExerciseModification[] = [];

      // High pain rule
      if (exercise.avgPainLevel >= 7) {
        modifications.push({
          type: 'intensity',
          description: 'Reduce intensity by 30%',
          reason: `High average pain level (${exercise.avgPainLevel.toFixed(1)}/10)`,
          priority: 'high',
        });
      }

      // Low completion rule
      if (exercise.completionRate < 0.6) {
        modifications.push({
          type: 'duration',
          description: 'Reduce exercise duration',
          reason: `Low completion rate (${Math.round(exercise.completionRate * 100)}%)`,
          priority: 'medium',
        });
      }

      // Too easy rule
      if (exercise.avgDifficultyRating < 3 && exercise.avgPainLevel < 3) {
        modifications.push({
          type: 'intensity',
          description: 'Gradually increase intensity',
          reason: `Exercise may be too easy (difficulty: ${exercise.avgDifficultyRating.toFixed(1)}/10)`,
          priority: 'low',
        });
      }

      if (modifications.length > 0) {
        adaptations.push({
          exerciseId: exercise.exerciseId,
          exerciseName: exercise.exerciseName,
          modifications,
          shouldReplace: exercise.avgPainLevel >= 8,
          reasoning: 'Based on feedback patterns and completion data',
          aiConfidence: 0.6,
          urgency: exercise.avgPainLevel >= 7 ? 'immediate' : 'consider',
        });
      }
    }

    return adaptations;
  }

  /**
   * Fallback adaptations when no feedback is available
   */
  private async getFallbackAdaptations(
    userId: string,
    exerciseIds?: string[]
  ): Promise<AdaptationRecommendation[]> {
    return []; // Return empty for now - could implement basic recommendations
  }

  /**
   * Default analysis when AI is unavailable
   */
  private getDefaultAnalysis(
    exerciseCount: number,
    adaptationCount: number
  ): string {
    if (adaptationCount === 0) {
      return `Great job! Your ${exerciseCount} exercises are working well for you. Keep up the consistent effort and continue tracking your progress.`;
    }

    return `I've analyzed your progress across ${exerciseCount} exercises and identified ${adaptationCount} opportunities for optimization. These personalized adjustments will help you progress safely while staying comfortable.`;
  }
}

export const aiExerciseAdaptation = new AIExerciseAdaptationService();
