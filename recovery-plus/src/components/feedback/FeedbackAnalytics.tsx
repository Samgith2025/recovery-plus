import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../styles/theme';
import { useFeedbackStore } from '../../store/feedback';
import { FeedbackTrend, FeedbackAnalysis } from '../../types/feedback';
import {
  aiFeedbackAnalytics,
  AIFeedbackAnalysis,
  AIFeedbackInsight,
  ExerciseRecommendation,
} from '../../services/aiFeedbackAnalytics';

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

  const [aiFeedbackAnalysis, setAiFeedbackAnalysis] =
    useState<AIFeedbackAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load AI-powered feedback analysis
  useEffect(() => {
    loadAIFeedbackAnalysis();
  }, [userId]);

  const loadAIFeedbackAnalysis = async () => {
    try {
      setIsLoadingAI(true);
      setError(null);

      if (userId) {
        const analysis =
          await aiFeedbackAnalytics.getAIFeedbackAnalysis(userId);
        setAiFeedbackAnalysis(analysis);
      } else {
        // Use fallback for demo users
        setAiFeedbackAnalysis(null);
      }
    } catch (err) {
      console.error('Failed to load AI feedback analysis:', err);
      setError('Unable to load AI analysis');
    } finally {
      setIsLoadingAI(false);
    }
  };

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

  const renderAIInsight = ({ insight }: { insight: AIFeedbackInsight }) => (
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
            : insight.type === 'warning'
              ? theme.colors.error[500]
              : insight.type === 'actionable'
                ? theme.colors.warning[500]
                : theme.colors.gray[400],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: theme.spacing[2],
        }}
      >
        <Text style={{ fontSize: 18, marginRight: theme.spacing[2] }}>
          {insight.type === 'positive'
            ? '✅'
            : insight.type === 'warning'
              ? '⚠️'
              : insight.type === 'actionable'
                ? '💡'
                : 'ℹ️'}
        </Text>
        <View style={{ flex: 1 }}>
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
                color: theme.colors.primary[600],
                fontStyle: 'italic',
                backgroundColor: theme.colors.primary[50],
                padding: theme.spacing[2],
                borderRadius: theme.borderRadius.sm,
              }}
            >
              💡 {insight.recommendation}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'center', marginLeft: theme.spacing[2] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
            }}
          >
            {Math.round(insight.confidence * 100)}% confident
          </Text>
        </View>
      </View>
    </View>
  );

  const renderExerciseRecommendation = ({
    recommendation,
  }: {
    recommendation: ExerciseRecommendation;
  }) => (
    <View
      key={recommendation.exerciseId}
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[3],
        borderWidth: 1,
        borderColor:
          recommendation.action === 'continue'
            ? theme.colors.success[200]
            : recommendation.action === 'modify'
              ? theme.colors.warning[200]
              : recommendation.action === 'replace'
                ? theme.colors.error[200]
                : theme.colors.gray[200],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.spacing[2],
        }}
      >
        <Text style={{ fontSize: 18, marginRight: theme.spacing[2] }}>
          {recommendation.action === 'continue'
            ? '✅'
            : recommendation.action === 'modify'
              ? '🔧'
              : recommendation.action === 'replace'
                ? '🔄'
                : '⏸️'}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            flex: 1,
          }}
        >
          {recommendation.exerciseName}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.xs,
            color:
              recommendation.priority === 'high'
                ? theme.colors.error[500]
                : recommendation.priority === 'medium'
                  ? theme.colors.warning[500]
                  : theme.colors.success[500],
            fontWeight: theme.typography.fontWeight.medium,
            textTransform: 'uppercase',
          }}
        >
          {recommendation.priority}
        </Text>
      </View>

      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          lineHeight: theme.typography.lineHeight.relaxed,
          marginBottom: recommendation.modifications ? theme.spacing[2] : 0,
        }}
      >
        {recommendation.reason}
      </Text>

      {recommendation.modifications &&
        recommendation.modifications.length > 0 && (
          <View style={{ marginTop: theme.spacing[2] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: theme.spacing[1],
              }}
            >
              Suggested modifications:
            </Text>
            {recommendation.modifications.map((mod, index) => (
              <Text
                key={index}
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginBottom: 2,
                }}
              >
                • {mod}
              </Text>
            ))}
          </View>
        )}
    </View>
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

  // Show loading state for AI analysis
  if (isLoadingAnalysis || isLoadingAI) {
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
          {isLoadingAI
            ? 'AI is analyzing your feedback patterns...'
            : 'Analyzing your feedback...'}
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
      {/* Header with AI indicator */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing[4] }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[2],
          }}
        >
          Your Progress Analytics
        </Text>
        {aiFeedbackAnalysis?.aiPowered && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: theme.colors.primary[600] }}>
              🤖 AI-Enhanced Analysis
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: theme.colors.text.tertiary,
                marginLeft: theme.spacing[2],
              }}
            >
              {Math.round((aiFeedbackAnalysis.confidenceScore || 0) * 100)}%
              confidence
            </Text>
          </View>
        )}
      </View>

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

      {/* AI Insights */}
      {aiFeedbackAnalysis && aiFeedbackAnalysis.aiInsights.length > 0 && (
        <View style={{ marginBottom: theme.spacing[6] }}>
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
          {aiFeedbackAnalysis.aiInsights.map((insight, index) => (
            <View key={index}>{renderAIInsight({ insight })}</View>
          ))}
        </View>
      )}

      {/* Exercise Recommendations */}
      {aiFeedbackAnalysis &&
        aiFeedbackAnalysis.exerciseRecommendations.length > 0 && (
          <View style={{ marginBottom: theme.spacing[6] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
              }}
            >
              🎯 Exercise Recommendations
            </Text>
            {aiFeedbackAnalysis.exerciseRecommendations.map(
              (recommendation, index) => (
                <View key={`rec-${index}`}>
                  {renderExerciseRecommendation({ recommendation })}
                </View>
              )
            )}
          </View>
        )}

      {/* Pain Management Tips */}
      {aiFeedbackAnalysis &&
        aiFeedbackAnalysis.painManagementTips.length > 0 && (
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
              🩹 Pain Management Tips
            </Text>
            {aiFeedbackAnalysis.painManagementTips.map((tip, index) => (
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
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        )}

      {/* Next Milestones */}
      {aiFeedbackAnalysis && aiFeedbackAnalysis.nextMilestones.length > 0 && (
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            borderWidth: 1,
            borderColor: theme.colors.primary[200],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.primary[700],
              marginBottom: theme.spacing[4],
            }}
          >
            🎯 Your Next Milestones
          </Text>
          {aiFeedbackAnalysis.nextMilestones.map((milestone, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing[2],
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
                  color: theme.colors.primary[700],
                  flex: 1,
                }}
              >
                {milestone}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Motivational Message */}
      {aiFeedbackAnalysis && (
        <View
          style={{
            backgroundColor: theme.colors.success[50],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.colors.success[200],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.success[700],
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {aiFeedbackAnalysis.motivationalMessage}
          </Text>
        </View>
      )}

      {/* Fallback to original recommendations */}
      {!aiFeedbackAnalysis &&
        feedbackAnalysis &&
        renderRecommendations(feedbackAnalysis)}
    </ScrollView>
  );
};
