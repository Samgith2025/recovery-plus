import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../styles/theme';
import { useAppStore } from '../store';
import { useExerciseStore } from '../store/exercise';
import { getSafeAreaInsets, getDeviceType } from '../utils/device';
import {
  aiProgressAnalytics,
  AIProgressAnalysis,
  ProgressInsight,
  Achievement,
} from '../services/aiProgressAnalytics';

interface ProgressScreenProps {
  onBackPress?: () => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({
  onBackPress,
}) => {
  const safeArea = getSafeAreaInsets();
  const deviceType = getDeviceType();
  const isTablet = deviceType === 'tablet';

  const { user } = useAppStore();
  const { sessionHistory } = useExerciseStore();

  const [progressAnalysis, setProgressAnalysis] =
    useState<AIProgressAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load AI-powered progress analysis
  useEffect(() => {
    loadProgressAnalysis();
  }, [user]);

  const loadProgressAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (user?.id) {
        // Get AI-powered analysis from database
        const analysis = await aiProgressAnalytics.getProgressAnalysis(user.id);
        setProgressAnalysis(analysis);
      } else {
        // Fallback to local session data for demo users
        const fallbackAnalysis = generateFallbackFromLocal();
        setProgressAnalysis(fallbackAnalysis);
      }
    } catch (err) {
      console.error('Failed to load progress analysis:', err);
      setError('Unable to load progress data');
      // Use local data as fallback
      const fallbackAnalysis = generateFallbackFromLocal();
      setProgressAnalysis(fallbackAnalysis);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackFromLocal = (): AIProgressAnalysis => {
    const totalWorkouts = sessionHistory.length;
    const totalMinutes = sessionHistory.reduce(
      (total, session) => total + (session.duration || 0),
      0
    );
    const currentStreak = calculateStreakFromLocal();

    return {
      metrics: {
        totalWorkouts,
        totalMinutes,
        currentStreak,
        averagePainLevel: 0,
        averageDifficulty: 0,
        completionRate: 0,
        improvementTrend: 'stable',
        weeklyActivity: calculateWeeklyActivityFromLocal(),
        achievements: [],
      },
      insights: [],
      weeklyData: {
        currentWeek: calculateWeeklyActivityFromLocal(),
        previousWeek: new Array(7).fill(false),
        workoutCount: 0,
        averageDuration: 0,
        painLevelTrend: 'stable',
        difficultyProgress: 'stable',
      },
      overallAnalysis:
        totalWorkouts > 0
          ? 'Keep up the great work with your fitness routine!'
          : 'Start your fitness journey today!',
      motivationalMessage:
        totalWorkouts > 0
          ? `🎯 ${totalWorkouts} workouts completed! You're making great progress.`
          : '🚀 Ready to start your fitness journey?',
      nextGoals: [
        'Stay consistent',
        'Track your progress',
        'Challenge yourself',
      ],
      aiPowered: false,
    };
  };

  const calculateStreakFromLocal = (): number => {
    if (sessionHistory.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const sortedSessions = [...sessionHistory].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.createdAt);
      const daysDiff = Math.floor(
        (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateWeeklyActivityFromLocal = (): boolean[] => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const weekActivity = new Array(7).fill(false);

    sessionHistory.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      const dayDiff = Math.floor(
        (sessionDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff >= 0 && dayDiff < 7) {
        weekActivity[dayDiff] = true;
      }
    });

    return weekActivity;
  };

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.colors.text.secondary,
            }}
          >
            Analyzing your progress...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error or no data state
  if (!progressAnalysis || progressAnalysis.metrics.totalWorkouts === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />
        <EmptyState />
      </SafeAreaView>
    );
  }

  const {
    metrics,
    insights,
    weeklyData,
    overallAnalysis,
    motivationalMessage,
    nextGoals,
    aiPowered,
  } = progressAnalysis;

  const StatCard = ({
    title,
    value,
    subtitle,
    highlight = false,
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    highlight?: boolean;
  }) => (
    <View
      style={{
        backgroundColor: highlight
          ? theme.colors.primary[50]
          : theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        alignItems: 'center',
        flex: 1,
        marginHorizontal: theme.spacing[2],
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: highlight ? 2 : 0,
        borderColor: highlight ? theme.colors.primary[200] : 'transparent',
      }}
    >
      <Text
        style={{
          fontSize: isTablet
            ? theme.typography.fontSize['4xl']
            : theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: highlight
            ? theme.colors.primary[600]
            : theme.colors.text.primary,
          marginBottom: theme.spacing[1],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[1],
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {subtitle}
      </Text>
    </View>
  );

  const InsightCard = ({ insight }: { insight: ProgressInsight }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[3],
        borderLeftWidth: 4,
        borderLeftColor:
          insight.type === 'positive'
            ? theme.colors.success[500]
            : insight.type === 'actionable'
              ? theme.colors.warning[500]
              : theme.colors.gray[400],
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[1],
        }}
      >
        {insight.title}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          lineHeight: theme.typography.lineHeight.relaxed,
          marginBottom: insight.recommendation ? theme.spacing[2] : 0,
        }}
      >
        {insight.description}
      </Text>
      {insight.recommendation && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.warning[600],
            fontStyle: 'italic',
          }}
        >
          💡 {insight.recommendation}
        </Text>
      )}
    </View>
  );

  const AchievementBadge = ({ achievement }: { achievement: Achievement }) => (
    <View
      style={{
        backgroundColor: theme.colors.primary[50],
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        marginRight: theme.spacing[2],
        borderWidth: 1,
        borderColor: theme.colors.primary[200],
      }}
    >
      <Text style={{ fontSize: 16 }}>{achievement.icon}</Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.primary[600],
          fontWeight: theme.typography.fontWeight.medium,
          textAlign: 'center',
          marginTop: 2,
        }}
      >
        {achievement.title}
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[6],
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.gray[100],
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing[6],
        }}
      >
        <Text style={{ fontSize: 32 }}>📈</Text>
      </View>

      <Text
        style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          textAlign: 'center',
          marginBottom: theme.spacing[3],
        }}
      >
        Track Your Progress
      </Text>

      <Text
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          textAlign: 'center',
          lineHeight: theme.typography.lineHeight.relaxed,
        }}
      >
        Start working out to see your fitness journey and achievements here
      </Text>
    </View>
  );

  const WeeklyProgress = () => {
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentWeek = weeklyData.currentWeek;

    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[4],
          elevation: 2,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[4],
          }}
        >
          This Week
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          {daysOfWeek.map((day, index) => {
            const hasActivity = currentWeek[index];
            return (
              <View
                key={day}
                style={{
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: hasActivity ? 32 : 8,
                    backgroundColor: hasActivity
                      ? theme.colors.primary[500]
                      : theme.colors.gray[200],
                    borderRadius: 4,
                    marginBottom: theme.spacing[2],
                  }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: hasActivity
                      ? theme.colors.text.primary
                      : theme.colors.text.secondary,
                    fontWeight: hasActivity
                      ? theme.typography.fontWeight.medium
                      : theme.typography.fontWeight.normal,
                  }}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  function getCurrentWeekActivity(): boolean[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday

    const weekActivity = new Array(7).fill(false);

    sessionHistory.forEach(session => {
      const sessionDate = new Date(session.createdAt);
      const dayDiff = Math.floor(
        (sessionDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff >= 0 && dayDiff < 7) {
        weekActivity[dayDiff] = true;
      }
    });

    return weekActivity;
  }

  if (totalWorkouts === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: safeArea.top + theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: theme.spacing[6] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            }}
          >
            Your Progress
          </Text>
          {aiPowered && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing[2],
              }}
            >
              <Text style={{ fontSize: 12, color: theme.colors.primary[600] }}>
                🤖 AI-Powered Analytics
              </Text>
            </View>
          )}
          {/* Overall Analysis */}
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
              marginHorizontal: theme.spacing[4],
            }}
          >
            {overallAnalysis}
          </Text>
        </View>

        {/* Achievements */}
        {metrics.achievements.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              🏆 Recent Achievements
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {metrics.achievements.map((achievement, index) => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Enhanced Fitness Stats */}
        <View
          style={{
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            Fitness Stats
          </Text>

          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: -theme.spacing[2],
              marginBottom: theme.spacing[4],
            }}
          >
            <StatCard
              title="Workouts"
              value={metrics.totalWorkouts}
              subtitle="completed"
              highlight={metrics.currentStreak > 0}
            />
            <StatCard
              title="Minutes"
              value={Math.round(metrics.totalMinutes)}
              subtitle="exercising"
            />
            <StatCard
              title="Streak"
              value={metrics.currentStreak}
              subtitle="days"
              highlight={metrics.currentStreak >= 3}
            />
          </View>

          {/* Additional stats row */}
          <View
            style={{
              flexDirection: 'row',
              marginHorizontal: -theme.spacing[2],
            }}
          >
            <StatCard
              title="Completion"
              value={`${Math.round(metrics.completionRate * 100)}%`}
              subtitle="success rate"
            />
            {metrics.averagePainLevel > 0 && (
              <StatCard
                title="Avg Pain"
                value={`${metrics.averagePainLevel.toFixed(1)}/10`}
                subtitle="pain level"
              />
            )}
            {metrics.improvementTrend !== 'stable' && (
              <StatCard
                title="Trend"
                value={metrics.improvementTrend === 'improving' ? '📈' : '📉'}
                subtitle={metrics.improvementTrend}
              />
            )}
          </View>
        </View>

        {/* AI Insights */}
        {insights.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              💡 AI Insights
            </Text>
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </View>
        )}

        {/* Weekly Progress */}
        <WeeklyProgress />

        {/* Next Goals */}
        {nextGoals.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              🎯 Your Next Goals
            </Text>
            {nextGoals.map((goal, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[2],
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.primary[400],
                    marginRight: theme.spacing[3],
                  }}
                />
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    color: theme.colors.text.primary,
                    flex: 1,
                  }}
                >
                  {goal}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* AI-Generated Motivational message */}
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.primary[200],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.primary[700],
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {motivationalMessage}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
