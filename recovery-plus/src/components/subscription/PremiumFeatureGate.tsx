import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { FeatureAccess, PaywallContext } from '../../types/subscription';
import { subscriptionService } from '../../services/subscriptionService';
import { exerciseLogger } from '../../services/logger';

interface PremiumFeatureGateProps {
  feature: keyof FeatureAccess;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUpgradePress?: (context: PaywallContext) => void;
  showUpgradePrompt?: boolean;
  customMessage?: string;
  bypassCheck?: boolean; // For development/testing
}

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  feature,
  children,
  fallback,
  onUpgradePress,
  showUpgradePrompt = true,
  customMessage,
  bypassCheck = false,
}) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [feature]);

  const checkAccess = async () => {
    if (bypassCheck) {
      setHasAccess(true);
      setIsLoading(false);
      return;
    }

    try {
      const access = await subscriptionService.hasFeatureAccess(feature);
      setHasAccess(access);
    } catch (error) {
      exerciseLogger.error('Failed to check feature access', {
        error,
        feature,
      });
      setHasAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePress = () => {
    const context: PaywallContext = {
      source: 'feature_limit',
      featureAttempted: feature,
      userId: 'current_user', // Should be actual user ID
      timestamp: new Date().toISOString(),
    };

    exerciseLogger.info('Premium feature gate triggered', {
      feature,
      hasCustomHandler: !!onUpgradePress,
    });

    if (onUpgradePress) {
      onUpgradePress(context);
    } else {
      Alert.alert(
        'Premium Feature',
        customMessage ||
          `${getFeatureDisplayName(feature)} is available with Premium subscription.`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          {
            text: 'Upgrade Now',
            onPress: () => {
              // Would navigate to paywall
              console.log('Navigate to paywall with context:', context);
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          backgroundColor: theme.colors.gray[50],
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
          Checking access...
        </Text>
      </View>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: theme.colors.primary[50],
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        borderWidth: 1,
        borderColor: theme.colors.primary[200],
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 32,
          marginBottom: theme.spacing[3],
        }}
      >
        ⭐
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
        Premium Feature
      </Text>

      <Text
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          textAlign: 'center',
          marginBottom: theme.spacing[4],
          lineHeight: theme.typography.lineHeight.relaxed,
        }}
      >
        {customMessage ||
          `${getFeatureDisplayName(feature)} is available with Premium subscription.`}
      </Text>

      <Pressable
        onPress={handleUpgradePress}
        style={{
          backgroundColor: theme.colors.primary[500],
          paddingHorizontal: theme.spacing[6],
          paddingVertical: theme.spacing[3],
          borderRadius: theme.borderRadius.lg,
          elevation: 2,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
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

      <Text
        style={{
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
          textAlign: 'center',
          marginTop: theme.spacing[2],
        }}
      >
        7-day free trial included
      </Text>
    </View>
  );
};

function getFeatureDisplayName(feature: keyof FeatureAccess): string {
  const displayNames: Record<keyof FeatureAccess, string> = {
    basicExercises: 'Basic Exercises',
    basicFeedback: 'Basic Feedback',
    aiCoaching: 'AI Coaching',
    advancedAnalytics: 'Advanced Analytics',
    customWorkoutPlans: 'Custom Workout Plans',
    unlimitedExercises: 'Unlimited Exercises',
    expertConsultations: 'Expert Consultations',
    premiumContent: 'Premium Content',
    exportData: 'Data Export',
    prioritySupport: 'Priority Support',
    maxExercisesPerWeek: 'Exercise Limit',
    maxFeedbackHistory: 'Feedback History',
    maxAnalyticsRange: 'Analytics Range',
  };

  return displayNames[feature] || feature.toString();
}
