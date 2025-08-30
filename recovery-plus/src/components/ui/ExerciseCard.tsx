import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../../styles/theme';
import { Exercise } from '../../types';

// Re-export Exercise for other components
export type { Exercise };

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  backgroundColor?: string;
  showPlayButton?: boolean;
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  backgroundColor,
  showPlayButton = true,
  compact = false,
  disabled = false,
  className,
}) => {
  const getLevelColor = () => {
    switch (exercise.level) {
      case 'BEGINNER':
        return theme.colors.success[500];
      case 'INTERMEDIATE':
        return theme.colors.warning[500];
      case 'ADVANCED':
        return theme.colors.error[500];
      default:
        return theme.colors.gray[500];
    }
  };

  const getLevelBackgroundColor = () => {
    switch (exercise.level) {
      case 'BEGINNER':
        return theme.colors.success[50];
      case 'INTERMEDIATE':
        return theme.colors.warning[50];
      case 'ADVANCED':
        return theme.colors.error[50];
      default:
        return theme.colors.gray[50];
    }
  };

  const getCardBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;

    // Rotate through theme colors for variety
    const colors = [
      theme.colors.success[50],
      theme.colors.error[50],
      theme.colors.primary[50],
      theme.colors.warning[50],
    ];

    const index = parseInt(exercise.id.slice(-1), 10) % colors.length;
    return colors[index] || theme.colors.gray[50];
  };

  return (
    <Pressable
      className={className}
      onPress={() => onPress(exercise)}
      disabled={disabled}
      style={{
        backgroundColor: getCardBackgroundColor(),
        borderRadius: theme.borderRadius.lg,
        padding: compact ? theme.spacing[3] : theme.spacing[4],
        marginBottom: theme.spacing[3],
        opacity: disabled ? 0.6 : 1,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left side - Icon and content */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {/* Exercise icon */}
          <View
            style={{
              width: compact ? 40 : 48,
              height: compact ? 40 : 48,
              backgroundColor: theme.colors.surface,
              borderRadius: compact ? 20 : 24,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: theme.spacing[3],
              elevation: 1,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <Text
              style={{
                fontSize: compact ? 20 : 24,
              }}
            >
              {exercise.icon || '💪'}
            </Text>
          </View>

          {/* Exercise info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: compact
                  ? theme.typography.fontSize.base
                  : theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[1],
              }}
            >
              {exercise.name}
            </Text>

            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: compact ? 0 : theme.spacing[1],
              }}
            >
              {exercise.targetMuscles.join(', ')}
            </Text>

            {!compact && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Level badge */}
                <View
                  style={{
                    backgroundColor: getLevelBackgroundColor(),
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    borderRadius: theme.borderRadius.sm,
                    marginRight: theme.spacing[2],
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: getLevelColor(),
                      textTransform: 'uppercase',
                    }}
                  >
                    {exercise.level}
                  </Text>
                </View>

                {/* Duration */}
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {exercise.duration}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side - Play button */}
        {showPlayButton && (
          <View
            style={{
              width: compact ? 32 : 40,
              height: compact ? 32 : 40,
              backgroundColor: theme.colors.surface,
              borderRadius: compact ? 16 : 20,
              justifyContent: 'center',
              alignItems: 'center',
              elevation: 1,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: compact ? 8 : 10,
                borderRightWidth: 0,
                borderTopWidth: compact ? 5 : 6,
                borderBottomWidth: compact ? 5 : 6,
                borderLeftColor: theme.colors.text.primary,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                marginLeft: 2,
              }}
            />
          </View>
        )}
      </View>

      {/* Compact version duration and level */}
      {compact && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: theme.spacing[2],
          }}
        >
          {/* Level badge */}
          <View
            style={{
              backgroundColor: getLevelBackgroundColor(),
              paddingHorizontal: theme.spacing[2],
              paddingVertical: theme.spacing[1],
              borderRadius: theme.borderRadius.sm,
              marginRight: theme.spacing[2],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                color: getLevelColor(),
                textTransform: 'uppercase',
              }}
            >
              {exercise.level}
            </Text>
          </View>

          {/* Duration */}
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            {exercise.duration}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
