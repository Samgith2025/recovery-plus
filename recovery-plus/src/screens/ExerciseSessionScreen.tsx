import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { theme } from '../styles/theme';
import { Exercise } from '../types';
import { useExerciseStore } from '../store/exercise';
import { getSafeAreaInsets } from '../utils/device';
import { exerciseLogger } from '../services/logger';
import { ExerciseTimer } from '../components/ui/ExerciseTimer';
import { RatingScale } from '../components/ui/RatingScale';

interface ExerciseSessionScreenProps {
  exercise: Exercise;
  onBackPress: () => void;
  onCompleteWorkout: () => void;
}

export const ExerciseSessionScreen: React.FC<ExerciseSessionScreenProps> = ({
  exercise,
  onBackPress,
  onCompleteWorkout,
}) => {
  const [showSetFeedback, setShowSetFeedback] = useState(false);
  const [currentSetPain, setCurrentSetPain] = useState<number | undefined>();
  const [currentSetDifficulty, setCurrentSetDifficulty] = useState<
    number | undefined
  >();
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  const safeArea = getSafeAreaInsets();

  const {
    currentSession,
    completeCurrentSet,
    startNextSet,
    pauseTimer,
    resumeTimer,
    startRest,
    completeRest,
    updateSetFeedback,
    completeExercise,
    stopExercise,
  } = useExerciseStore();

  const currentSet = currentSession?.sets.find(
    set => set.setNumber === currentSession.currentSet
  );

  const isLastSet =
    currentSession && currentSession.currentSet >= currentSession.sets.length;
  const hasMoreSets =
    currentSession && currentSession.currentSet < currentSession.sets.length;

  useEffect(() => {
    exerciseLogger.info('Exercise session screen opened', {
      exerciseId: exercise.id,
      sessionId: currentSession?.id,
      currentSet: currentSession?.currentSet,
    });
  }, [exercise.id, currentSession?.id, currentSession?.currentSet]);

  const handleSetComplete = () => {
    if (!currentSession) return;

    completeCurrentSet();
    setShowSetFeedback(true);

    exerciseLogger.info('Set completed', {
      exerciseId: exercise.id,
      sessionId: currentSession.id,
      setNumber: currentSession.currentSet,
    });
  };

  const handleSetFeedbackSubmit = () => {
    if (!currentSession) return;

    if (currentSetPain !== undefined || currentSetDifficulty !== undefined) {
      updateSetFeedback(currentSession.currentSet, {
        painLevel: currentSetPain,
        difficultyRating: currentSetDifficulty,
      });
    }

    setShowSetFeedback(false);
    setCurrentSetPain(undefined);
    setCurrentSetDifficulty(undefined);

    // Start rest period if there are more sets
    if (hasMoreSets) {
      setIsResting(true);
      setRestTimeRemaining(exercise.restTime || 60);
      startRest();
    } else {
      // All sets completed
      handleWorkoutComplete();
    }
  };

  const handleRestComplete = () => {
    setIsResting(false);
    completeRest();
    startNextSet();
  };

  const handleWorkoutComplete = () => {
    if (!currentSession) return;

    const completedSession = {
      ...currentSession,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    completeExercise(completedSession);

    exerciseLogger.info('Workout completed', {
      exerciseId: exercise.id,
      sessionId: currentSession.id,
      totalSetsCompleted: currentSession.totalSetsCompleted,
    });

    onCompleteWorkout();
  };

  const handleStopWorkout = () => {
    Alert.alert(
      'Stop Workout',
      'Are you sure you want to stop this workout? Your progress will be lost.',
      [
        { text: 'Continue Workout', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            stopExercise();
            onBackPress();
          },
        },
      ]
    );
  };

  const getSetInstructions = () => {
    if (exercise.type === 'isometric') {
      return `Hold this position for ${exercise.holdTime || 30} seconds`;
    } else if (exercise.reps) {
      return `Perform ${exercise.reps} repetitions`;
    } else {
      return 'Follow the exercise instructions';
    }
  };

  if (!currentSession) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.primary,
            }}
          >
            No active session found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Rest Period View
  if (isResting) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />

        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing[4],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            Rest Time
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[8],
              textAlign: 'center',
            }}
          >
            Prepare for Set {currentSession.currentSet + 1}
          </Text>

          <ExerciseTimer
            duration={restTimeRemaining}
            type="countdown"
            isRunning={true}
            isPaused={false}
            onComplete={handleRestComplete}
            onTick={remaining => setRestTimeRemaining(remaining)}
            showControls={false}
          />

          <Pressable
            onPress={handleRestComplete}
            style={{
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: theme.spacing[6],
              paddingVertical: theme.spacing[3],
              borderRadius: theme.borderRadius.lg,
              marginTop: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.surface,
              }}
            >
              Skip Rest
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Set Feedback View
  if (showSetFeedback) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.background}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing[4],
            justifyContent: 'center',
            minHeight: '100%',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            How was that set?
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[8],
              textAlign: 'center',
            }}
          >
            Your feedback helps us adjust future workouts
          </Text>

          {/* Pain Level */}
          <View style={{ marginBottom: theme.spacing[6] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              Pain Level (1-10)
            </Text>
            <RatingScale
              min={1}
              max={10}
              value={currentSetPain}
              onChange={setCurrentSetPain}
              labels={['No Pain', 'Severe Pain']}
              color={theme.colors.error[500]}
            />
          </View>

          {/* Difficulty */}
          <View style={{ marginBottom: theme.spacing[8] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              Difficulty (1-10)
            </Text>
            <RatingScale
              min={1}
              max={10}
              value={currentSetDifficulty}
              onChange={setCurrentSetDifficulty}
              labels={['Too Easy', 'Too Hard']}
              color={theme.colors.primary[500]}
            />
          </View>

          <Pressable
            onPress={handleSetFeedbackSubmit}
            style={{
              backgroundColor: theme.colors.primary[500],
              paddingVertical: theme.spacing[4],
              borderRadius: theme.borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.surface,
              }}
            >
              {hasMoreSets ? 'Continue to Rest' : 'Complete Workout'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main Exercise View
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: safeArea.top + theme.spacing[2],
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[4],
          backgroundColor: theme.colors.primary[50],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing[4],
          }}
        >
          <Pressable
            onPress={onBackPress}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>←</Text>
          </Pressable>

          <Pressable
            onPress={handleStopWorkout}
            style={{
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[2],
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.error[500],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.surface,
              }}
            >
              Stop
            </Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
            }}
          >
            {exercise.name}
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[3],
            }}
          >
            Set {currentSession.currentSet} of {currentSession.sets.length}
          </Text>

          {/* Progress bar */}
          <View
            style={{
              width: '100%',
              height: 6,
              backgroundColor: theme.colors.gray[200],
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${(currentSession.totalSetsCompleted / currentSession.sets.length) * 100}%`,
                height: '100%',
                backgroundColor: theme.colors.primary[500],
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing[4] }}
      >
        {/* Current Set Info */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[6],
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
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            Current Set Instructions
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            {getSetInstructions()}
          </Text>

          {/* Exercise parameters */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: theme.spacing[4],
            }}
          >
            {exercise.reps && (
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.primary[500],
                  }}
                >
                  {exercise.reps}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  Reps
                </Text>
              </View>
            )}

            {exercise.holdTime && (
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize['2xl'],
                    fontWeight: theme.typography.fontWeight.bold,
                    color: theme.colors.primary[500],
                  }}
                >
                  {exercise.holdTime}s
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  Hold
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timer */}
        {(exercise.type === 'isometric' || exercise.holdTime) && currentSet && (
          <ExerciseTimer
            holdTime={exercise.holdTime}
            type="hold"
            isRunning={currentSession.isTimerRunning}
            isPaused={currentSession.isPaused}
            onComplete={handleSetComplete}
            onPause={pauseTimer}
            onResume={resumeTimer}
          />
        )}

        {/* Manual Complete Button (for non-timed exercises) */}
        {exercise.type !== 'isometric' && !exercise.holdTime && (
          <View style={{ alignItems: 'center', marginTop: theme.spacing[6] }}>
            <Pressable
              onPress={handleSetComplete}
              style={{
                backgroundColor: theme.colors.success[500],
                paddingHorizontal: theme.spacing[8],
                paddingVertical: theme.spacing[4],
                borderRadius: theme.borderRadius.lg,
                elevation: 4,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.surface,
                }}
              >
                Complete Set
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
