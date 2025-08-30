import { ExerciseFeedback, FeedbackAnalysis } from '../types/feedback';
import { Exercise } from '../components/ui/ExerciseCard';
import { exerciseLogger } from './logger';
import { feedbackService } from './feedbackService';

export interface ExerciseModification {
  type: 'intensity' | 'duration' | 'reps' | 'weight' | 'alternative' | 'rest';
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AdaptedExercise extends Exercise {
  modifications: ExerciseModification[];
  adaptationReason: string;
  originalExercise: Exercise;
  confidenceScore: number; // 0-1 how confident we are in this adaptation
}

export interface AdaptationRecommendation {
  exerciseId: string;
  exerciseName: string;
  modifications: ExerciseModification[];
  shouldReplace: boolean;
  alternativeExercise?: Exercise;
  reasoning: string;
}

class ExerciseAdaptationService {
  /**
   * Analyze feedback and generate exercise adaptations
   */
  async generateAdaptations(
    userId: string,
    exercises: Exercise[]
  ): Promise<AdaptationRecommendation[]> {
    try {
      const analysis = await feedbackService.generateFeedbackAnalysis(userId);
      const trends = await feedbackService.getFeedbackTrends(userId);

      const recommendations: AdaptationRecommendation[] = [];

      for (const exercise of exercises) {
        const feedback = await feedbackService.getUserFeedback(userId, {
          exerciseId: exercise.id,
          limit: 10,
        });

        if (feedback.length === 0) continue;

        const recommendation = this.analyzeExerciseFeedback(
          exercise,
          feedback,
          analysis
        );

        if (
          recommendation.modifications.length > 0 ||
          recommendation.shouldReplace
        ) {
          recommendations.push(recommendation);
        }
      }

      exerciseLogger.info('Exercise adaptations generated', {
        userId,
        recommendationCount: recommendations.length,
        exerciseCount: exercises.length,
      });

      return recommendations.sort((a, b) => {
        const aHighPriority = a.modifications.filter(
          m => m.priority === 'high'
        ).length;
        const bHighPriority = b.modifications.filter(
          m => m.priority === 'high'
        ).length;
        return bHighPriority - aHighPriority;
      });
    } catch (error) {
      exerciseLogger.error('Failed to generate exercise adaptations', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Analyze feedback for a specific exercise and generate recommendations
   */
  private analyzeExerciseFeedback(
    exercise: Exercise,
    feedback: ExerciseFeedback[],
    analysis: FeedbackAnalysis
  ): AdaptationRecommendation {
    const modifications: ExerciseModification[] = [];
    let shouldReplace = false;
    let alternativeExercise: Exercise | undefined;

    // Calculate averages
    const avgPain =
      feedback.reduce((sum, f) => sum + f.painLevel, 0) / feedback.length;
    const avgDifficulty =
      feedback.reduce((sum, f) => sum + f.difficultyRating, 0) /
      feedback.length;
    const avgEffectiveness =
      feedback
        .filter(f => f.perceivedEffectiveness !== undefined)
        .reduce((sum, f) => sum + f.perceivedEffectiveness!, 0) /
        feedback.filter(f => f.perceivedEffectiveness !== undefined).length ||
      5;

    const recentFeedback = feedback.slice(0, 3);
    const recentAvgPain =
      recentFeedback.reduce((sum, f) => sum + f.painLevel, 0) /
      recentFeedback.length;

    const completionRate =
      feedback.filter(f => f.completionStatus === 'completed').length /
      feedback.length;
    const modificationRate =
      feedback.filter(f => f.completionStatus === 'modified').length /
      feedback.length;

    // High pain level modifications
    if (avgPain >= 7) {
      modifications.push({
        type: 'intensity',
        description: 'Reduce exercise intensity by 30-40%',
        reason: `Average pain level is high (${avgPain.toFixed(1)}/10)`,
        priority: 'high',
      });

      if (recentAvgPain >= 8) {
        shouldReplace = true;
        modifications.push({
          type: 'alternative',
          description: 'Consider replacing with a gentler alternative',
          reason: 'Consistently causing severe pain',
          priority: 'high',
        });
      }
    } else if (avgPain >= 5) {
      modifications.push({
        type: 'intensity',
        description: 'Reduce exercise intensity by 15-20%',
        reason: `Pain level is moderate (${avgPain.toFixed(1)}/10)`,
        priority: 'medium',
      });
    }

    // High difficulty modifications
    if (avgDifficulty >= 8) {
      modifications.push({
        type: 'reps',
        description: 'Reduce repetitions by 25-30%',
        reason: `Exercise is very difficult (${avgDifficulty.toFixed(1)}/10)`,
        priority: 'high',
      });

      if (exercise.level === 'BEGINNER') {
        modifications.push({
          type: 'alternative',
          description: 'Consider an easier variation of this exercise',
          reason: 'Too difficult for beginner level',
          priority: 'high',
        });
      }
    } else if (avgDifficulty >= 6) {
      modifications.push({
        type: 'duration',
        description: 'Reduce exercise duration by 15-20%',
        reason: `Exercise difficulty is challenging (${avgDifficulty.toFixed(1)}/10)`,
        priority: 'medium',
      });
    }

    // Low difficulty (too easy) modifications
    if (avgDifficulty <= 3 && avgPain <= 3 && completionRate >= 0.9) {
      modifications.push({
        type: 'intensity',
        description: 'Increase exercise intensity by 15-20%',
        reason: `Exercise may be too easy (${avgDifficulty.toFixed(1)}/10 difficulty)`,
        priority: 'low',
      });

      if (exercise.level === 'BEGINNER' && feedback.length >= 5) {
        modifications.push({
          type: 'alternative',
          description: 'Consider progressing to intermediate level',
          reason: 'Consistently easy with good completion rate',
          priority: 'medium',
        });
      }
    }

    // Low completion rate modifications
    if (completionRate < 0.6) {
      modifications.push({
        type: 'duration',
        description: 'Reduce exercise duration by 25-30%',
        reason: `Low completion rate (${Math.round(completionRate * 100)}%)`,
        priority: 'high',
      });
    }

    // High modification rate
    if (modificationRate > 0.5) {
      modifications.push({
        type: 'alternative',
        description: 'Exercise may need significant adjustments',
        reason: `Frequently modified (${Math.round(modificationRate * 100)}% of sessions)`,
        priority: 'medium',
      });
    }

    // Low effectiveness
    if (
      avgEffectiveness < 4 &&
      feedback.filter(f => f.perceivedEffectiveness).length >= 3
    ) {
      modifications.push({
        type: 'alternative',
        description: 'Consider more effective alternatives',
        reason: `Low perceived effectiveness (${avgEffectiveness.toFixed(1)}/10)`,
        priority: 'medium',
      });
    }

    // Rest recommendations based on pain trends
    const painTrend = this.calculatePainTrend(feedback);
    if (painTrend === 'worsening' && avgPain >= 6) {
      modifications.push({
        type: 'rest',
        description: 'Take 2-3 days rest before attempting this exercise again',
        reason: 'Pain levels are increasing over time',
        priority: 'high',
      });
    }

    // Generate reasoning
    let reasoning = `Based on ${feedback.length} feedback sessions: `;
    const reasons = [];

    if (avgPain >= 6)
      reasons.push(`high pain levels (${avgPain.toFixed(1)}/10)`);
    if (avgDifficulty >= 7)
      reasons.push(`high difficulty (${avgDifficulty.toFixed(1)}/10)`);
    if (completionRate < 0.7)
      reasons.push(
        `low completion rate (${Math.round(completionRate * 100)}%)`
      );
    if (avgEffectiveness < 4)
      reasons.push(`low effectiveness (${avgEffectiveness.toFixed(1)}/10)`);

    reasoning +=
      reasons.length > 0 ? reasons.join(', ') : 'exercise appears suitable';

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      modifications,
      shouldReplace,
      alternativeExercise,
      reasoning,
    };
  }

  /**
   * Calculate pain trend for an exercise
   */
  private calculatePainTrend(
    feedback: ExerciseFeedback[]
  ): 'improving' | 'stable' | 'worsening' {
    if (feedback.length < 3) return 'stable';

    const sortedFeedback = [...feedback].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const recentCount = Math.min(3, Math.floor(feedback.length / 2));
    const recentPain =
      sortedFeedback
        .slice(-recentCount)
        .reduce((sum, f) => sum + f.painLevel, 0) / recentCount;

    const olderPain =
      sortedFeedback
        .slice(0, recentCount)
        .reduce((sum, f) => sum + f.painLevel, 0) / recentCount;

    const difference = recentPain - olderPain;

    if (difference > 0.5) return 'worsening';
    if (difference < -0.5) return 'improving';
    return 'stable';
  }

  /**
   * Apply modifications to an exercise
   */
  applyModifications(
    exercise: Exercise,
    modifications: ExerciseModification[]
  ): AdaptedExercise {
    let adaptedExercise = { ...exercise };
    let adaptationReason = 'Adapted based on your feedback: ';
    const reasons: string[] = [];

    modifications.forEach(mod => {
      switch (mod.type) {
        case 'intensity':
          if (mod.description.includes('Reduce')) {
            adaptationReason = 'Reduced intensity for comfort';
          } else if (mod.description.includes('Increase')) {
            adaptationReason = 'Increased intensity for better challenge';
          }
          break;

        case 'duration':
          if (mod.description.includes('Reduce')) {
            // Parse existing duration and reduce it
            const currentDuration = parseInt(exercise.duration) || 10;
            const newDuration = Math.max(5, Math.round(currentDuration * 0.75));
            adaptedExercise.duration = `${newDuration} min`;
          }
          break;

        case 'reps':
          reasons.push('adjusted repetitions');
          break;

        case 'rest':
          reasons.push('added rest period');
          break;

        case 'alternative':
          reasons.push('alternative exercise recommended');
          break;
      }
    });

    if (reasons.length > 0) {
      adaptationReason += reasons.join(', ');
    }

    // Calculate confidence score based on feedback amount and consistency
    const confidenceScore = Math.min(
      1,
      Math.max(0.3, modifications.length * 0.2)
    );

    return {
      ...adaptedExercise,
      modifications,
      adaptationReason,
      originalExercise: exercise,
      confidenceScore,
    };
  }

  /**
   * Get exercise alternatives based on muscle groups and level
   */
  getExerciseAlternatives(
    exercise: Exercise,
    availableExercises: Exercise[]
  ): Exercise[] {
    return availableExercises
      .filter(alt => {
        if (alt.id === exercise.id) return false;

        // Match target muscles
        const sharedMuscles = exercise.targetMuscles.filter(muscle =>
          alt.targetMuscles.some(
            altMuscle =>
              altMuscle.toLowerCase().includes(muscle.toLowerCase()) ||
              muscle.toLowerCase().includes(altMuscle.toLowerCase())
          )
        );

        return sharedMuscles.length > 0;
      })
      .sort((a, b) => {
        // Prioritize same level exercises
        const aLevelMatch = a.level === exercise.level ? 1 : 0;
        const bLevelMatch = b.level === exercise.level ? 1 : 0;

        if (aLevelMatch !== bLevelMatch) {
          return bLevelMatch - aLevelMatch;
        }

        // Then by muscle group match count
        const aMatches = exercise.targetMuscles.filter(muscle =>
          a.targetMuscles.some(altMuscle =>
            altMuscle.toLowerCase().includes(muscle.toLowerCase())
          )
        ).length;

        const bMatches = exercise.targetMuscles.filter(muscle =>
          b.targetMuscles.some(altMuscle =>
            altMuscle.toLowerCase().includes(muscle.toLowerCase())
          )
        ).length;

        return bMatches - aMatches;
      })
      .slice(0, 3);
  }
}

export const exerciseAdaptationService = new ExerciseAdaptationService();
