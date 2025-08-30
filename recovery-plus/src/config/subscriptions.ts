import { SubscriptionTier, FeatureAccess } from '../types/subscription';

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic recovery exercises',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [
      '5 exercises per week',
      'Basic pain tracking',
      'Exercise instructions',
      'Simple progress tracking',
      'Community support',
    ],
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    description: 'Unlock the full power of AI-driven recovery',
    price: 9.99,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [
      'Unlimited exercises',
      'AI-powered coaching',
      'Advanced analytics',
      'Custom workout plans',
      'Video demonstrations',
      'Expert consultations',
      'Priority support',
      'Data export',
    ],
    isPopular: true,
  },
  {
    id: 'premium_annual',
    name: 'Premium Annual',
    description: 'Save 40% with annual billing',
    price: 59.99,
    currency: 'USD',
    billingPeriod: 'annual',
    originalPrice: 119.88,
    discountPercentage: 50,
    features: [
      'Everything in Premium',
      'Save $60 per year',
      'Extended analytics history',
      'Exclusive premium content',
      'Advanced adaptation algorithms',
    ],
  },
];

export const REVENUE_CAT_PRODUCTS = {
  PREMIUM_MONTHLY: 'recovery_plus_premium_monthly',
  PREMIUM_ANNUAL: 'recovery_plus_premium_annual',
} as const;

export const FEATURE_ACCESS: Record<string, FeatureAccess> = {
  free: {
    basicExercises: true,
    basicFeedback: true,
    aiCoaching: false,
    advancedAnalytics: false,
    customWorkoutPlans: false,
    unlimitedExercises: false,
    expertConsultations: false,
    premiumContent: false,
    exportData: false,
    prioritySupport: false,
    maxExercisesPerWeek: 5,
    maxFeedbackHistory: 10,
    maxAnalyticsRange: 7,
  },
  premium_monthly: {
    basicExercises: true,
    basicFeedback: true,
    aiCoaching: true,
    advancedAnalytics: true,
    customWorkoutPlans: true,
    unlimitedExercises: true,
    expertConsultations: true,
    premiumContent: true,
    exportData: true,
    prioritySupport: true,
  },
  premium_annual: {
    basicExercises: true,
    basicFeedback: true,
    aiCoaching: true,
    advancedAnalytics: true,
    customWorkoutPlans: true,
    unlimitedExercises: true,
    expertConsultations: true,
    premiumContent: true,
    exportData: true,
    prioritySupport: true,
  },
};

export const PAYWALL_CONTEXTS = {
  ONBOARDING: 'onboarding',
  EXERCISE_LIMIT: 'exercise_limit',
  FEATURE_LIMIT: 'feature_limit',
  ANALYTICS: 'analytics',
  MANUAL: 'manual',
} as const;

export const FREE_TRIAL_DAYS = 7;

export const SUBSCRIPTION_FEATURES = {
  AI_COACHING: 'AI Coaching',
  ADVANCED_ANALYTICS: 'Advanced Analytics',
  CUSTOM_PLANS: 'Custom Workout Plans',
  UNLIMITED_EXERCISES: 'Unlimited Exercises',
  EXPERT_CONSULTATIONS: 'Expert Consultations',
  PREMIUM_CONTENT: 'Premium Content',
  DATA_EXPORT: 'Data Export',
  PRIORITY_SUPPORT: 'Priority Support',
} as const;
