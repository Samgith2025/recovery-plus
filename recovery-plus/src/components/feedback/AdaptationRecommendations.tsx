import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import {
  AdaptationRecommendation,
  ExerciseModification,
  AdaptedExercise,
} from '../../services/exerciseAdaptationService';
import { Exercise } from '../ui/ExerciseCard';
import { exerciseLogger } from '../../services/logger';

interface AdaptationRecommendationsProps {
  recommendations: AdaptationRecommendation[];
  onAcceptModification: (
    exerciseId: string,
    modifications: ExerciseModification[]
  ) => void;
  onReplaceExercise: (exerciseId: string, newExercise?: Exercise) => void;
  onDismissRecommendation: (exerciseId: string) => void;
  onViewExercise: (exerciseId: string) => void;
}

export const AdaptationRecommendations: React.FC<
  AdaptationRecommendationsProps
> = ({
  recommendations,
  onAcceptModification,
  onReplaceExercise,
  onDismissRecommendation,
  onViewExercise,
}) => {
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return theme.colors.error[500];
      case 'medium':
        return theme.colors.warning[500];
      case 'low':
        return theme.colors.primary[500];
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      case 'low':
        return '💡';
    }
  };

  const getModificationIcon = (type: ExerciseModification['type']) => {
    switch (type) {
      case 'intensity':
        return '⚡';
      case 'duration':
        return '⏱️';
      case 'reps':
        return '🔢';
      case 'weight':
        return '🏋️';
      case 'alternative':
        return '🔄';
      case 'rest':
        return '😴';
      default:
        return '🔧';
    }
  };

  const handleAcceptModification = (
    recommendation: AdaptationRecommendation
  ) => {
    const highPriorityMods = recommendation.modifications.filter(
      m => m.priority === 'high'
    );
    const modCount = recommendation.modifications.length;

    const message = `Apply ${modCount} modification${modCount > 1 ? 's' : ''} to ${recommendation.exerciseName}?${
      highPriorityMods.length > 0
        ? `\n\n${highPriorityMods.length} high priority changes will be made.`
        : ''
    }`;

    Alert.alert('Apply Modifications', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Apply',
        onPress: () => {
          exerciseLogger.info('Exercise modifications accepted', {
            exerciseId: recommendation.exerciseId,
            modificationCount: modCount,
            highPriorityCount: highPriorityMods.length,
          });
          onAcceptModification(
            recommendation.exerciseId,
            recommendation.modifications
          );
        },
      },
    ]);
  };

  const handleReplaceExercise = (recommendation: AdaptationRecommendation) => {
    Alert.alert(
      'Replace Exercise',
      `Replace ${recommendation.exerciseName} with a different exercise?${
        recommendation.alternativeExercise
          ? `\n\nSuggested: ${recommendation.alternativeExercise.name}`
          : "\n\nWe'll find a suitable alternative for you."
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            exerciseLogger.info('Exercise replacement accepted', {
              exerciseId: recommendation.exerciseId,
              exerciseName: recommendation.exerciseName,
              hasAlternative: !!recommendation.alternativeExercise,
            });
            onReplaceExercise(
              recommendation.exerciseId,
              recommendation.alternativeExercise
            );
          },
        },
      ]
    );
  };

  const renderModification = (
    modification: ExerciseModification,
    index: number
  ) => (
    <View
      key={index}
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colors.gray[50],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[3],
        marginBottom: theme.spacing[2],
        borderLeftWidth: 3,
        borderLeftColor: getPriorityColor(modification.priority),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginRight: theme.spacing[3],
        }}
      >
        <Text style={{ fontSize: 18 }}>
          {getModificationIcon(modification.type)}
        </Text>
        <Text
          style={{
            fontSize: 14,
            marginLeft: theme.spacing[1],
          }}
        >
          {getPriorityIcon(modification.priority)}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[1],
          }}
        >
          {modification.description}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.secondary,
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          {modification.reason}
        </Text>
      </View>
    </View>
  );

  const renderRecommendationCard = (
    recommendation: AdaptationRecommendation
  ) => {
    const highPriorityCount = recommendation.modifications.filter(
      m => m.priority === 'high'
    ).length;

    return (
      <View
        key={recommendation.exerciseId}
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[4],
          elevation: 2,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          borderTopWidth: highPriorityCount > 0 ? 3 : 1,
          borderTopColor:
            highPriorityCount > 0
              ? theme.colors.error[500]
              : theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing[3],
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[1],
              }}
            >
              {recommendation.exerciseName}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {recommendation.reasoning}
            </Text>
          </View>

          <Pressable
            onPress={() => onDismissRecommendation(recommendation.exerciseId)}
            style={{
              padding: theme.spacing[2],
              marginTop: -theme.spacing[2],
              marginRight: -theme.spacing[2],
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text.tertiary,
              }}
            >
              ✕
            </Text>
          </Pressable>
        </View>

        {/* Modifications */}
        {recommendation.modifications.length > 0 && (
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
              }}
            >
              Recommended Changes:
            </Text>

            {recommendation.modifications.map(renderModification)}
          </View>
        )}

        {/* Alternative Exercise */}
        {recommendation.alternativeExercise && (
          <View
            style={{
              backgroundColor: theme.colors.primary[50],
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.primary[700],
                marginBottom: theme.spacing[1],
              }}
            >
              🔄 Suggested Alternative:
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}
            >
              {recommendation.alternativeExercise.name}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
          }}
        >
          <Pressable
            onPress={() => onViewExercise(recommendation.exerciseId)}
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
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              View Exercise
            </Text>
          </Pressable>

          {recommendation.modifications.length > 0 && (
            <Pressable
              onPress={() => handleAcceptModification(recommendation)}
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary[500],
                paddingVertical: theme.spacing[3],
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.surface,
                }}
              >
                Apply Changes
              </Text>
            </Pressable>
          )}

          {recommendation.shouldReplace && (
            <Pressable
              onPress={() => handleReplaceExercise(recommendation)}
              style={{
                flex: 1,
                backgroundColor: theme.colors.warning[500],
                paddingVertical: theme.spacing[3],
                borderRadius: theme.borderRadius.md,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.surface,
                }}
              >
                Replace Exercise
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (recommendations.length === 0) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[6],
          alignItems: 'center',
          margin: theme.spacing[4],
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>🎯</Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          All Exercises Look Good!
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          Your current exercises are working well based on your feedback. Keep
          up the great work!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: theme.spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          backgroundColor: theme.colors.primary[50],
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[4],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          <Text style={{ fontSize: 24, marginRight: theme.spacing[2] }}>
            🤖
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.primary[700],
            }}
          >
            Smart Adaptations
          </Text>
        </View>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.primary[600],
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          Based on your feedback, we've identified some exercises that could be
          optimized for better results and comfort.
        </Text>
      </View>

      {recommendations.map(renderRecommendationCard)}
    </ScrollView>
  );
};
