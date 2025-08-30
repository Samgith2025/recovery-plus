import { useEffect } from 'react';
import { useSubscriptionStore } from '../store/subscription';
import { subscriptionService } from '../services/subscriptionService';
import { PaywallContext } from '../types/subscription';
import { exerciseLogger } from '../services/logger';

export const useSubscription = () => {
  const {
    subscriptionStatus,
    featureAccess,
    trialInfo,
    isLoadingSubscription,
    isPurchasing,
    subscriptionError,
    showPaywall,
    paywallContext,
    exerciseCount,
    weeklyExerciseCount,

    setSubscriptionStatus,
    setFeatureAccess,
    setTrialInfo,
    setLoadingSubscription,
    setPurchasing,
    setSubscriptionError,
    showPaywallWithContext,
    hidePaywall,
    incrementExerciseCount,
    resetWeeklyCount,

    canAccessFeature,
    getRemainingExercises,
    isAtExerciseLimit,
    isPremiumUser,
    isInTrial,
    getDaysRemainingInTrial,
    getCurrentTier,
    clearSubscriptionData,
  } = useSubscriptionStore();

  // Initialize subscription data on mount
  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    setLoadingSubscription(true);

    try {
      const [status, access, trial] = await Promise.all([
        subscriptionService.getSubscriptionStatus(),
        subscriptionService.getFeatureAccess(),
        subscriptionService.getTrialInfo(),
      ]);

      setSubscriptionStatus(status);
      setFeatureAccess(access);
      setTrialInfo(trial);

      exerciseLogger.info('Subscription initialized', {
        isActive: status.isActive,
        tier: status.tier?.name,
        isInTrial: status.isInTrial,
      });
    } catch (error) {
      exerciseLogger.error('Failed to initialize subscription', { error });
      setSubscriptionError('Failed to load subscription data');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      const status = await subscriptionService.getSubscriptionStatus();
      setSubscriptionStatus(status);
      setSubscriptionError(null);
    } catch (error) {
      exerciseLogger.error('Failed to refresh subscription status', { error });
      setSubscriptionError('Failed to refresh subscription');
    } finally {
      setLoadingSubscription(false);
    }
  };

  const checkFeatureAccess = async (feature: string): Promise<boolean> => {
    try {
      return await subscriptionService.hasFeatureAccess(feature as any);
    } catch (error) {
      exerciseLogger.error('Failed to check feature access', {
        error,
        feature,
      });
      return false;
    }
  };

  const requestFeatureAccess = (
    feature: string,
    source: PaywallContext['source'] = 'feature_limit'
  ): boolean => {
    const hasAccess = canAccessFeature(feature as any);

    if (!hasAccess) {
      const context: PaywallContext = {
        source,
        featureAttempted: feature,
        userId: 'current_user', // Should be actual user ID
        timestamp: new Date().toISOString(),
      };

      showPaywallWithContext(context);

      exerciseLogger.info('Feature access requested', {
        feature,
        source,
        hasAccess,
      });
    }

    return hasAccess;
  };

  const trackExerciseUsage = (): boolean => {
    if (isAtExerciseLimit()) {
      const context: PaywallContext = {
        source: 'exercise_limit',
        featureAttempted: 'unlimitedExercises',
        userId: 'current_user',
        timestamp: new Date().toISOString(),
      };

      showPaywallWithContext(context);

      exerciseLogger.info('Exercise limit reached', {
        weeklyCount: weeklyExerciseCount,
        limit: featureAccess?.maxExercisesPerWeek,
      });

      return false;
    }

    incrementExerciseCount();
    return true;
  };

  const purchaseSubscription = async (packageId: string) => {
    setPurchasing(true);

    try {
      // This would get the actual package and purchase it
      const packages = await subscriptionService.getAvailablePackages();
      const packageToPurchase = packages.find(p =>
        p.identifier.includes(packageId)
      );

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      await subscriptionService.purchaseSubscription(packageToPurchase, {
        source: paywallContext?.source || 'manual',
        featureAttempted: paywallContext?.featureAttempted,
      });

      // Refresh subscription status after purchase
      await refreshSubscriptionStatus();

      hidePaywall();

      exerciseLogger.info('Purchase completed successfully', { packageId });

      return true;
    } catch (error: any) {
      exerciseLogger.error('Purchase failed', {
        error: error.message,
        packageId,
      });
      setSubscriptionError(error.message);
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    setPurchasing(true);

    try {
      await subscriptionService.restorePurchases();
      await refreshSubscriptionStatus();

      exerciseLogger.info('Purchases restored successfully');
      return true;
    } catch (error: any) {
      exerciseLogger.error('Restore failed', { error: error.message });
      setSubscriptionError(error.message);
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  const logout = async () => {
    try {
      await subscriptionService.logOut();
      clearSubscriptionData();
      exerciseLogger.info('Subscription logged out');
    } catch (error) {
      exerciseLogger.error('Failed to logout subscription', { error });
    }
  };

  return {
    // State
    subscriptionStatus,
    featureAccess,
    trialInfo,
    isLoadingSubscription,
    isPurchasing,
    subscriptionError,
    showPaywall,
    paywallContext,
    exerciseCount,
    weeklyExerciseCount,

    // Actions
    refreshSubscriptionStatus,
    checkFeatureAccess,
    requestFeatureAccess,
    trackExerciseUsage,
    purchaseSubscription,
    restorePurchases,
    hidePaywall,
    resetWeeklyCount,
    logout,

    // Computed
    canAccessFeature,
    getRemainingExercises,
    isAtExerciseLimit,
    isPremiumUser: isPremiumUser(),
    isInTrial: isInTrial(),
    daysRemainingInTrial: getDaysRemainingInTrial(),
    currentTier: getCurrentTier(),
  };
};
