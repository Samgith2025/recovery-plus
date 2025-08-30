import React from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../styles/theme';
import { useAppStore } from '../store';
import { useExerciseStore } from '../store/exercise';
import { getSafeAreaInsets, getDeviceType } from '../utils/device';

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

  // Calculate basic stats from session history
  const totalWorkouts = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce(
    (total, session) => total + (session.duration || 0),
    0
  );
  const currentStreak = calculateStreak();

  function calculateStreak(): number {
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
  }

  const StatCard = ({
    title,
    value,
    subtitle,
  }: {
    title: string;
    value: string | number;
    subtitle: string;
  }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        alignItems: 'center',
        flex: 1,
        marginHorizontal: theme.spacing[2],
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <Text
        style={{
          fontSize: isTablet
            ? theme.typography.fontSize['4xl']
            : theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
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
    const currentWeek = getCurrentWeekActivity();

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
        <Text
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          Your Progress
        </Text>

        {/* Fitness Stats */}
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
            }}
          >
            <StatCard
              title="Workouts"
              value={totalWorkouts}
              subtitle="completed"
            />
            <StatCard
              title="Minutes"
              value={Math.round(totalMinutes)}
              subtitle="exercising"
            />
            <StatCard title="Streak" value={currentStreak} subtitle="days" />
          </View>
        </View>

        {/* Weekly Progress */}
        <WeeklyProgress />

        {/* Recent Activity */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
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
            Recent Activity
          </Text>

          {sessionHistory.slice(0, 5).map((session, index) => (
            <View
              key={session.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: theme.spacing[3],
                borderBottomWidth:
                  index < Math.min(4, sessionHistory.length - 1) ? 1 : 0,
                borderBottomColor: theme.colors.border,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.colors.primary[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: theme.spacing[3],
                }}
              >
                <Text style={{ fontSize: 16 }}>💪</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.text.primary,
                    marginBottom: 2,
                  }}
                >
                  {session.exerciseName || 'Workout Session'}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {new Date(session.createdAt).toLocaleDateString()} •{' '}
                  {session.duration || 0}min
                </Text>
              </View>

              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.success[500],
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                ✓ Done
              </Text>
            </View>
          ))}
        </View>

        {/* Motivational message */}
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            marginTop: theme.spacing[6],
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
            {currentStreak > 0
              ? `🔥 Amazing! You're on a ${currentStreak}-day streak. Keep it up!`
              : `🚀 Start your fitness journey today and build your streak!`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
