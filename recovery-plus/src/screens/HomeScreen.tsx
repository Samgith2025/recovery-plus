import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { theme } from '../styles/theme';
import { ExerciseCard, Exercise } from '../components/ui/ExerciseCard';
import { useAppStore } from '../store';
import { getDeviceType, getSafeAreaInsets } from '../utils/device';

// Mock exercises data - this would come from your backend/store
const popularExercises: Exercise[] = [
  {
    id: 'pushups-1',
    name: 'Push-ups',
    targetMuscles: ['chest', 'shoulders', 'triceps'],
    duration: '3m',
    level: 'BEGINNER',
    icon: '💪',
    category: 'strength',
    videoUrl: 'https://youtube.com/watch?v=example1',
    equipment: ['bodyweight'],
  },
  {
    id: 'squats-2',
    name: 'Squats',
    targetMuscles: ['quads', 'glutes', 'hamstrings'],
    duration: '4m',
    level: 'BEGINNER',
    icon: '🦵',
    category: 'strength',
    videoUrl: 'https://youtube.com/watch?v=example2',
    equipment: ['bodyweight'],
  },
  {
    id: 'planks-3',
    name: 'Planks',
    targetMuscles: ['core', 'abs'],
    duration: '5m',
    level: 'BEGINNER',
    icon: '⚡',
    category: 'core',
    videoUrl: 'https://youtube.com/watch?v=example3',
    equipment: ['bodyweight'],
  },
  {
    id: 'burpees-4',
    name: 'Burpees',
    targetMuscles: ['full body'],
    duration: '4m',
    level: 'INTERMEDIATE',
    icon: '❤️',
    category: 'cardio',
    videoUrl: 'https://youtube.com/watch?v=example4',
    equipment: ['bodyweight'],
  },
];

interface HomeScreenProps {
  onExercisePress: (exercise: Exercise) => void;
  onStartChatPress: () => void;
  onGetStartedPress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onExercisePress,
  onStartChatPress,
  onGetStartedPress,
}) => {
  const { user } = useAppStore();
  const deviceType = getDeviceType();
  const safeArea = getSafeAreaInsets();
  const isTablet = deviceType === 'tablet';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: safeArea.top + theme.spacing[2],
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          {/* User greeting */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary[500],
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: theme.spacing[3],
              }}
            >
              <Text style={{ fontSize: 18, color: theme.colors.surface }}>
                👤
              </Text>
            </View>
            <View>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                Hello,
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary,
                }}
              >
                {user?.firstName || 'User'}
              </Text>
            </View>
          </View>

          {/* Start Chat button */}
          <Pressable
            onPress={onStartChatPress}
            style={{
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              borderRadius: theme.borderRadius.full,
              elevation: 2,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: theme.spacing[1] }}>
                💬
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.surface,
                }}
              >
                Start Chat
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Ready to workout card */}
        <Pressable
          onPress={onGetStartedPress}
          style={{
            backgroundColor: theme.colors.primary[500],
            borderRadius: theme.borderRadius.xl,
            padding: theme.spacing[6],
            marginBottom: theme.spacing[8],
            elevation: 4,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          <Text
            style={{
              fontSize: isTablet
                ? theme.typography.fontSize['3xl']
                : theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.surface,
              marginBottom: theme.spacing[3],
            }}
          >
            Ready to workout?
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.primary[100],
              lineHeight: theme.typography.lineHeight.relaxed,
              marginBottom: theme.spacing[4],
            }}
          >
            Tell me what you'd like to work on and I'll find the perfect
            exercises for you.
          </Text>

          <View
            style={{
              backgroundColor: theme.colors.primary[400],
              alignSelf: 'flex-start',
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[3],
              borderRadius: theme.borderRadius.lg,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.surface,
              }}
            >
              Get Started
            </Text>
          </View>
        </Pressable>

        {/* Popular Exercises */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              Popular Exercises
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Try these out
            </Text>
          </View>

          {/* Exercise list */}
          <View style={{ marginTop: theme.spacing[2] }}>
            {popularExercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onPress={onExercisePress}
                backgroundColor={
                  index === 0
                    ? theme.colors.success[50]
                    : index === 1
                      ? theme.colors.error[50]
                      : index === 2
                        ? theme.colors.primary[50]
                        : theme.colors.warning[50]
                }
                showPlayButton={true}
                compact={false}
              />
            ))}
          </View>
        </View>

        {/* Motivational section */}
        <View
          style={{
            backgroundColor: theme.colors.gray[50],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            marginTop: theme.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            💡 Today's Tip
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            Consistency beats intensity. Even a 5-minute workout is better than
            no workout at all!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
