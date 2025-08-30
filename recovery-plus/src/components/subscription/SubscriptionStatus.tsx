import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import {
  SubscriptionStatus as ISubscriptionStatus,
  TrialInfo,
} from '../../types/subscription';
import { subscriptionService } from '../../services/subscriptionService';
import { exerciseLogger } from '../../services/logger';

interface SubscriptionStatusProps {
  onManageSubscription?: () => void;
  onUpgrade?: () => void;
  showDetails?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  onManageSubscription,
  onUpgrade,
  showDetails = true,
}) => {
  const [status, setStatus] = useState<ISubscriptionStatus | null>(null);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [subscriptionStatus, trial] = await Promise.all([
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getTrialInfo(),
      ]);

      setStatus(subscriptionStatus);
      setTrialInfo(trial);
    } catch (error) {
      exerciseLogger.error('Failed to load subscription data', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSubscriptionData();
    setIsRefreshing(false);
  };

  const getStatusColor = () => {
    if (!status) return theme.colors.gray[500];

    if (status.isActive) {
      return status.isInTrial
        ? theme.colors.primary[500]
        : theme.colors.success[500];
    }

    return theme.colors.gray[500];
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';

    if (status.isActive) {
      if (status.isInTrial) {
        const daysLeft = trialInfo?.daysRemaining || 0;
        return `Free Trial (${daysLeft} days left)`;
      }
      return status.tier?.name || 'Premium';
    }

    return 'Free';
  };

  const getStatusIcon = () => {
    if (!status) return '❓';

    if (status.isActive) {
      return status.isInTrial ? '🚀' : '⭐';
    }

    return '👤';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleManageSubscription = () => {
    if (onManageSubscription) {
      onManageSubscription();
    } else {
      Alert.alert(
        'Manage Subscription',
        'To manage your subscription, go to your device Settings > App Store > Subscriptions.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            marginTop: theme.spacing[2],
          }}
        >
          Loading subscription...
        </Text>
      </View>
    );
  }

  if (!status) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
          }}
        >
          Unable to load subscription status
        </Text>
        <Pressable
          onPress={handleRefresh}
          style={{
            marginTop: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1],
            backgroundColor: theme.colors.primary[100],
            borderRadius: theme.borderRadius.md,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.primary[700],
            }}
          >
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        borderWidth: 1,
        borderColor: status.isActive ? getStatusColor() : theme.colors.border,
      }}
    >
      {/* Status Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showDetails ? theme.spacing[3] : 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 24, marginRight: theme.spacing[2] }}>
            {getStatusIcon()}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              {getStatusText()}
            </Text>
            {status.tier && (
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {status.tier.description}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={{
            padding: theme.spacing[2],
            opacity: isRefreshing ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
            }}
          >
            🔄
          </Text>
        </Pressable>
      </View>

      {/* Trial Warning */}
      {status.isInTrial && trialInfo?.daysRemaining !== undefined && (
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[3],
            marginBottom: theme.spacing[3],
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary[500],
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
            ⏰ Trial ends in {trialInfo.daysRemaining} day
            {trialInfo.daysRemaining !== 1 ? 's' : ''}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.primary[600],
            }}
          >
            Your subscription will automatically start after the trial period
          </Text>
        </View>
      )}

      {/* Details */}
      {showDetails && (
        <View style={{ marginBottom: theme.spacing[4] }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: theme.spacing[2],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Status:
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: getStatusColor(),
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              {status.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>

          {status.expiresAt && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                {status.isInTrial ? 'Trial ends:' : 'Renews:'}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                }}
              >
                {formatDate(status.expiresAt)}
              </Text>
            </View>
          )}

          {status.tier && status.tier.price > 0 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: theme.spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                }}
              >
                Price:
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.primary,
                }}
              >
                ${status.tier.price}/
                {status.tier.billingPeriod === 'monthly' ? 'month' : 'year'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
        {!status.isActive && onUpgrade && (
          <Pressable
            onPress={onUpgrade}
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
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.surface,
              }}
            >
              Upgrade to Premium
            </Text>
          </Pressable>
        )}

        {status.isActive && (
          <Pressable
            onPress={handleManageSubscription}
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
              Manage Subscription
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};
