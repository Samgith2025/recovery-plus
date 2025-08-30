import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../../styles/theme';
import { ExerciseRecommendation } from '../../services/chatService';

interface ExerciseRecommendationCardProps {
  recommendation: ExerciseRecommendation;
  onStartExercise: (recommendation: ExerciseRecommendation) => void;
  onViewDetails: (recommendation: ExerciseRecommendation) => void;
}

export const ExerciseRecommendationCard: React.FC<
  ExerciseRecommendationCardProps
> = ({ recommendation, onStartExercise, onViewDetails }) => {
  const getLevelColor = () => {
    switch (recommendation.level) {
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
    switch (recommendation.level) {
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

  const getTypeIcon = () => {
    switch (recommendation.type) {
      case 'strength':
        return '💪';
      case 'mobility':
        return '🤸';
      case 'isometric':
        return '⏱️';
      case 'cardio':
        return '❤️';
      default:
        return '🏃';
    }
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginVertical: theme.spacing[2],
        marginHorizontal: theme.spacing[1],
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: theme.colors.primary[200],
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[3],
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary[50],
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing[3],
          }}
        >
          <Text style={{ fontSize: 20 }}>{getTypeIcon()}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[1],
            }}
          >
            {recommendation.name}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                {recommendation.level}
              </Text>
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {recommendation.targetMuscles.join(', ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[3],
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            lineHeight: theme.typography.lineHeight.relaxed,
            marginBottom: theme.spacing[2],
          }}
        >
          {recommendation.description}
        </Text>

        {/* Why recommended */}
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            padding: theme.spacing[3],
            borderRadius: theme.borderRadius.md,
            marginBottom: theme.spacing[3],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.primary[700],
              fontStyle: 'italic',
            }}
          >
            💡 {recommendation.reason}
          </Text>
        </View>
      </View>

      {/* Exercise Parameters */}
      {(recommendation.sets ||
        recommendation.reps ||
        recommendation.holdTime) && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: theme.spacing[4],
            paddingBottom: theme.spacing[3],
            gap: theme.spacing[4],
          }}
        >
          {recommendation.sets && (
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[500],
                }}
              >
                {recommendation.sets}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                }}
              >
                Sets
              </Text>
            </View>
          )}

          {recommendation.reps && (
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[500],
                }}
              >
                {recommendation.reps}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                }}
              >
                Reps
              </Text>
            </View>
          )}

          {recommendation.holdTime && (
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[500],
                }}
              >
                {recommendation.holdTime}s
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.secondary,
                  textTransform: 'uppercase',
                }}
              >
                Hold
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={{
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <Pressable
          onPress={() => onViewDetails(recommendation)}
          style={{
            flex: 1,
            paddingVertical: theme.spacing[3],
            paddingHorizontal: theme.spacing[4],
            borderRightWidth: 1,
            borderRightColor: theme.colors.border,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.secondary,
            }}
          >
            View Details
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onStartExercise(recommendation)}
          style={{
            flex: 1,
            paddingVertical: theme.spacing[3],
            paddingHorizontal: theme.spacing[4],
            alignItems: 'center',
            backgroundColor: theme.colors.primary[50],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.primary[700],
            }}
          >
            Start Exercise
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
