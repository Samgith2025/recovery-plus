import { aiService } from './openai';
import { supabase } from './supabase';
import { exerciseLogger } from './logger';
import {
  FeedbackAnalysis,
  ExerciseFeedback,
  FeedbackTrend,
} from '../types/feedback';

export interface AIFeedbackInsight {
  type: 'positive' | 'warning' | 'actionable' | 'neutral';
  title: string;
  description: string;
  confidence: number; // 0-1
  recommendation?: string;
  category: 'pain' | 'progress' | 'exercise' | 'technique' | 'motivation';
  priority: 'high' | 'medium' | 'low';
}

export interface ExerciseRecommendation {
  exerciseId: string;
  exerciseName: string;
  action: 'continue' | 'modify' | 'replace' | 'pause';
  reason: string;
  modifications?: string[];
  alternatives?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface AIFeedbackAnalysis extends FeedbackAnalysis {
  aiInsights: AIFeedbackInsight[];
  exerciseRecommendations: ExerciseRecommendation[];
  painManagementTips: string[];
  motivationalMessage: string;
  nextMilestones: string[];
  recoveryPhaseAssessment: {
    currentPhase: number;
    readyForNext: boolean;
    reasoning: string;
  };
  aiPowered: boolean;
  confidenceScore: number; // 0-1 how confident AI is in analysis
  error?: string;
}

export interface PainPatternAnalysis {
  overallTrend: 'improving' | 'stable' | 'worsening';
  patterns: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    exerciseType?: string;
    bodyParts?: string[];
    triggers?: string[];
  };
  correlations: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }[];
}

class AIFeedbackAnalyticsService {
  /**
   * Get comprehensive AI-powered feedback analysis
   */
  async getAIFeedbackAnalysis(userId: string): Promise<AIFeedbackAnalysis> {
    try {
      // Get user feedback data from database
      const feedbackData = await this.getUserFeedbackData(userId);
      const trendData = await this.getFeedbackTrends(userId);

      if (!feedbackData || feedbackData.length === 0) {
        return this.generateEmptyStateAnalysis(userId);
      }

      // Generate base analysis using existing logic
      const baseAnalysis = await this.generateBaseAnalysis(
        userId,
        feedbackData
      );

      // Generate AI-powered insights and analysis
      const aiAnalysis = await this.generateAIInsights(
        userId,
        feedbackData,
        trendData,
        baseAnalysis
      );

      return {
        ...baseAnalysis,
        ...aiAnalysis,
        aiPowered: true,
        confidenceScore: aiAnalysis.confidenceScore || 0.8,
      };
    } catch (error) {
      exerciseLogger.error('Failed to generate AI feedback analysis', {
        error,
        userId,
      });
      return this.generateFallbackAnalysis(userId);
    }
  }

  /**
   * Get pain pattern analysis with AI insights
   */
  async getPainPatternAnalysis(userId: string): Promise<PainPatternAnalysis> {
    try {
      const feedbackData = await this.getUserFeedbackData(userId, {
        limit: 50,
      });

      if (feedbackData.length < 5) {
        return {
          overallTrend: 'stable',
          patterns: {},
          correlations: [],
        };
      }

      const contextPrompt = `
Analyze pain patterns from exercise feedback data:

FEEDBACK DATA (last 50 sessions):
${feedbackData
  .map(
    f => `
- Exercise: ${f.exercise_name}
- Pain Level: ${f.pain_level}/10
- Time: ${f.time_of_day || 'unknown'}
- Date: ${f.completed_at}
- Notes: ${f.notes || 'none'}
`
  )
  .join('\n')}

Analyze and return JSON with:
1. overallTrend: 'improving'|'stable'|'worsening'
2. patterns: {timeOfDay?, exerciseType?, bodyParts?, triggers?}
3. correlations: [{factor, impact: 'positive'|'negative'|'neutral', confidence: 0-1}]

Focus on identifying pain triggers, time-of-day patterns, and exercise-specific correlations.
`;

      const response = await openAIService.generateChatCompletion(
        [{ role: 'user', content: contextPrompt }],
        { temperature: 0.3, max_tokens: 800 }
      );

      return JSON.parse(response);
    } catch (error) {
      exerciseLogger.warn('Failed to generate AI pain pattern analysis', {
        error,
      });
      return this.generateFallbackPainAnalysis(userId);
    }
  }

  /**
   * Get user feedback data from database
   */
  private async getUserFeedbackData(
    userId: string,
    options?: { limit?: number }
  ) {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .select(
        `
        id,
        exercise_id,
        exercise_name,
        pain_level,
        difficulty_rating,
        completion_status,
        duration_minutes,
        completed_at,
        notes,
        time_of_day,
        sets_completed,
        total_sets
      `
      )
      .eq('user_id', userId)
      .not('pain_level', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(options?.limit || 100);

    if (error) {
      exerciseLogger.warn('Failed to fetch feedback data', { error, userId });
      return [];
    }

    return data || [];
  }

  /**
   * Get feedback trends for exercises
   */
  private async getFeedbackTrends(userId: string): Promise<FeedbackTrend[]> {
    try {
      const { data, error } = await supabase
        .from('exercise_sessions')
        .select(
          'exercise_id, exercise_name, pain_level, difficulty_rating, completed_at'
        )
        .eq('user_id', userId)
        .not('pain_level', 'is', null)
        .order('completed_at', { ascending: false });

      if (error || !data) return [];

      // Group by exercise and calculate trends
      const exerciseGroups: Record<string, any[]> = {};
      data.forEach(item => {
        if (!exerciseGroups[item.exercise_id]) {
          exerciseGroups[item.exercise_id] = [];
        }
        exerciseGroups[item.exercise_id].push(item);
      });

      return Object.entries(exerciseGroups).map(([exerciseId, sessions]) => {
        const avgPain =
          sessions.reduce((sum, s) => sum + s.pain_level, 0) / sessions.length;
        const avgDifficulty =
          sessions.reduce((sum, s) => sum + s.difficulty_rating, 0) /
          sessions.length;

        // Calculate trend
        const sortedSessions = sessions.sort(
          (a, b) =>
            new Date(a.completed_at).getTime() -
            new Date(b.completed_at).getTime()
        );
        const recent = sortedSessions.slice(-Math.ceil(sessions.length / 2));
        const older = sortedSessions.slice(0, Math.floor(sessions.length / 2));

        let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
        if (older.length > 0) {
          const recentAvgPain =
            recent.reduce((sum, s) => sum + s.pain_level, 0) / recent.length;
          const olderAvgPain =
            older.reduce((sum, s) => sum + s.pain_level, 0) / older.length;
          const improvement = olderAvgPain - recentAvgPain;

          if (improvement > 0.7) improvementTrend = 'improving';
          else if (improvement < -0.7) improvementTrend = 'declining';
        }

        return {
          exerciseId,
          exerciseName: sessions[0].exercise_name,
          averagePainLevel: Math.round(avgPain * 10) / 10,
          averageDifficultyRating: Math.round(avgDifficulty * 10) / 10,
          totalSessions: sessions.length,
          improvementTrend,
          lastFeedbackDate:
            sortedSessions[sortedSessions.length - 1].completed_at,
        };
      });
    } catch (error) {
      exerciseLogger.warn('Failed to get feedback trends', { error });
      return [];
    }
  }

  /**
   * Generate base analysis using existing logic
   */
  private async generateBaseAnalysis(
    userId: string,
    feedbackData: any[]
  ): Promise<
    Omit<
      FeedbackAnalysis,
      'aiInsights' | 'exerciseRecommendations' | 'aiPowered'
    >
  > {
    const avgPain =
      feedbackData.reduce((sum, f) => sum + f.pain_level, 0) /
      feedbackData.length;
    const avgDifficulty =
      feedbackData.reduce((sum, f) => sum + f.difficulty_rating, 0) /
      feedbackData.length;

    // Calculate pain trend
    const recentSessions = feedbackData.slice(
      0,
      Math.min(10, feedbackData.length)
    );
    const olderSessions = feedbackData.slice(
      -Math.min(10, feedbackData.length)
    );

    let overallPainTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (olderSessions.length > 0) {
      const recentAvgPain =
        recentSessions.reduce((sum, f) => sum + f.pain_level, 0) /
        recentSessions.length;
      const olderAvgPain =
        olderSessions.reduce((sum, f) => sum + f.pain_level, 0) /
        olderSessions.length;

      if (olderAvgPain - recentAvgPain > 0.5) overallPainTrend = 'improving';
      else if (recentAvgPain - olderAvgPain > 0.5)
        overallPainTrend = 'worsening';
    }

    // Basic exercise effectiveness analysis
    const exerciseGroups: Record<string, any[]> = {};
    feedbackData.forEach(session => {
      if (!exerciseGroups[session.exercise_id]) {
        exerciseGroups[session.exercise_id] = [];
      }
      exerciseGroups[session.exercise_id].push(session);
    });

    const exerciseAnalysis = Object.entries(exerciseGroups)
      .filter(([_, sessions]) => sessions.length >= 2)
      .map(([exerciseId, sessions]) => {
        const avgPainLevel =
          sessions.reduce((sum, s) => sum + s.pain_level, 0) / sessions.length;
        return {
          exerciseId,
          exerciseName: sessions[0].exercise_name,
          avgPainLevel,
          sessionCount: sessions.length,
        };
      })
      .sort((a, b) => a.avgPainLevel - b.avgPainLevel);

    const mostEffectiveExercises = exerciseAnalysis
      .slice(0, 3)
      .map(e => e.exerciseName);
    const leastEffectiveExercises = exerciseAnalysis
      .slice(-3)
      .map(e => e.exerciseName);

    // Generate basic recommendations
    const recommendedModifications: string[] = [];
    if (avgPain > 6) {
      recommendedModifications.push(
        'Focus on pain management and gentler movements'
      );
    }
    if (avgDifficulty > 7.5) {
      recommendedModifications.push('Consider reducing exercise intensity');
    }

    // Calculate progress score
    let progressScore = 50;
    if (overallPainTrend === 'improving') progressScore += 25;
    else if (overallPainTrend === 'worsening') progressScore -= 25;
    if (avgPain <= 4) progressScore += 15;
    else if (avgPain >= 7) progressScore -= 15;
    progressScore = Math.max(0, Math.min(100, progressScore));

    return {
      userId,
      overallPainTrend,
      averagePainLevel: Math.round(avgPain * 10) / 10,
      averageDifficultyRating: Math.round(avgDifficulty * 10) / 10,
      mostEffectiveExercises,
      leastEffectiveExercises,
      recommendedModifications,
      progressScore,
      analysisDate: new Date().toISOString(),
    };
  }

  /**
   * Generate AI-powered insights and recommendations
   */
  private async generateAIInsights(
    userId: string,
    feedbackData: any[],
    trendData: FeedbackTrend[],
    baseAnalysis: any
  ): Promise<{
    aiInsights: AIFeedbackInsight[];
    exerciseRecommendations: ExerciseRecommendation[];
    painManagementTips: string[];
    motivationalMessage: string;
    nextMilestones: string[];
    recoveryPhaseAssessment: any;
    confidenceScore: number;
  }> {
    try {
      const recentSessions = feedbackData.slice(0, 15);
      const exerciseTypes = [
        ...new Set(feedbackData.map(f => f.exercise_name)),
      ];

      const contextPrompt = `
You are an AI physical therapy coach analyzing exercise feedback. Generate comprehensive insights:

USER DATA ANALYSIS:
- Total sessions: ${feedbackData.length}
- Average pain level: ${baseAnalysis.averagePainLevel}/10
- Pain trend: ${baseAnalysis.overallPainTrend}
- Progress score: ${baseAnalysis.progressScore}%
- Exercise types: ${exerciseTypes.slice(0, 8).join(', ')}

RECENT SESSIONS (last 15):
${recentSessions
  .map(
    s => `
- ${s.exercise_name}: Pain ${s.pain_level}/10, Difficulty ${s.difficulty_rating}/10, ${s.completion_status}
- Notes: ${s.notes || 'none'}
`
  )
  .join('\n')}

EXERCISE TRENDS:
${trendData
  .slice(0, 5)
  .map(
    t => `
- ${t.exerciseName}: ${t.totalSessions} sessions, avg pain ${t.averagePainLevel}, trend ${t.improvementTrend}
`
  )
  .join('\n')}

Generate JSON response with:
1. aiInsights: [5-7 insights with type, title, description, confidence, recommendation?, category, priority]
2. exerciseRecommendations: [3-5 exercise-specific recommendations with action, reason, modifications?, alternatives?]
3. painManagementTips: [4-6 specific pain management strategies]
4. motivationalMessage: encouraging message based on their progress
5. nextMilestones: [3-4 achievable goals for next 2 weeks]
6. recoveryPhaseAssessment: {currentPhase: 1-4, readyForNext: boolean, reasoning}
7. confidenceScore: 0-1 based on data quality

Focus on actionable, personalized advice for recovery and pain management.
`;

      const response = await openAIService.generateChatCompletion(
        [{ role: 'user', content: contextPrompt }],
        { temperature: 0.7, max_tokens: 2000 }
      );

      const aiData = JSON.parse(response);

      return {
        aiInsights: aiData.aiInsights || [],
        exerciseRecommendations: aiData.exerciseRecommendations || [],
        painManagementTips: aiData.painManagementTips || [],
        motivationalMessage:
          aiData.motivationalMessage ||
          'Keep up the great work with your recovery!',
        nextMilestones: aiData.nextMilestones || [
          'Continue regular exercise',
          'Monitor pain levels',
        ],
        recoveryPhaseAssessment: aiData.recoveryPhaseAssessment || {
          currentPhase: 2,
          readyForNext: false,
          reasoning: 'Continue current phase exercises',
        },
        confidenceScore: aiData.confidenceScore || 0.8,
      };
    } catch (error) {
      exerciseLogger.warn(
        'AI feedback insights generation failed, using fallback',
        { error }
      );

      return this.generateFallbackInsights(baseAnalysis, trendData);
    }
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(
    baseAnalysis: any,
    trendData: FeedbackTrend[]
  ): any {
    const insights: AIFeedbackInsight[] = [];

    // Pain level insights
    if (baseAnalysis.averagePainLevel < 4) {
      insights.push({
        type: 'positive',
        title: 'Low Pain Levels',
        description: `Your average pain level of ${baseAnalysis.averagePainLevel}/10 indicates good progress.`,
        confidence: 0.9,
        category: 'pain',
        priority: 'medium',
      });
    } else if (baseAnalysis.averagePainLevel > 7) {
      insights.push({
        type: 'warning',
        title: 'High Pain Levels',
        description: `Average pain level is ${baseAnalysis.averagePainLevel}/10. Consider gentler approaches.`,
        confidence: 0.9,
        recommendation:
          'Focus on pain management and consult healthcare provider',
        category: 'pain',
        priority: 'high',
      });
    }

    // Progress insights
    if (baseAnalysis.overallPainTrend === 'improving') {
      insights.push({
        type: 'positive',
        title: 'Pain Improving',
        description: 'Your pain levels are trending downward over time.',
        confidence: 0.8,
        category: 'progress',
        priority: 'medium',
      });
    } else if (baseAnalysis.overallPainTrend === 'worsening') {
      insights.push({
        type: 'warning',
        title: 'Pain Increasing',
        description: 'Pain levels have been increasing recently.',
        confidence: 0.8,
        recommendation:
          'Review exercise intensity and consult healthcare provider',
        category: 'progress',
        priority: 'high',
      });
    }

    // Exercise insights
    const improvingExercises = trendData.filter(
      t => t.improvementTrend === 'improving'
    );
    if (improvingExercises.length > 0) {
      insights.push({
        type: 'positive',
        title: 'Exercise Progress',
        description: `${improvingExercises.length} exercises showing improvement.`,
        confidence: 0.7,
        category: 'exercise',
        priority: 'medium',
      });
    }

    return {
      aiInsights: insights,
      exerciseRecommendations: [],
      painManagementTips: [
        'Apply ice for 15-20 minutes after exercise if experiencing pain',
        'Focus on gentle stretching and mobility work',
        'Listen to your body and rest when needed',
        'Maintain consistent sleep schedule for recovery',
      ],
      motivationalMessage: this.generateMotivationalMessage(baseAnalysis),
      nextMilestones: [
        'Complete exercises 3 times this week',
        'Reduce average pain level by 0.5 points',
        'Increase exercise duration gradually',
      ],
      recoveryPhaseAssessment: {
        currentPhase: 2,
        readyForNext:
          baseAnalysis.averagePainLevel < 5 &&
          baseAnalysis.overallPainTrend !== 'worsening',
        reasoning: 'Continue current exercises with gradual progression',
      },
      confidenceScore: 0.6,
    };
  }

  /**
   * Generate motivational message
   */
  private generateMotivationalMessage(analysis: any): string {
    if (analysis.overallPainTrend === 'improving') {
      return '🌟 Excellent progress! Your pain levels are improving steadily. Keep up the consistent work!';
    } else if (analysis.progressScore >= 70) {
      return "💪 You're doing great! Your dedication to recovery is showing positive results.";
    } else if (analysis.averagePainLevel <= 4) {
      return '😌 Your pain management is working well. Stay consistent with your routine!';
    } else {
      return '🤗 Recovery takes time and patience. Every session counts toward your healing journey.';
    }
  }

  /**
   * Generate fallback pain analysis
   */
  private generateFallbackPainAnalysis(userId: string): PainPatternAnalysis {
    return {
      overallTrend: 'stable',
      patterns: {},
      correlations: [],
    };
  }

  /**
   * Generate analysis for users with no feedback data
   */
  private generateEmptyStateAnalysis(userId: string): AIFeedbackAnalysis {
    return {
      userId,
      overallPainTrend: 'stable',
      averagePainLevel: 0,
      averageDifficultyRating: 0,
      mostEffectiveExercises: [],
      leastEffectiveExercises: [],
      recommendedModifications: [],
      progressScore: 50,
      analysisDate: new Date().toISOString(),
      aiInsights: [],
      exerciseRecommendations: [],
      painManagementTips: [
        'Start with gentle, low-impact exercises',
        'Track your pain levels consistently',
        'Focus on proper form over intensity',
        'Build a consistent routine gradually',
      ],
      motivationalMessage:
        '🚀 Ready to start your recovery journey? Consistent feedback will help create personalized insights!',
      nextMilestones: [
        'Complete your first week of exercises',
        'Provide feedback for at least 5 sessions',
        'Establish a regular exercise routine',
      ],
      recoveryPhaseAssessment: {
        currentPhase: 1,
        readyForNext: false,
        reasoning: 'Begin with initial assessment and gentle exercises',
      },
      aiPowered: false,
      confidenceScore: 0.0,
    };
  }

  /**
   * Generate fallback analysis when AI fails
   */
  private generateFallbackAnalysis(userId: string): AIFeedbackAnalysis {
    return {
      userId,
      overallPainTrend: 'stable',
      averagePainLevel: 0,
      averageDifficultyRating: 0,
      mostEffectiveExercises: [],
      leastEffectiveExercises: [],
      recommendedModifications: ['Continue with regular exercise routine'],
      progressScore: 50,
      analysisDate: new Date().toISOString(),
      aiInsights: [
        {
          type: 'neutral',
          title: 'Analysis Unavailable',
          description:
            'AI analysis is temporarily unavailable. Basic tracking continues.',
          confidence: 0.5,
          category: 'exercise',
          priority: 'low',
        },
      ],
      exerciseRecommendations: [],
      painManagementTips: [
        'Continue with your current routine',
        'Monitor pain levels carefully',
        'Rest when needed',
      ],
      motivationalMessage:
        'Keep up with your recovery routine. Detailed analysis will be available soon!',
      nextMilestones: ['Stay consistent', 'Track progress'],
      recoveryPhaseAssessment: {
        currentPhase: 2,
        readyForNext: false,
        reasoning: 'Analysis service temporarily unavailable',
      },
      aiPowered: false,
      confidenceScore: 0.3,
      error: 'AI analysis service unavailable',
    };
  }
}

export const aiFeedbackAnalytics = new AIFeedbackAnalyticsService();
