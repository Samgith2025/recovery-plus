import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { theme } from '../../styles/theme';
import { useFeedbackStore } from '../../store/feedback';
import { FeedbackTrend, FeedbackAnalysis } from '../../types/feedback';

interface FeedbackAnalyticsProps {
  userId: string;
  onExercisePress?: (exerciseId: string) => void;
}

export const FeedbackAnalytics: React.FC<FeedbackAnalyticsProps> = ({
  userId,
  onExercisePress,
}) => {
  const {
    feedbackAnalysis,
    feedbackTrends,
    isLoadingAnalysis,
    getAveragePainLevel,
    getAverageDifficultyRating,
    getFeedbackCount,
    getPainTrend,
  } = useFeedbackStore();

  const getTrendColor = (
    trend: 'improving' | 'stable' | 'declining' | 'worsening'
  ) => {
    switch (trend) {
      case 'improving':
        return theme.colors.success[500];
      case 'declining':
      case 'worsening':
        return theme.colors.error[500];
      default:
        return theme.colors.warning[500];
    }
  };

  const getTrendIcon = (
    trend: 'improving' | 'stable' | 'declining' | 'worsening'
  ) => {
    switch (trend) {
      case 'improving':
        return '📈';
      case 'declining':
      case 'worsening':
        return '📉';
      default:
        return '➡️';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.colors.success[500];
    if (score >= 60) return theme.colors.warning[500];
    return theme.colors.error[500];
  };

  const renderMetricCard = ({
    title,
    value,
    subtitle,
    color,
    icon,
  }: {
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    icon?: string;
  }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        flex: 1,
        marginHorizontal: theme.spacing[1],
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
          marginBottom: theme.spacing[2],
        }}
      >
        {icon && (
          <Text style={{ fontSize: 20, marginRight: theme.spacing[2] }}>
            {icon}
          </Text>
        )}
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>
      <Text
        style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: color || theme.colors.text.primary,
          marginBottom: theme.spacing[1],
        }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.tertiary,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderTrendCard = (trend: FeedbackTrend) => (
    <Pressable
      key={trend.exerciseId}
      onPress={() => onExercisePress?.(trend.exerciseId)}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[3],
        borderLeftWidth: 4,
        borderLeftColor: getTrendColor(trend.improvementTrend),
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing[2],
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            flex: 1,
          }}
        >
          {trend.exerciseName}
        </Text>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16 }}>
            {getTrendIcon(trend.improvementTrend)}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: getTrendColor(trend.improvementTrend),
              fontWeight: theme.typography.fontWeight.medium,
              textTransform: 'capitalize',
              marginTop: theme.spacing[1],
            }}
          >
            {trend.improvementTrend}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Avg Pain: {trend.averagePainLevel}/10
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Difficulty: {trend.averageDifficultyRating}/10
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.tertiary,
            }}
          >
            {trend.totalSessions} sessions
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
            }}
          >
            Last: {new Date(trend.lastFeedbackDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const renderRecommendations = (analysis: FeedbackAnalysis) => (
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
        📊 Recommendations
      </Text>

      {analysis.recommendedModifications.length > 0 && (
        <View style={{ marginBottom: theme.spacing[4] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[2],
            }}
          >
            Suggested Improvements:
          </Text>
          {analysis.recommendedModifications.map((recommendation, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: theme.spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.primary[500],
                  marginRight: theme.spacing[2],
                  marginTop: 2,
                }}
              >
                •
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                  flex: 1,
                  lineHeight: theme.typography.lineHeight.relaxed,
                }}
              >
                {recommendation}
              </Text>
            </View>
          ))}
        </View>
      )}

      {analysis.mostEffectiveExercises.length > 0 && (
        <View style={{ marginBottom: theme.spacing[4] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.success[700],
              marginBottom: theme.spacing[2],
            }}
          >
            💪 Most Effective Exercises:
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {analysis.mostEffectiveExercises.join(', ')}
          </Text>
        </View>
      )}

      {analysis.leastEffectiveExercises.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.warning[700],
              marginBottom: theme.spacing[2],
            }}
          >
            🔄 Consider Alternatives:
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.primary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {analysis.leastEffectiveExercises.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoadingAnalysis) {
    return (
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
            fontSize: theme.typography.fontSize.lg,
            color: theme.colors.text.secondary,
          }}
        >
          Analyzing your feedback...
        </Text>
      </View>
    );
  }

  const feedbackCount = getFeedbackCount();

  if (feedbackCount === 0) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[6],
          margin: theme.spacing[4],
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>📊</Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          No Feedback Data Yet
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          Complete some exercises and provide feedback to see your progress
          analytics here.
        </Text>
      </View>
    );
  }

  const averagePain = getAveragePainLevel();
  const averageDifficulty = getAverageDifficultyRating();
  const painTrend = getPainTrend();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: theme.spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Overview Metrics */}
      <Text
        style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[4],
        }}
      >
        Your Progress Analytics
      </Text>

      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: -theme.spacing[1],
          marginBottom: theme.spacing[4],
        }}
      >
        {renderMetricCard({
          title: 'Pain Trend',
          value: getTrendIcon(painTrend),
          subtitle: painTrend.charAt(0).toUpperCase() + painTrend.slice(1),
          color: getTrendColor(painTrend),
        })}
        {renderMetricCard({
          title: 'Avg Pain Level',
          value: `${averagePain}/10`,
          subtitle: `${feedbackCount} sessions`,
          color:
            averagePain <= 4
              ? theme.colors.success[500]
              : theme.colors.error[500],
          icon: '😌',
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginHorizontal: -theme.spacing[1],
          marginBottom: theme.spacing[6],
        }}
      >
        {renderMetricCard({
          title: 'Avg Difficulty',
          value: `${averageDifficulty}/10`,
          subtitle: 'Exercise challenge',
          icon: '💪',
        })}
        {feedbackAnalysis &&
          renderMetricCard({
            title: 'Progress Score',
            value: `${feedbackAnalysis.progressScore}%`,
            subtitle: 'Overall improvement',
            color: getScoreColor(feedbackAnalysis.progressScore),
            icon: '🎯',
          })}
      </View>

      {/* Exercise Trends */}
      {feedbackTrends.length > 0 && (
        <>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            Exercise Trends
          </Text>

          {feedbackTrends.slice(0, 5).map(renderTrendCard)}
        </>
      )}

      {/* Recommendations */}
      {feedbackAnalysis && renderRecommendations(feedbackAnalysis)}
    </ScrollView>
  );
};
