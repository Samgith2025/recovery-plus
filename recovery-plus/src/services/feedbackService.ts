import { supabase } from '../config/supabase';
import {
  ExerciseFeedback,
  FeedbackTrend,
  FeedbackAnalysis,
} from '../types/feedback';
import { exerciseLogger } from './logger';

class FeedbackService {
  /**
   * Submit exercise feedback to the database
   */
  async submitFeedback(
    feedback: Partial<ExerciseFeedback>
  ): Promise<ExerciseFeedback> {
    try {
      const feedbackData = {
        ...feedback,
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('exercise_feedback')
        .insert([this.convertToDbFormat(feedbackData)])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }

      exerciseLogger.info('Feedback submitted successfully', {
        feedbackId: data.id,
        exerciseId: feedback.exerciseId,
        painLevel: feedback.painLevel,
        difficultyRating: feedback.difficultyRating,
      });

      return this.convertFromDbFormat(data);
    } catch (error) {
      exerciseLogger.error('Failed to submit feedback', { error, feedback });
      throw error;
    }
  }

  /**
   * Get feedback for a specific user
   */
  async getUserFeedback(
    userId: string,
    options?: {
      limit?: number;
      exerciseId?: string;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<ExerciseFeedback[]> {
    try {
      let query = supabase
        .from('exercise_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options?.exerciseId) {
        query = query.eq('exercise_id', options.exerciseId);
      }

      if (options?.dateFrom) {
        query = query.gte('created_at', options.dateFrom);
      }

      if (options?.dateTo) {
        query = query.lte('created_at', options.dateTo);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch feedback: ${error.message}`);
      }

      return (data || []).map(this.convertFromDbFormat);
    } catch (error) {
      exerciseLogger.error('Failed to fetch user feedback', { error, userId });
      throw error;
    }
  }

  /**
   * Get feedback trends for exercises
   */
  async getFeedbackTrends(
    userId: string,
    exerciseIds?: string[]
  ): Promise<FeedbackTrend[]> {
    try {
      let query = supabase
        .from('exercise_feedback')
        .select(
          'exercise_id, exercise_name, pain_level, difficulty_rating, created_at'
        )
        .eq('user_id', userId)
        .not('pain_level', 'is', null)
        .not('difficulty_rating', 'is', null);

      if (exerciseIds && exerciseIds.length > 0) {
        query = query.in('exercise_id', exerciseIds);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch feedback trends: ${error.message}`);
      }

      // Group by exercise and calculate trends
      const exerciseGroups: Record<string, any[]> = {};
      (data || []).forEach(item => {
        if (!exerciseGroups[item.exercise_id]) {
          exerciseGroups[item.exercise_id] = [];
        }
        exerciseGroups[item.exercise_id].push(item);
      });

      const trends: FeedbackTrend[] = Object.entries(exerciseGroups).map(
        ([exerciseId, feedbacks]) => {
          const sortedFeedbacks = feedbacks.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );

          const avgPain =
            feedbacks.reduce((sum, f) => sum + f.pain_level, 0) /
            feedbacks.length;
          const avgDifficulty =
            feedbacks.reduce((sum, f) => sum + f.difficulty_rating, 0) /
            feedbacks.length;

          // Calculate improvement trend (simplified)
          const recentCount = Math.min(3, feedbacks.length);
          const recentFeedbacks = sortedFeedbacks.slice(-recentCount);
          const olderFeedbacks = sortedFeedbacks.slice(0, -recentCount);

          let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';

          if (olderFeedbacks.length > 0) {
            const recentAvgPain =
              recentFeedbacks.reduce((sum, f) => sum + f.pain_level, 0) /
              recentFeedbacks.length;
            const olderAvgPain =
              olderFeedbacks.reduce((sum, f) => sum + f.pain_level, 0) /
              olderFeedbacks.length;

            const painImprovement = olderAvgPain - recentAvgPain;

            if (painImprovement > 0.5) {
              improvementTrend = 'improving';
            } else if (painImprovement < -0.5) {
              improvementTrend = 'declining';
            }
          }

          return {
            exerciseId,
            exerciseName: feedbacks[0].exercise_name,
            averagePainLevel: Math.round(avgPain * 10) / 10,
            averageDifficultyRating: Math.round(avgDifficulty * 10) / 10,
            totalSessions: feedbacks.length,
            improvementTrend,
            lastFeedbackDate:
              sortedFeedbacks[sortedFeedbacks.length - 1].created_at,
          };
        }
      );

      return trends.sort((a, b) => b.totalSessions - a.totalSessions);
    } catch (error) {
      exerciseLogger.error('Failed to calculate feedback trends', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive feedback analysis
   */
  async generateFeedbackAnalysis(userId: string): Promise<FeedbackAnalysis> {
    try {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const feedback = await this.getUserFeedback(userId, {
        dateFrom: thirtyDaysAgo,
        limit: 100,
      });

      const trends = await this.getFeedbackTrends(userId);

      if (feedback.length === 0) {
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
        };
      }

      // Calculate overall metrics
      const avgPain =
        feedback.reduce((sum, f) => sum + f.painLevel, 0) / feedback.length;
      const avgDifficulty =
        feedback.reduce((sum, f) => sum + f.difficultyRating, 0) /
        feedback.length;

      // Determine pain trend
      const recentFeedback = feedback.slice(0, Math.min(10, feedback.length));
      const olderFeedback = feedback.slice(-Math.min(10, feedback.length));

      let overallPainTrend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (olderFeedback.length > 0) {
        const recentAvgPain =
          recentFeedback.reduce((sum, f) => sum + f.painLevel, 0) /
          recentFeedback.length;
        const olderAvgPain =
          olderFeedback.reduce((sum, f) => sum + f.painLevel, 0) /
          olderFeedback.length;

        if (olderAvgPain - recentAvgPain > 0.5) {
          overallPainTrend = 'improving';
        } else if (recentAvgPain - olderAvgPain > 0.5) {
          overallPainTrend = 'worsening';
        }
      }

      // Find most/least effective exercises
      const exerciseEffectiveness = feedback
        .filter(f => f.perceivedEffectiveness !== undefined)
        .reduce(
          (acc, f) => {
            if (!acc[f.exerciseId]) {
              acc[f.exerciseId] = { name: f.exerciseName, scores: [] };
            }
            acc[f.exerciseId].scores.push(f.perceivedEffectiveness!);
            return acc;
          },
          {} as Record<string, { name: string; scores: number[] }>
        );

      const exerciseAvgs = Object.entries(exerciseEffectiveness)
        .map(([id, data]) => ({
          id,
          name: data.name,
          avgEffectiveness:
            data.scores.reduce((sum, score) => sum + score, 0) /
            data.scores.length,
          sessionCount: data.scores.length,
        }))
        .filter(e => e.sessionCount >= 2);

      const sortedByEffectiveness = exerciseAvgs.sort(
        (a, b) => b.avgEffectiveness - a.avgEffectiveness
      );

      const mostEffectiveExercises = sortedByEffectiveness
        .slice(0, 3)
        .map(e => e.name);
      const leastEffectiveExercises = sortedByEffectiveness
        .slice(-3)
        .map(e => e.name);

      // Generate recommendations
      const recommendedModifications: string[] = [];
      const highPainExercises = feedback.filter(f => f.painLevel >= 7);
      const highDifficultyExercises = feedback.filter(
        f => f.difficultyRating >= 8
      );

      if (highPainExercises.length > feedback.length * 0.2) {
        recommendedModifications.push(
          'Consider reducing intensity of exercises causing high pain'
        );
      }

      if (highDifficultyExercises.length > feedback.length * 0.3) {
        recommendedModifications.push(
          'Some exercises may be too challenging - try easier variations'
        );
      }

      if (avgPain > 6) {
        recommendedModifications.push(
          'Focus on pain management and gentle movements'
        );
      }

      // Calculate progress score (0-100)
      let progressScore = 50; // Base score

      if (overallPainTrend === 'improving') progressScore += 20;
      else if (overallPainTrend === 'worsening') progressScore -= 20;

      if (avgPain <= 4) progressScore += 15;
      else if (avgPain >= 7) progressScore -= 15;

      if (
        trends.filter(t => t.improvementTrend === 'improving').length >
        trends.length / 2
      ) {
        progressScore += 15;
      }

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
    } catch (error) {
      exerciseLogger.error('Failed to generate feedback analysis', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Update exercise feedback
   */
  async updateFeedback(
    feedbackId: string,
    updates: Partial<ExerciseFeedback>
  ): Promise<ExerciseFeedback> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('exercise_feedback')
        .update(this.convertToDbFormat(updateData))
        .eq('id', feedbackId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update feedback: ${error.message}`);
      }

      return this.convertFromDbFormat(data);
    } catch (error) {
      exerciseLogger.error('Failed to update feedback', { error, feedbackId });
      throw error;
    }
  }

  /**
   * Delete exercise feedback
   */
  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('exercise_feedback')
        .delete()
        .eq('id', feedbackId);

      if (error) {
        throw new Error(`Failed to delete feedback: ${error.message}`);
      }

      exerciseLogger.info('Feedback deleted successfully', { feedbackId });
    } catch (error) {
      exerciseLogger.error('Failed to delete feedback', { error, feedbackId });
      throw error;
    }
  }

  /**
   * Convert feedback to database format (snake_case)
   */
  private convertToDbFormat(feedback: any): any {
    return {
      id: feedback.id,
      user_id: feedback.userId,
      session_id: feedback.sessionId,
      exercise_id: feedback.exerciseId,
      exercise_name: feedback.exerciseName,
      pain_level: feedback.painLevel,
      difficulty_rating: feedback.difficultyRating,
      energy_level: feedback.energyLevel,
      enjoyment_rating: feedback.enjoymentRating,
      perceived_effectiveness: feedback.perceivedEffectiveness,
      notes: feedback.notes,
      modifications: feedback.modifications,
      completion_status: feedback.completionStatus,
      time_of_day: feedback.timeOfDay,
      duration_minutes: feedback.durationMinutes,
      sets_completed: feedback.setsCompleted,
      reps_completed: feedback.repsCompleted,
      weight_used: feedback.weightUsed,
      created_at: feedback.createdAt,
      updated_at: feedback.updatedAt,
    };
  }

  /**
   * Convert feedback from database format (snake_case) to app format (camelCase)
   */
  private convertFromDbFormat(data: any): ExerciseFeedback {
    return {
      id: data.id,
      userId: data.user_id,
      sessionId: data.session_id,
      exerciseId: data.exercise_id,
      exerciseName: data.exercise_name,
      painLevel: data.pain_level,
      difficultyRating: data.difficulty_rating,
      energyLevel: data.energy_level,
      enjoymentRating: data.enjoyment_rating,
      perceivedEffectiveness: data.perceived_effectiveness,
      notes: data.notes,
      modifications: data.modifications,
      completionStatus: data.completion_status,
      timeOfDay: data.time_of_day,
      durationMinutes: data.duration_minutes,
      setsCompleted: data.sets_completed,
      repsCompleted: data.reps_completed,
      weightUsed: data.weight_used,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const feedbackService = new FeedbackService();
