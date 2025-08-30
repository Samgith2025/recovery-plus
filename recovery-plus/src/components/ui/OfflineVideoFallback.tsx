import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import { Exercise } from './ExerciseCard';

interface OfflineVideoFallbackProps {
  exercise: Exercise;
  onRetry?: () => void;
  onViewInstructions?: () => void;
  isRetrying?: boolean;
}

export const OfflineVideoFallback: React.FC<OfflineVideoFallbackProps> = ({
  exercise,
  onRetry,
  onViewInstructions,
  isRetrying = false,
}) => {
  const getExerciseInstructions = (exerciseName: string): string[] => {
    const name = exerciseName.toLowerCase();

    // Basic instructions for common exercises
    const instructions: Record<string, string[]> = {
      'push up': [
        'Start in a high plank position with hands slightly wider than shoulders',
        'Keep your body in a straight line from head to heels',
        'Lower your chest towards the ground by bending your elbows',
        'Push back up to the starting position',
        'Keep your core engaged throughout the movement',
      ],
      squat: [
        'Stand with feet hip-width apart, toes slightly turned out',
        'Lower your hips back and down as if sitting in a chair',
        'Keep your chest up and knees tracking over your toes',
        'Lower until your thighs are parallel to the ground',
        'Push through your heels to return to standing',
      ],
      plank: [
        'Start in a forearm plank position',
        'Keep your body in a straight line from head to heels',
        'Engage your core and breathe normally',
        'Hold the position without letting your hips sag',
        'Keep your shoulders directly over your elbows',
      ],
      burpee: [
        'Start standing with feet hip-width apart',
        'Drop into a squat and place hands on the ground',
        'Jump feet back into a high plank position',
        'Perform a push-up (optional for beginners)',
        'Jump feet back to squat position',
        'Explode up into a jump with arms overhead',
      ],
      lunges: [
        'Stand tall with feet hip-width apart',
        'Step forward with one leg, lowering your hips',
        'Keep both knees at 90-degree angles',
        'Your front knee should be over your ankle',
        'Push off your front foot to return to starting position',
        'Alternate legs or complete all reps on one side first',
      ],
    };

    // Find matching exercise or return generic instructions
    for (const [key, steps] of Object.entries(instructions)) {
      if (name.includes(key)) {
        return steps;
      }
    }

    // Generic fallback instructions
    return [
      'Follow proper form and technique for this exercise',
      'Start with a light intensity and gradually increase',
      'Focus on controlled movements',
      'Breathe steadily throughout the exercise',
      'Listen to your body and rest when needed',
    ];
  };

  const instructions = getExerciseInstructions(exercise.name);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.gray[50],
        padding: theme.spacing[4],
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          marginBottom: theme.spacing[6],
        }}
      >
        <Text
          style={{
            fontSize: 48,
            marginBottom: theme.spacing[3],
          }}
        >
          📋
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          Video Unavailable
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          Check your connection or follow the written instructions below
        </Text>
      </View>

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[4],
          }}
        >
          How to perform {exercise.name}
        </Text>

        {instructions.map((step, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              marginBottom: theme.spacing[3],
              alignItems: 'flex-start',
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.colors.primary[100],
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: theme.spacing[3],
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.primary[700],
                }}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {step}
            </Text>
          </View>
        ))}

        <View
          style={{
            backgroundColor: theme.colors.warning[50],
            padding: theme.spacing[3],
            borderRadius: theme.borderRadius.md,
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.warning[500],
            marginTop: theme.spacing[4],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.warning[700],
              marginBottom: theme.spacing[1],
            }}
          >
            Safety Tips:
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.warning[600],
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            Start slowly and focus on proper form. Stop if you experience pain
            or discomfort.
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing[3],
          marginTop: theme.spacing[4],
        }}
      >
        {onRetry && (
          <Pressable
            onPress={onRetry}
            disabled={isRetrying}
            style={{
              flex: 1,
              backgroundColor: isRetrying
                ? theme.colors.gray[400]
                : theme.colors.primary[500],
              paddingVertical: theme.spacing[3],
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.surface,
              }}
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Text>
          </Pressable>
        )}

        {onViewInstructions && (
          <Pressable
            onPress={onViewInstructions}
            style={{
              flex: 1,
              backgroundColor: theme.colors.gray[100],
              paddingVertical: theme.spacing[3],
              borderRadius: theme.borderRadius.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              Detailed Guide
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
