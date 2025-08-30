import { create } from 'zustand';
import {
  SubscriptionStatus,
  SubscriptionTier,
  FeatureAccess,
  TrialInfo,
  PaywallContext,
} from '../types/subscription';
import { FEATURE_ACCESS } from '../config/subscriptions';

interface SubscriptionState {
  // Subscription data
  subscriptionStatus: SubscriptionStatus | null;
  featureAccess: FeatureAccess | null;
  trialInfo: TrialInfo | null;

  // UI state
  isLoadingSubscription: boolean;
  isPurchasing: boolean;
  subscriptionError: string | null;

  // Paywall state
  showPaywall: boolean;
  paywallContext: PaywallContext | null;

  // Usage tracking
  exerciseCount: number;
  weeklyExerciseCount: number;
  lastExerciseReset: string | null;

  // Actions
  setSubscriptionStatus: (status: SubscriptionStatus | null) => void;
  setFeatureAccess: (access: FeatureAccess | null) => void;
  setTrialInfo: (info: TrialInfo | null) => void;

  setLoadingSubscription: (loading: boolean) => void;
  setPurchasing: (purchasing: boolean) => void;
  setSubscriptionError: (error: string | null) => void;

  showPaywallWithContext: (context: PaywallContext) => void;
  hidePaywall: () => void;

  // Usage tracking
  incrementExerciseCount: () => void;
  resetWeeklyCount: () => void;
  setExerciseCount: (count: number) => void;

  // Feature checks
  canAccessFeature: (feature: keyof FeatureAccess) => boolean;
  getRemainingExercises: () => number;
  isAtExerciseLimit: () => boolean;

  // Computed values
  isPremiumUser: () => boolean;
  isInTrial: () => boolean;
  getDaysRemainingInTrial: () => number;
  getCurrentTier: () => SubscriptionTier | null;

  // Clear state
  clearSubscriptionData: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  subscriptionStatus: null,
  featureAccess: null,
  trialInfo: null,

  isLoadingSubscription: false,
  isPurchasing: false,
  subscriptionError: null,

  showPaywall: false,
  paywallContext: null,

  exerciseCount: 0,
  weeklyExerciseCount: 0,
  lastExerciseReset: null,

  // Actions
  setSubscriptionStatus: status => {
    set({ subscriptionStatus: status });

    // Auto-update feature access based on subscription
    if (status?.tier) {
      const accessKey = status.tier.id;
      const access = FEATURE_ACCESS[accessKey] || FEATURE_ACCESS.free;
      set({ featureAccess: access });
    } else {
      set({ featureAccess: FEATURE_ACCESS.free });
    }
  },

  setFeatureAccess: access => set({ featureAccess: access }),
  setTrialInfo: info => set({ trialInfo: info }),

  setLoadingSubscription: loading => set({ isLoadingSubscription: loading }),
  setPurchasing: purchasing => set({ isPurchasing: purchasing }),
  setSubscriptionError: error => set({ subscriptionError: error }),

  showPaywallWithContext: context =>
    set({
      showPaywall: true,
      paywallContext: context,
    }),

  hidePaywall: () =>
    set({
      showPaywall: false,
      paywallContext: null,
    }),

  // Usage tracking
  incrementExerciseCount: () => {
    const state = get();
    const now = new Date();
    const currentWeek = getWeekStart(now).toISOString();

    // Reset weekly count if it's a new week
    if (state.lastExerciseReset !== currentWeek) {
      set({
        weeklyExerciseCount: 1,
        lastExerciseReset: currentWeek,
        exerciseCount: state.exerciseCount + 1,
      });
    } else {
      set({
        weeklyExerciseCount: state.weeklyExerciseCount + 1,
        exerciseCount: state.exerciseCount + 1,
      });
    }
  },

  resetWeeklyCount: () => {
    const currentWeek = getWeekStart(new Date()).toISOString();
    set({
      weeklyExerciseCount: 0,
      lastExerciseReset: currentWeek,
    });
  },

  setExerciseCount: count => set({ exerciseCount: count }),

  // Feature checks
  canAccessFeature: feature => {
    const { featureAccess } = get();
    if (!featureAccess) return false;

    // Check basic boolean features
    if (typeof featureAccess[feature] === 'boolean') {
      return featureAccess[feature] as boolean;
    }

    return true;
  },

  getRemainingExercises: () => {
    const { featureAccess, weeklyExerciseCount } = get();

    if (!featureAccess || featureAccess.unlimitedExercises) {
      return Infinity;
    }

    const limit = featureAccess.maxExercisesPerWeek || 0;
    return Math.max(0, limit - weeklyExerciseCount);
  },

  isAtExerciseLimit: () => {
    const { featureAccess, weeklyExerciseCount } = get();

    if (!featureAccess || featureAccess.unlimitedExercises) {
      return false;
    }

    const limit = featureAccess.maxExercisesPerWeek || 0;
    return weeklyExerciseCount >= limit;
  },

  // Computed values
  isPremiumUser: () => {
    const { subscriptionStatus } = get();
    return subscriptionStatus?.isActive ?? false;
  },

  isInTrial: () => {
    const { subscriptionStatus } = get();
    return subscriptionStatus?.isInTrial ?? false;
  },

  getDaysRemainingInTrial: () => {
    const { trialInfo } = get();
    return trialInfo?.daysRemaining ?? 0;
  },

  getCurrentTier: () => {
    const { subscriptionStatus } = get();
    return subscriptionStatus?.tier ?? null;
  },

  clearSubscriptionData: () =>
    set({
      subscriptionStatus: null,
      featureAccess: FEATURE_ACCESS.free,
      trialInfo: null,
      subscriptionError: null,
      exerciseCount: 0,
      weeklyExerciseCount: 0,
      lastExerciseReset: null,
    }),
}));

// Helper function to get the start of the current week (Monday)
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}
