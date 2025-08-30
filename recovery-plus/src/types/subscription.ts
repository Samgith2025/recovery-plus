export interface SubscriptionTier {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual' | 'lifetime';
  features: string[];
  isPopular?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
}

export interface SubscriptionPlan {
  identifier: string;
  displayName: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  billingPeriod: string;
  freeTrialPeriod?: string;
  introductoryPrice?: {
    price: string;
    priceAmountMicros: number;
    billingPeriod: string;
    billingCycleCount: number;
  };
}

export interface SubscriptionStatus {
  isActive: boolean;
  isInTrial: boolean;
  tier: SubscriptionTier | null;
  expiresAt: string | null;
  renewsAt: string | null;
  isCanceled: boolean;
  isInGracePeriod: boolean;
  originalPurchaseDate: string | null;
  lastRenewalDate: string | null;
}

export interface PurchaseInfo {
  transactionId: string;
  productId: string;
  purchaseDate: string;
  originalTransactionId: string;
  isRestore: boolean;
}

export interface FeatureAccess {
  // Core features
  basicExercises: boolean;
  basicFeedback: boolean;

  // Premium features
  aiCoaching: boolean;
  advancedAnalytics: boolean;
  customWorkoutPlans: boolean;
  unlimitedExercises: boolean;
  expertConsultations: boolean;
  premiumContent: boolean;
  exportData: boolean;
  prioritySupport: boolean;

  // Limits for free tier
  maxExercisesPerWeek?: number;
  maxFeedbackHistory?: number;
  maxAnalyticsRange?: number; // days
}

export interface PaywallContext {
  source:
    | 'onboarding'
    | 'feature_limit'
    | 'exercise_limit'
    | 'analytics'
    | 'manual';
  featureAttempted?: string;
  exerciseId?: string;
  userId: string;
  timestamp: string;
}

export interface SubscriptionEvent {
  type:
    | 'purchase_started'
    | 'purchase_completed'
    | 'purchase_failed'
    | 'restore_started'
    | 'restore_completed'
    | 'subscription_expired'
    | 'subscription_renewed';
  productId?: string;
  error?: string;
  timestamp: string;
  userId: string;
  context?: PaywallContext;
}

export interface TrialInfo {
  isEligible: boolean;
  daysRemaining?: number;
  startedAt?: string;
  endsAt?: string;
  hasUsedTrial: boolean;
}
