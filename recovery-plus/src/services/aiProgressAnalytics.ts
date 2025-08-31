import { aiService } from './openai';
import { supabase } from './supabase';
import { exerciseLogger } from './logger';

export interface ProgressMetrics {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  averagePainLevel: number;
  averageDifficulty: number;
  completionRate: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  weeklyActivity: boolean[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'milestone' | 'streak' | 'consistency' | 'improvement';
}

export interface ProgressInsight {
  type: 'positive' | 'neutral' | 'actionable';
  title: string;
  description: string;
  recommendation?: string;
  confidence: number;
}

export interface WeeklyProgressData {
  currentWeek: boolean[];
  previousWeek: boolean[];
  workoutCount: number;
  averageDuration: number;
  painLevelTrend: 'improving' | 'stable' | 'worsening';
  difficultyProgress: 'easier' | 'stable' | 'challenging';
}

export interface AIProgressAnalysis {
  metrics: ProgressMetrics;
  insights: ProgressInsight[];
  weeklyData: WeeklyProgressData;
  overallAnalysis: string;
  motivationalMessage: string;
  nextGoals: string[];
  aiPowered: boolean;
  error?: string;
}

class AIProgressAnalyticsService {
  /**
   * Get comprehensive AI-powered progress analysis
   */
  async getProgressAnalysis(userId: string): Promise<AIProgressAnalysis> {
    try {
      // Fetch exercise session data from database
      const sessionData = await this.getUserSessionData(userId);
      const feedbackData = await this.getUserFeedbackData(userId);

      if (!sessionData || sessionData.length === 0) {
        return this.generateEmptyStateAnalysis();
      }

      // Calculate base metrics
      const metrics = this.calculateProgressMetrics(sessionData, feedbackData);
      const weeklyData = this.calculateWeeklyProgress(
        sessionData,
        feedbackData
      );

      // Generate AI-powered insights and analysis
      const aiAnalysis = await this.generateAIProgressInsights(
        userId,
        metrics,
        weeklyData,
        sessionData,
        feedbackData
      );

      return {
        ...aiAnalysis,
        metrics,
        weeklyData,
        aiPowered: true,
      };
    } catch (error) {
      exerciseLogger.error('Failed to generate AI progress analysis', {
        error,
        userId,
      });
      return this.generateFallbackAnalysis(userId);
    }
  }

  /**
   * Get user exercise session data from database
   */
  private async getUserSessionData(userId: string) {
    const { data: sessions, error } = await supabase
      .from('exercise_sessions')
      .select(
        `
        id,
        exercise_id,
        exercise_name,
        completed_at,
        duration_minutes,
        sets_completed,
        total_sets,
        reps_completed,
        pain_level,
        difficulty_rating,
        completion_status,
        notes
      `
      )
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (error) {
      exerciseLogger.warn('Failed to fetch session data', { error, userId });
      return [];
    }

    return sessions || [];
  }

  /**
   * Get user exercise feedback data from database
   */
  private async getUserFeedbackData(userId: string) {
    const { data: feedback, error } = await supabase
      .from('exercise_sessions')
      .select(
        `
        exercise_id,
        exercise_name,
        pain_level,
        difficulty_rating,
        completion_status,
        completed_at,
        notes
      `
      )
      .eq('user_id', userId)
      .not('pain_level', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) {
      exerciseLogger.warn('Failed to fetch feedback data', { error, userId });
      return [];
    }

    return feedback || [];
  }

  /**
   * Calculate core progress metrics
   */
  private calculateProgressMetrics(
    sessionData: any[],
    feedbackData: any[]
  ): ProgressMetrics {
    const totalWorkouts = sessionData.length;
    const totalMinutes = sessionData.reduce(
      (sum, session) => sum + (session.duration_minutes || 0),
      0
    );
    const currentStreak = this.calculateStreak(sessionData);

    const averagePainLevel =
      feedbackData.length > 0
        ? feedbackData.reduce((sum, f) => sum + (f.pain_level || 0), 0) /
          feedbackData.length
        : 0;

    const averageDifficulty =
      feedbackData.length > 0
        ? feedbackData.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) /
          feedbackData.length
        : 0;

    const completedSessions = sessionData.filter(
      s => s.completion_status === 'completed'
    );
    const completionRate =
      totalWorkouts > 0 ? completedSessions.length / totalWorkouts : 0;

    const improvementTrend = this.calculateImprovementTrend(feedbackData);
    const weeklyActivity = this.calculateWeeklyActivity(sessionData);
    const achievements = this.generateAchievements(
      sessionData,
      currentStreak,
      completionRate
    );

    return {
      totalWorkouts,
      totalMinutes,
      currentStreak,
      averagePainLevel,
      averageDifficulty,
      completionRate,
      improvementTrend,
      weeklyActivity,
      achievements,
    };
  }

  /**
   * Calculate weekly progress data
   */
  private calculateWeeklyProgress(
    sessionData: any[],
    feedbackData: any[]
  ): WeeklyProgressData {
    const currentWeek = this.calculateWeeklyActivity(sessionData);
    const previousWeek = this.calculateWeeklyActivity(sessionData, 7);

    const thisWeekSessions = this.getWeekSessions(sessionData, 0);
    const workoutCount = thisWeekSessions.length;
    const averageDuration =
      workoutCount > 0
        ? thisWeekSessions.reduce(
            (sum, s) => sum + (s.duration_minutes || 0),
            0
          ) / workoutCount
        : 0;

    const painLevelTrend = this.calculatePainTrend(feedbackData);
    const difficultyProgress = this.calculateDifficultyProgress(feedbackData);

    return {
      currentWeek,
      previousWeek,
      workoutCount,
      averageDuration,
      painLevelTrend,
      difficultyProgress,
    };
  }

  /**
   * Generate AI-powered insights and analysis
   */
  private async generateAIProgressInsights(
    userId: string,
    metrics: ProgressMetrics,
    weeklyData: WeeklyProgressData,
    sessionData: any[],
    feedbackData: any[]
  ): Promise<Omit<AIProgressAnalysis, 'metrics' | 'weeklyData' | 'aiPowered'>> {
    try {
      const recentSessions = sessionData.slice(0, 10);
      const recentFeedback = feedbackData.slice(0, 10);

      const contextPrompt = `
You are an AI fitness coach analyzing a user's recovery progress. Generate insights based on this data:

METRICS:
- Total workouts: ${metrics.totalWorkouts}
- Total minutes: ${metrics.totalMinutes}
- Current streak: ${metrics.currentStreak} days
- Average pain level: ${metrics.averagePainLevel.toFixed(1)}/10
- Average difficulty: ${metrics.averageDifficulty.toFixed(1)}/10
- Completion rate: ${(metrics.completionRate * 100).toFixed(1)}%
- Improvement trend: ${metrics.improvementTrend}

WEEKLY DATA:
- This week workouts: ${weeklyData.workoutCount}
- Average duration: ${weeklyData.averageDuration.toFixed(1)} minutes
- Pain trend: ${weeklyData.painLevelTrend}
- Difficulty progress: ${weeklyData.difficultyProgress}

RECENT SESSIONS (last 10):
${recentSessions.map(s => `- ${s.exercise_name}: ${s.completion_status}, pain: ${s.pain_level || 'N/A'}, difficulty: ${s.difficulty_rating || 'N/A'}`).join('\n')}

Generate a JSON response with:
1. insights: Array of 3-5 insights (type: positive/neutral/actionable, title, description, recommendation if actionable, confidence 0-1)
2. overallAnalysis: 2-3 sentence analysis of overall progress
3. motivationalMessage: Encouraging message based on their progress
4. nextGoals: Array of 2-3 specific next goals

Focus on recovery progress, pain reduction, consistency, and encouraging continued engagement.
`;

      const response = await openAIService.generateChatCompletion(
        [{ role: 'user', content: contextPrompt }],
        { temperature: 0.7, max_tokens: 1000 }
      );

      const aiData = JSON.parse(response);

      return {
        insights: aiData.insights || [],
        overallAnalysis:
          aiData.overallAnalysis ||
          'Your progress is being tracked. Keep up the great work!',
        motivationalMessage:
          aiData.motivationalMessage ||
          'Every step counts in your recovery journey!',
        nextGoals: aiData.nextGoals || [
          'Continue regular exercise',
          'Monitor pain levels',
          'Stay consistent',
        ],
      };
    } catch (error) {
      exerciseLogger.warn(
        'AI progress insights generation failed, using fallback',
        { error }
      );

      return {
        insights: this.generateFallbackInsights(metrics, weeklyData),
        overallAnalysis: this.generateFallbackAnalysis(metrics).overallAnalysis,
        motivationalMessage: this.generateMotivationalMessage(metrics),
        nextGoals: this.generateNextGoals(metrics),
      };
    }
  }

  /**
   * Calculate current workout streak
   */
  private calculateStreak(sessionData: any[]): number {
    if (sessionData.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedSessions = [...sessionData]
      .filter(s => s.completion_status === 'completed')
      .sort(
        (a, b) =>
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
      );

    if (sortedSessions.length === 0) return 0;

    // Check if there's a workout today or yesterday
    const mostRecent = new Date(sortedSessions[0].completed_at);
    mostRecent.setHours(0, 0, 0, 0);
    const daysSinceRecent = Math.floor(
      (today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceRecent > 1) return 0;

    // Count consecutive days
    let currentDate = new Date(mostRecent);
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completed_at);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        const dayGap = Math.floor(
          (currentDate.getTime() - sessionDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (dayGap > 1) break;
        streak++;
        currentDate = new Date(sessionDate);
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }

    return streak;
  }

  /**
   * Calculate weekly activity pattern
   */
  private calculateWeeklyActivity(
    sessionData: any[],
    weeksAgo: number = 0
  ): boolean[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 - weeksAgo * 7); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekActivity = new Array(7).fill(false);

    sessionData.forEach(session => {
      const sessionDate = new Date(session.completed_at);

      if (
        sessionDate >= startOfWeek &&
        sessionDate <= endOfWeek &&
        session.completion_status === 'completed'
      ) {
        const dayIndex = Math.floor(
          (sessionDate.getTime() - startOfWeek.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (dayIndex >= 0 && dayIndex < 7) {
          weekActivity[dayIndex] = true;
        }
      }
    });

    return weekActivity;
  }

  /**
   * Get sessions from specific week
   */
  private getWeekSessions(sessionData: any[], weeksAgo: number): any[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 - weeksAgo * 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return sessionData.filter(session => {
      const sessionDate = new Date(session.completed_at);
      return sessionDate >= startOfWeek && sessionDate <= endOfWeek;
    });
  }

  /**
   * Calculate improvement trend
   */
  private calculateImprovementTrend(
    feedbackData: any[]
  ): 'improving' | 'stable' | 'declining' {
    if (feedbackData.length < 6) return 'stable';

    const recent = feedbackData.slice(0, Math.floor(feedbackData.length / 2));
    const older = feedbackData.slice(Math.floor(feedbackData.length / 2));

    const recentAvgPain =
      recent.reduce((sum, f) => sum + (f.pain_level || 0), 0) / recent.length;
    const olderAvgPain =
      older.reduce((sum, f) => sum + (f.pain_level || 0), 0) / older.length;

    const recentAvgDiff =
      recent.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) /
      recent.length;
    const olderAvgDiff =
      older.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) /
      older.length;

    const painImprovement = olderAvgPain - recentAvgPain; // Positive = less pain
    const difficultyChange = recentAvgDiff - olderAvgDiff; // Positive = handling harder exercises

    const overallImprovement = painImprovement + difficultyChange * 0.5;

    if (overallImprovement > 0.5) return 'improving';
    if (overallImprovement < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate pain level trend
   */
  private calculatePainTrend(
    feedbackData: any[]
  ): 'improving' | 'stable' | 'worsening' {
    if (feedbackData.length < 4) return 'stable';

    const recent = feedbackData.slice(0, Math.floor(feedbackData.length / 2));
    const older = feedbackData.slice(Math.floor(feedbackData.length / 2));

    const recentAvg =
      recent.reduce((sum, f) => sum + (f.pain_level || 0), 0) / recent.length;
    const olderAvg =
      older.reduce((sum, f) => sum + (f.pain_level || 0), 0) / older.length;

    const improvement = olderAvg - recentAvg;

    if (improvement > 0.7) return 'improving';
    if (improvement < -0.7) return 'worsening';
    return 'stable';
  }

  /**
   * Calculate difficulty progress
   */
  private calculateDifficultyProgress(
    feedbackData: any[]
  ): 'easier' | 'stable' | 'challenging' {
    if (feedbackData.length < 4) return 'stable';

    const recent = feedbackData.slice(0, Math.floor(feedbackData.length / 2));
    const older = feedbackData.slice(Math.floor(feedbackData.length / 2));

    const recentAvg =
      recent.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) /
      recent.length;
    const olderAvg =
      older.reduce((sum, f) => sum + (f.difficulty_rating || 0), 0) /
      older.length;

    const change = recentAvg - olderAvg;

    if (change > 0.7) return 'challenging';
    if (change < -0.7) return 'easier';
    return 'stable';
  }

  /**
   * Generate achievements based on progress
   */
  private generateAchievements(
    sessionData: any[],
    streak: number,
    completionRate: number
  ): Achievement[] {
    const achievements: Achievement[] = [];
    const totalWorkouts = sessionData.length;

    // Milestone achievements
    if (totalWorkouts >= 1) {
      achievements.push({
        id: 'first_workout',
        title: 'First Steps',
        description: 'Completed your first workout',
        icon: '🎯',
        unlockedAt:
          sessionData[sessionData.length - 1]?.completed_at ||
          new Date().toISOString(),
        category: 'milestone',
      });
    }

    if (totalWorkouts >= 10) {
      achievements.push({
        id: 'ten_workouts',
        title: 'Getting Strong',
        description: 'Completed 10 workouts',
        icon: '💪',
        unlockedAt:
          sessionData[Math.max(0, sessionData.length - 10)]?.completed_at ||
          new Date().toISOString(),
        category: 'milestone',
      });
    }

    if (totalWorkouts >= 25) {
      achievements.push({
        id: 'quarter_century',
        title: 'Quarter Century',
        description: 'Completed 25 workouts',
        icon: '🏆',
        unlockedAt:
          sessionData[Math.max(0, sessionData.length - 25)]?.completed_at ||
          new Date().toISOString(),
        category: 'milestone',
      });
    }

    // Streak achievements
    if (streak >= 3) {
      achievements.push({
        id: 'three_day_streak',
        title: 'On Fire!',
        description: '3-day workout streak',
        icon: '🔥',
        unlockedAt: new Date().toISOString(),
        category: 'streak',
      });
    }

    if (streak >= 7) {
      achievements.push({
        id: 'week_streak',
        title: 'Week Warrior',
        description: '7-day workout streak',
        icon: '⚡',
        unlockedAt: new Date().toISOString(),
        category: 'streak',
      });
    }

    // Consistency achievements
    if (completionRate >= 0.8 && totalWorkouts >= 10) {
      achievements.push({
        id: 'consistent_performer',
        title: 'Consistent Performer',
        description: '80% completion rate',
        icon: '🎖️',
        unlockedAt: new Date().toISOString(),
        category: 'consistency',
      });
    }

    return achievements.slice(-3); // Return latest 3 achievements
  }

  /**
   * Generate fallback insights when AI fails
   */
  private generateFallbackInsights(
    metrics: ProgressMetrics,
    weeklyData: WeeklyProgressData
  ): ProgressInsight[] {
    const insights: ProgressInsight[] = [];

    // Streak insight
    if (metrics.currentStreak > 0) {
      insights.push({
        type: 'positive',
        title: 'Great Consistency!',
        description: `You're on a ${metrics.currentStreak}-day workout streak.`,
        confidence: 0.9,
      });
    }

    // Pain level insight
    if (metrics.averagePainLevel < 4) {
      insights.push({
        type: 'positive',
        title: 'Low Pain Levels',
        description: `Your average pain level is ${metrics.averagePainLevel.toFixed(1)}/10, which is excellent.`,
        confidence: 0.8,
      });
    } else if (metrics.averagePainLevel > 7) {
      insights.push({
        type: 'actionable',
        title: 'Monitor Pain Levels',
        description: `Your average pain level is ${metrics.averagePainLevel.toFixed(1)}/10.`,
        recommendation:
          'Consider reducing exercise intensity and consult with a healthcare provider.',
        confidence: 0.9,
      });
    }

    // Completion rate insight
    if (metrics.completionRate >= 0.8) {
      insights.push({
        type: 'positive',
        title: 'High Completion Rate',
        description: `You complete ${(metrics.completionRate * 100).toFixed(0)}% of your workouts.`,
        confidence: 0.9,
      });
    }

    // Weekly activity insight
    if (weeklyData.workoutCount >= 3) {
      insights.push({
        type: 'positive',
        title: 'Active Week',
        description: `You've completed ${weeklyData.workoutCount} workouts this week.`,
        confidence: 0.8,
      });
    } else if (weeklyData.workoutCount === 0) {
      insights.push({
        type: 'actionable',
        title: 'Get Moving',
        description: 'No workouts completed this week yet.',
        recommendation: 'Try to schedule a light exercise session today.',
        confidence: 0.9,
      });
    }

    return insights;
  }

  /**
   * Generate motivational message based on progress
   */
  private generateMotivationalMessage(metrics: ProgressMetrics): string {
    if (metrics.currentStreak >= 7) {
      return `🔥 Incredible! You're on a ${metrics.currentStreak}-day streak. Your dedication is paying off!`;
    } else if (metrics.currentStreak >= 3) {
      return `💪 You're building great momentum with a ${metrics.currentStreak}-day streak. Keep it up!`;
    } else if (metrics.totalWorkouts >= 10) {
      return `🎯 ${metrics.totalWorkouts} workouts completed! Your consistency is building a stronger you.`;
    } else if (metrics.totalWorkouts > 0) {
      return `🚀 Great start! Every workout counts toward your recovery journey.`;
    } else {
      return `🌟 Ready to start your fitness journey? Every step forward is progress!`;
    }
  }

  /**
   * Generate next goals based on progress
   */
  private generateNextGoals(metrics: ProgressMetrics): string[] {
    const goals: string[] = [];

    if (metrics.currentStreak === 0) {
      goals.push('Start a 3-day workout streak');
    } else if (metrics.currentStreak < 7) {
      goals.push('Build a 7-day workout streak');
    } else {
      goals.push('Maintain your current streak');
    }

    if (metrics.averagePainLevel > 5) {
      goals.push('Focus on reducing average pain levels');
    } else {
      goals.push('Continue managing pain effectively');
    }

    if (metrics.completionRate < 0.8) {
      goals.push('Improve workout completion rate');
    } else {
      goals.push('Try slightly more challenging exercises');
    }

    return goals;
  }

  /**
   * Generate analysis for users with no data
   */
  private generateEmptyStateAnalysis(): AIProgressAnalysis {
    return {
      metrics: {
        totalWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        averagePainLevel: 0,
        averageDifficulty: 0,
        completionRate: 0,
        improvementTrend: 'stable',
        weeklyActivity: new Array(7).fill(false),
        achievements: [],
      },
      insights: [],
      weeklyData: {
        currentWeek: new Array(7).fill(false),
        previousWeek: new Array(7).fill(false),
        workoutCount: 0,
        averageDuration: 0,
        painLevelTrend: 'stable',
        difficultyProgress: 'stable',
      },
      overallAnalysis:
        'Start your fitness journey to see personalized progress insights!',
      motivationalMessage:
        '🌟 Ready to begin? Every fitness journey starts with a single workout!',
      nextGoals: [
        'Complete your first workout',
        'Establish a routine',
        'Track your progress',
      ],
      aiPowered: false,
    };
  }

  /**
   * Generate fallback analysis when AI fails
   */
  private generateFallbackAnalysis(userId: string): AIProgressAnalysis {
    return {
      metrics: {
        totalWorkouts: 0,
        totalMinutes: 0,
        currentStreak: 0,
        averagePainLevel: 0,
        averageDifficulty: 0,
        completionRate: 0,
        improvementTrend: 'stable',
        weeklyActivity: new Array(7).fill(false),
        achievements: [],
      },
      insights: [
        {
          type: 'neutral',
          title: 'Progress Analysis',
          description: 'Continue with your regular exercise routine.',
          confidence: 0.5,
        },
      ],
      weeklyData: {
        currentWeek: new Array(7).fill(false),
        previousWeek: new Array(7).fill(false),
        workoutCount: 0,
        averageDuration: 0,
        painLevelTrend: 'stable',
        difficultyProgress: 'stable',
      },
      overallAnalysis:
        'Keep up with your recovery routine and track your progress.',
      motivationalMessage: 'Every step counts in your recovery journey!',
      nextGoals: ['Stay consistent', 'Monitor progress', 'Adjust as needed'],
      aiPowered: false,
      error: 'Analysis service temporarily unavailable',
    };
  }
}

export const aiProgressAnalytics = new AIProgressAnalyticsService();
