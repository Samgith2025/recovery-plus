import { aiService } from './openai';
import { supabase } from './supabase';
import { Exercise } from '../types';

export interface UserContext {
  userId: string;
  questionnaireData?: {
    painAreas: string[];
    activityLevel: string;
    goals: string[];
    currentPhase: number;
  };
  exerciseHistory?: {
    completedExercises: string[];
    avgPainLevel: number;
    avgDifficultyRating: number;
    recentFeedback: Array<{
      exerciseId: string;
      painLevel: number;
      difficulty: number;
      notes?: string;
    }>;
  };
  preferences?: {
    maxDifficulty: number;
    preferredTypes: string[];
    timeAvailable: number; // minutes
  };
}

export interface ExerciseRecommendation {
  exercise: Exercise;
  reason: string;
  aiConfidence: number;
  personalizedInstructions: string[];
  modifications: string[];
}

class AIExerciseRecommendationService {
  /**
   * Get personalized exercise recommendations using AI and user context
   */
  async getPersonalizedRecommendations(
    userContext: UserContext,
    limit: number = 10
  ): Promise<{
    recommendations: ExerciseRecommendation[];
    error?: string;
  }> {
    try {
      // Step 1: Fetch exercises from database
      const { exercises, error: dbError } =
        await this.fetchExercisesFromDatabase();

      if (dbError) {
        console.warn('Database error, using fallback exercises:', dbError);
        return {
          recommendations: await this.getFallbackRecommendations(
            userContext,
            limit
          ),
        };
      }

      // Step 2: Get AI analysis and filtering
      const aiRecommendations = await this.getAIFilteredRecommendations(
        exercises,
        userContext,
        limit
      );

      return { recommendations: aiRecommendations };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        recommendations: await this.getFallbackRecommendations(
          userContext,
          limit
        ),
        error: 'Using fallback recommendations due to service error',
      };
    }
  }

  /**
   * Fetch all exercises from Supabase database
   */
  private async fetchExercisesFromDatabase(): Promise<{
    exercises: Exercise[];
    error?: string;
  }> {
    if (!supabase) {
      return { exercises: [], error: 'Database not configured' };
    }

    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('difficulty', { ascending: true });

      if (error) {
        return { exercises: [], error: error.message };
      }

      // Convert database exercises to app Exercise type
      const exercises: Exercise[] = (data || []).map(dbExercise => ({
        id: dbExercise.id,
        name: dbExercise.title,
        description: dbExercise.description,
        instructions: dbExercise.instructions,
        sets: dbExercise.sets || 3,
        reps: dbExercise.reps || 10,
        holdTime: dbExercise.hold_time || 5,
        restTime: dbExercise.rest_time || 30,
        level: this.mapDifficultyToLevel(dbExercise.difficulty),
        difficulty: dbExercise.difficulty,
        type: dbExercise.type,
        targetMuscles: dbExercise.body_parts,
        bodyPart: dbExercise.body_parts,
        videoUrls: dbExercise.video_urls,
        icon: this.getExerciseIcon(dbExercise.type, dbExercise.body_parts),
        duration: this.calculateDuration(
          dbExercise.sets,
          dbExercise.reps,
          dbExercise.rest_time
        ),
        equipment: [], // Add equipment field to database later
      }));

      return { exercises };
    } catch (error) {
      return { exercises: [], error: 'Failed to fetch exercises' };
    }
  }

  /**
   * Use AI to analyze and filter exercises based on user context
   */
  private async getAIFilteredRecommendations(
    exercises: Exercise[],
    userContext: UserContext,
    limit: number
  ): Promise<ExerciseRecommendation[]> {
    try {
      // Create context prompt for AI
      const contextPrompt = this.buildContextPrompt(userContext, exercises);

      const aiResponse = await aiService.generateCoachingResponse(
        [
          {
            role: 'system',
            content: `You are an AI exercise recommendation system for Recovery+. 
          Analyze the user's context and available exercises to recommend the best exercises.
          
          Return a JSON response with this format:
          {
            "recommendations": [
              {
                "exerciseId": "exercise-id",
                "reason": "Why this exercise is recommended for this user",
                "confidence": 0.85,
                "personalizedInstructions": ["Modified instruction 1", "Modified instruction 2"],
                "modifications": ["Modification for user's condition"]
              }
            ]
          }
          
          Consider:
          - User's pain areas and current recovery phase
          - Exercise history and feedback
          - Appropriate difficulty progression
          - Time constraints and preferences
          - Safety and contraindications`,
          },
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
        {
          currentPhase: userContext.questionnaireData?.currentPhase,
          painLevel: userContext.exerciseHistory?.avgPainLevel,
        }
      );

      // Parse AI response and match with exercises
      const aiRecommendations = this.parseAIRecommendations(
        aiResponse,
        exercises,
        limit
      );
      return aiRecommendations;
    } catch (error) {
      console.error('AI recommendation error:', error);
      // Fallback to rule-based recommendations
      return this.getRuleBasedRecommendations(exercises, userContext, limit);
    }
  }

  /**
   * Build context prompt for AI analysis
   */
  private buildContextPrompt(
    userContext: UserContext,
    exercises: Exercise[]
  ): string {
    const { questionnaireData, exerciseHistory, preferences } = userContext;

    return `
User Profile:
- Pain Areas: ${questionnaireData?.painAreas?.join(', ') || 'Not specified'}
- Activity Level: ${questionnaireData?.activityLevel || 'Not specified'}
- Goals: ${questionnaireData?.goals?.join(', ') || 'General recovery'}
- Current Phase: ${questionnaireData?.currentPhase || 1}

Exercise History:
- Average Pain Level: ${exerciseHistory?.avgPainLevel || 'No history'}
- Average Difficulty Rating: ${exerciseHistory?.avgDifficultyRating || 'No history'}
- Recent Feedback: ${exerciseHistory?.recentFeedback?.length || 0} sessions

Preferences:
- Max Difficulty: ${preferences?.maxDifficulty || 5}
- Preferred Types: ${preferences?.preferredTypes?.join(', ') || 'Any'}
- Time Available: ${preferences?.timeAvailable || 30} minutes

Available Exercises:
${exercises.map(ex => `- ${ex.id}: ${ex.name} (Difficulty: ${ex.difficulty}, Type: ${ex.type}, Target: ${ex.targetMuscles.join(', ')})`).join('\n')}

Please recommend the best exercises for this user's current needs and recovery stage.
    `.trim();
  }

  /**
   * Parse AI response and create recommendations
   */
  private parseAIRecommendations(
    aiResponse: string,
    exercises: Exercise[],
    limit: number
  ): ExerciseRecommendation[] {
    try {
      // Ensure aiResponse is a string
      const responseText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
      
      if (!responseText) {
        throw new Error('Empty AI response received');
      }

      // Try to extract JSON from AI response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const recommendations: ExerciseRecommendation[] = [];

      for (const rec of parsedResponse.recommendations || []) {
        const exercise = exercises.find(ex => ex.id === rec.exerciseId);
        if (exercise && recommendations.length < limit) {
          recommendations.push({
            exercise,
            reason: rec.reason || 'AI recommended',
            aiConfidence: rec.confidence || 0.5,
            personalizedInstructions:
              rec.personalizedInstructions || exercise.instructions,
            modifications: rec.modifications || [],
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to parse AI recommendations:', error);
      // Fallback to rule-based selection
      return this.getRuleBasedRecommendations(exercises, { userId: '' }, limit);
    }
  }

  /**
   * Rule-based fallback recommendations
   */
  private getRuleBasedRecommendations(
    exercises: Exercise[],
    userContext: UserContext,
    limit: number
  ): ExerciseRecommendation[] {
    const painAreas = userContext.questionnaireData?.painAreas || [];
    const currentPhase = userContext.questionnaireData?.currentPhase || 1;
    const maxDifficulty = Math.min(currentPhase + 1, 5);

    // Filter exercises by user context
    let filteredExercises = exercises.filter(
      ex => ex.difficulty <= maxDifficulty
    );

    // Prioritize exercises targeting user's pain areas
    if (painAreas.length > 0) {
      const relevantExercises = filteredExercises.filter(ex =>
        ex.targetMuscles.some(muscle =>
          painAreas.some(
            area =>
              muscle.toLowerCase().includes(area.toLowerCase()) ||
              area.toLowerCase().includes(muscle.toLowerCase())
          )
        )
      );

      if (relevantExercises.length > 0) {
        filteredExercises = relevantExercises;
      }
    }

    // Sort by difficulty and take limit
    const sortedExercises = filteredExercises
      .sort((a, b) => a.difficulty - b.difficulty)
      .slice(0, limit);

    return sortedExercises.map(exercise => ({
      exercise,
      reason: `Recommended for ${painAreas.join(', ') || 'general recovery'} (Phase ${currentPhase})`,
      aiConfidence: 0.7,
      personalizedInstructions: exercise.instructions,
      modifications: this.getBasicModifications(exercise, userContext),
    }));
  }

  /**
   * Get basic exercise modifications based on user context
   */
  private getBasicModifications(
    exercise: Exercise,
    userContext: UserContext
  ): string[] {
    const modifications: string[] = [];
    const avgPainLevel = userContext.exerciseHistory?.avgPainLevel;

    if (avgPainLevel && avgPainLevel > 6) {
      modifications.push('Reduce range of motion if experiencing pain');
      modifications.push('Take longer rest periods between sets');
    }

    if (exercise.difficulty > 3) {
      modifications.push('Start with fewer repetitions and build up gradually');
    }

    return modifications;
  }

  /**
   * AI-powered fallback recommendations when primary AI service is unavailable
   */
  private async getFallbackRecommendations(
    userContext: UserContext,
    limit: number
  ): Promise<ExerciseRecommendation[]> {
    try {
      // Use AI Exercise Generator as fallback instead of hardcoded exercises
      const { aiExerciseGenerator } = await import('./aiExerciseGenerator');
      
      const exerciseContext = {
        painLevel: userContext.painLevel,
        fitnessLevel: userContext.fitnessLevel,
        injuryType: userContext.injuryType,
        bodyParts: userContext.bodyParts,
        timeAvailable: 15,
        environment: 'home' as const,
        equipment: [],
      };

      const result = await aiExerciseGenerator.generateExercises({
        context: exerciseContext,
        count: limit,
        sessionType: 'recovery',
        difficulty: 'auto',
      });

      return result.exercises.map(exercise => ({
        exercise: {
          id: exercise.id,
          name: exercise.name,
          description: exercise.description,
          instructions: exercise.instructions,
          sets: exercise.sets,
          reps: exercise.reps,
          holdTime: exercise.holdTime,
          restTime: exercise.restTime,
          level: exercise.level,
          difficulty: exercise.difficulty,
          type: exercise.type,
          targetMuscles: exercise.targetMuscles,
          bodyPart: exercise.bodyPart,
          videoUrls: [], // Will be populated by video service
          icon: exercise.icon,
          duration: exercise.duration,
          equipment: exercise.equipment,
        },
        reason: exercise.generationReason,
        aiConfidence: result.aiConfidence,
        personalizedInstructions: exercise.instructions,
        modifications: exercise.adaptations,
      }));
    } catch (error) {
      console.error('AI fallback generation failed:', error);
      
      // Ultimate fallback - minimal safe exercises generated programmatically
      const safeExercises = this.generateMinimalSafeExercises(userContext, limit);
      return safeExercises;
    }
  }

  /**
   * Generate minimal safe exercises when all AI services fail
   */
  private generateMinimalSafeExercises(
    userContext: UserContext,
    limit: number
  ): ExerciseRecommendation[] {
    const safeExercises: ExerciseRecommendation[] = [];
    
    // Always start with breathing if high pain or stress
    if (userContext.painLevel && userContext.painLevel > 5) {
      safeExercises.push({
        exercise: {
          id: 'safe-breathing',
          name: 'Calm Breathing Exercise',
          description: 'Gentle breathing to reduce tension and promote relaxation',
          instructions: [
            'Sit or lie in a comfortable position',
            'Breathe in slowly through your nose for 4 seconds',
            'Hold gently for 2 seconds',
            'Breathe out slowly through your mouth for 6 seconds',
            'Focus on releasing tension with each exhale'
          ],
          sets: 1,
          reps: 8,
          holdTime: 2,
          restTime: 0,
          level: 'BEGINNER',
          difficulty: 1,
          type: 'relaxation',
          targetMuscles: ['diaphragm'],
          bodyPart: ['core'],
          videoUrls: [],
          icon: '🫁',
          duration: '4 mins',
          equipment: [],
        },
        reason: 'Safe breathing exercise for pain management',
        aiConfidence: 0.9,
        personalizedInstructions: ['Move at your own pace', 'Stop if uncomfortable'],
        modifications: ['Can be done in any position', 'Adjust timing to comfort'],
      });
    }

    // Add gentle movement if space allows
    if (safeExercises.length < limit) {
      safeExercises.push({
        exercise: {
          id: 'safe-gentle-movement',
          name: 'Gentle Seated Movements',
          description: 'Slow, controlled movements to maintain mobility',
          instructions: [
            'Sit tall in a sturdy chair',
            'Slowly roll your shoulders backward 5 times',
            'Gently turn your head left and right 3 times each',
            'Lift your arms overhead if comfortable',
            'Take deep breaths between movements'
          ],
          sets: 1,
          reps: 5,
          holdTime: 2,
          restTime: 30,
          level: 'BEGINNER',
          difficulty: 1,
          type: 'mobility',
          targetMuscles: ['shoulders', 'neck'],
          bodyPart: ['upper body'],
          videoUrls: [],
          icon: '🪑',
          duration: '5 mins',
          equipment: ['chair'],
        },
        reason: 'Basic mobility maintenance',
        aiConfidence: 0.8,
        personalizedInstructions: ['Move slowly and gently', 'Use chair support'],
        modifications: ['Reduce range if needed', 'Skip any uncomfortable movements'],
      });
    }

    return safeExercises.slice(0, limit);
  }

  // Helper methods
  private mapDifficultyToLevel(difficulty: number): string {
    if (difficulty <= 2) return 'BEGINNER';
    if (difficulty <= 4) return 'INTERMEDIATE';
    return 'ADVANCED';
  }

  private getExerciseIcon(type: string, bodyParts: string[]): string {
    const iconMap: Record<string, string> = {
      mobility: '🤸',
      strength: '💪',
      stability: '🧘',
      cardio: '❤️',
      relaxation: '😌',
    };

    return iconMap[type] || '🏋️';
  }

  private calculateDuration(
    sets?: number | null,
    reps?: number | null,
    restTime?: number | null
  ): string {
    const totalSets = sets || 3;
    const totalReps = reps || 10;
    const totalRest = restTime || 30;

    // Rough calculation: (reps * 3 seconds + rest) * sets
    const totalSeconds = (totalReps * 3 + totalRest) * totalSets;
    const minutes = Math.ceil(totalSeconds / 60);

    return `${minutes} mins`;
  }
}

export const aiExerciseRecommendations = new AIExerciseRecommendationService();
