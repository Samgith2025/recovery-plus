import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { theme } from '../../styles/theme';
import { SubscriptionTier, PaywallContext } from '../../types/subscription';
import { SUBSCRIPTION_TIERS } from '../../config/subscriptions';
import { subscriptionService } from '../../services/subscriptionService';
import { getSafeAreaInsets } from '../../utils/device';
import { exerciseLogger } from '../../services/logger';

interface PaywallScreenProps {
  onClose?: () => void;
  onPurchaseComplete?: () => void;
  context?: PaywallContext;
  highlightFeature?: string;
  showCloseButton?: boolean;
}

export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  onClose,
  onPurchaseComplete,
  context,
  highlightFeature,
  showCloseButton = true,
}) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(7);

  const safeArea = getSafeAreaInsets();

  useEffect(() => {
    loadPackages();
    loadTrialInfo();
  }, []);

  const loadPackages = async () => {
    try {
      const availablePackages =
        await subscriptionService.getAvailablePackages();
      setPackages(availablePackages);

      // Auto-select the popular tier
      const popularTier = SUBSCRIPTION_TIERS.find(t => t.isPopular);
      if (popularTier) {
        setSelectedTier(popularTier);
      }
    } catch (error) {
      exerciseLogger.error('Failed to load subscription packages', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrialInfo = async () => {
    try {
      const trialInfo = await subscriptionService.getTrialInfo();
      if (trialInfo.daysRemaining) {
        setTrialDaysRemaining(trialInfo.daysRemaining);
      }
    } catch (error) {
      exerciseLogger.error('Failed to load trial info', { error });
    }
  };

  const handlePurchase = async () => {
    if (!selectedTier || isPurchasing) return;

    // Find the corresponding package
    const packageToPurchase = packages.find(pkg =>
      pkg.identifier.includes(selectedTier.id.replace('_', '.'))
    );

    if (!packageToPurchase) {
      Alert.alert('Error', 'Selected subscription package not available');
      return;
    }

    setIsPurchasing(true);

    try {
      await subscriptionService.purchaseSubscription(packageToPurchase, {
        source: context?.source || 'paywall',
        featureAttempted: context?.featureAttempted || highlightFeature,
      });

      exerciseLogger.info('Purchase completed successfully', {
        tier: selectedTier.id,
        context: context?.source,
      });

      Alert.alert(
        'Welcome to Premium!',
        'Your subscription is now active. Enjoy all premium features!',
        [
          {
            text: 'Get Started',
            onPress: () => {
              onPurchaseComplete?.();
            },
          },
        ]
      );
    } catch (error: any) {
      exerciseLogger.error('Purchase failed', { error: error.message });

      if (error.code !== '1') {
        // User didn't cancel
        Alert.alert(
          'Purchase Failed',
          'Unable to complete purchase. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);

    try {
      await subscriptionService.restorePurchases();

      Alert.alert(
        'Restore Successful',
        'Your previous purchases have been restored.',
        [
          {
            text: 'Continue',
            onPress: onPurchaseComplete,
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'No previous purchases found or restore failed. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeatureList = (features: string[]) => (
    <View style={{ marginBottom: theme.spacing[4] }}>
      {features.map((feature, index) => (
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
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: theme.colors.success[500],
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: theme.spacing[3],
            }}
          >
            <Text style={{ fontSize: 12, color: theme.colors.surface }}>✓</Text>
          </View>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              flex: 1,
              opacity:
                highlightFeature &&
                feature.toLowerCase().includes(highlightFeature.toLowerCase())
                  ? 1
                  : 0.8,
              fontWeight:
                highlightFeature &&
                feature.toLowerCase().includes(highlightFeature.toLowerCase())
                  ? theme.typography.fontWeight.medium
                  : theme.typography.fontWeight.normal,
            }}
          >
            {feature}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderSubscriptionTier = (tier: SubscriptionTier) => {
    const isSelected = selectedTier?.id === tier.id;
    const isFree = tier.id === 'free';

    if (isFree) return null; // Don't show free tier in paywall

    return (
      <Pressable
        key={tier.id}
        onPress={() => setSelectedTier(tier)}
        style={{
          backgroundColor: isSelected
            ? theme.colors.primary[50]
            : theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          marginBottom: theme.spacing[3],
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected
            ? theme.colors.primary[500]
            : theme.colors.border,
          elevation: isSelected ? 4 : 2,
          shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
          shadowOpacity: 0.1,
          shadowRadius: isSelected ? 8 : 4,
        }}
      >
        {tier.isPopular && (
          <View
            style={{
              position: 'absolute',
              top: -10,
              left: theme.spacing[4],
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: theme.spacing[3],
              paddingVertical: theme.spacing[1],
              borderRadius: theme.borderRadius.full,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.surface,
              }}
            >
              MOST POPULAR
            </Text>
          </View>
        )}

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
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[1],
              }}
            >
              {tier.name}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {tier.description}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text
                style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.text.primary,
                }}
              >
                ${tier.price}
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginLeft: theme.spacing[1],
                }}
              >
                /{tier.billingPeriod === 'monthly' ? 'mo' : 'yr'}
              </Text>
            </View>

            {tier.originalPrice && tier.discountPercentage && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.tertiary,
                    textDecorationLine: 'line-through',
                  }}
                >
                  ${tier.originalPrice}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.success[600],
                    fontWeight: theme.typography.fontWeight.medium,
                  }}
                >
                  Save {tier.discountPercentage}%
                </Text>
              </View>
            )}
          </View>
        </View>

        {renderFeatureList(tier.features)}
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing[3],
            }}
          >
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: safeArea.top,
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              Unlock Premium
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing[1],
              }}
            >
              Get personalized recovery coaching
            </Text>
          </View>

          {showCloseButton && onClose && (
            <Pressable
              onPress={onClose}
              style={{
                padding: theme.spacing[2],
                borderRadius: theme.borderRadius.md,
              }}
            >
              <Text
                style={{ fontSize: 24, color: theme.colors.text.secondary }}
              >
                ×
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Trial Banner */}
        <View
          style={{
            backgroundColor: theme.colors.primary[500],
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[6],
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              marginBottom: theme.spacing[2],
            }}
          >
            🎯
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.surface,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            }}
          >
            Start Your {trialDaysRemaining}-Day Free Trial
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.surface,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            Experience the full power of AI-driven recovery coaching
          </Text>
        </View>

        {/* Subscription Tiers */}
        {SUBSCRIPTION_TIERS.map(renderSubscriptionTier)}

        {/* Purchase Button */}
        <Pressable
          onPress={handlePurchase}
          disabled={!selectedTier || isPurchasing}
          style={{
            backgroundColor:
              selectedTier && !isPurchasing
                ? theme.colors.primary[500]
                : theme.colors.gray[400],
            paddingVertical: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center',
            marginBottom: theme.spacing[4],
            elevation: selectedTier ? 4 : 1,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          {isPurchasing ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.surface,
              }}
            >
              Start Free Trial
            </Text>
          )}
        </Pressable>

        {/* Restore Button */}
        <Pressable
          onPress={handleRestore}
          disabled={isLoading}
          style={{
            paddingVertical: theme.spacing[3],
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textDecorationLine: 'underline',
            }}
          >
            Restore Previous Purchases
          </Text>
        </Pressable>

        {/* Terms */}
        <Text
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.tertiary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.relaxed,
            marginTop: theme.spacing[4],
          }}
        >
          Free trial automatically converts to paid subscription unless canceled
          24 hours before trial ends. Cancel anytime in Settings. Terms apply.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
