import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesError,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import {
  SubscriptionStatus,
  SubscriptionTier,
  PurchaseInfo,
  TrialInfo,
  FeatureAccess,
  SubscriptionEvent,
} from '../types/subscription';
import {
  SUBSCRIPTION_TIERS,
  REVENUE_CAT_PRODUCTS,
  FEATURE_ACCESS,
  FREE_TRIAL_DAYS,
} from '../config/subscriptions';
import { exerciseLogger } from './logger';

class SubscriptionService {
  private isConfigured = false;
  private currentCustomerInfo: CustomerInfo | null = null;
  private isDemoMode = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(): Promise<void> {
    if (this.isConfigured) return;

    try {
      // These would be your actual RevenueCat API keys
      const apiKey = Platform.select({
        ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
        android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
      });

      if (!apiKey) {
        exerciseLogger.warn('RevenueCat API key not found, using demo mode');
        this.isConfigured = true;
        this.isDemoMode = true;
        return;
      }

      // Configure RevenueCat
      await Purchases.configure({
        apiKey,
        appUserID: undefined, // Will be set when user logs in
      });

      // Set debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Set up listener for customer info updates
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);

      this.isConfigured = true;
      exerciseLogger.info('RevenueCat initialized successfully');
    } catch (error) {
      exerciseLogger.error('Failed to initialize RevenueCat', { error });
      throw error;
    }
  }

  /**
   * Set user ID for RevenueCat
   */
  async setUserId(userId: string): Promise<void> {
    try {
      await this.initialize();
      await Purchases.logIn(userId);

      exerciseLogger.info('RevenueCat user ID set', { userId });
    } catch (error) {
      exerciseLogger.error('Failed to set RevenueCat user ID', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get current customer info and subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      await this.initialize();

      // Return demo subscription status if in demo mode
      if (this.isDemoMode) {
        return this.getDemoSubscriptionStatus();
      }

      const customerInfo = await Purchases.getCustomerInfo();
      this.currentCustomerInfo = customerInfo;

      return this.parseSubscriptionStatus(customerInfo);
    } catch (error) {
      exerciseLogger.error('Failed to get subscription status', { error });

      // Return default free status on error
      return {
        isActive: false,
        isInTrial: false,
        tier: SUBSCRIPTION_TIERS.find(t => t.id === 'free') || null,
        expiresAt: null,
        renewsAt: null,
        isCanceled: false,
        isInGracePeriod: false,
        originalPurchaseDate: null,
        lastRenewalDate: null,
      };
    }
  }

  /**
   * Get available subscription packages
   */
  async getAvailablePackages(): Promise<PurchasesPackage[]> {
    try {
      await this.initialize();

      // Return empty packages in demo mode
      if (this.isDemoMode) {
        return [];
      }

      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;

      if (!currentOffering) {
        exerciseLogger.warn('No current offering found');
        return [];
      }

      const packages = currentOffering.availablePackages;

      exerciseLogger.info('Retrieved available packages', {
        packageCount: packages.length,
        packageIds: packages.map(p => p.identifier),
      });

      return packages;
    } catch (error) {
      exerciseLogger.error('Failed to get available packages', { error });
      return [];
    }
  }

  /**
   * Purchase a subscription package
   */
  async purchaseSubscription(
    packageToPurchase: PurchasesPackage,
    context?: { source: string; featureAttempted?: string }
  ): Promise<PurchaseInfo> {
    try {
      await this.initialize();

      this.logSubscriptionEvent({
        type: 'purchase_started',
        productId: packageToPurchase.identifier,
        timestamp: new Date().toISOString(),
        userId: 'current_user', // Should be actual user ID
        context: context
          ? {
              source: context.source as any,
              featureAttempted: context.featureAttempted,
              userId: 'current_user',
              timestamp: new Date().toISOString(),
            }
          : undefined,
      });

      const { customerInfo, productIdentifier } =
        await Purchases.purchasePackage(packageToPurchase);

      this.currentCustomerInfo = customerInfo;

      const purchaseInfo: PurchaseInfo = {
        transactionId:
          customerInfo.originalPurchaseDate || new Date().toISOString(),
        productId: productIdentifier,
        purchaseDate: new Date().toISOString(),
        originalTransactionId:
          customerInfo.originalPurchaseDate || new Date().toISOString(),
        isRestore: false,
      };

      this.logSubscriptionEvent({
        type: 'purchase_completed',
        productId: productIdentifier,
        timestamp: new Date().toISOString(),
        userId: 'current_user',
      });

      exerciseLogger.info('Subscription purchase completed', {
        productId: productIdentifier,
        hasActiveEntitlements:
          Object.keys(customerInfo.entitlements.active).length > 0,
      });

      return purchaseInfo;
    } catch (error) {
      const purchasesError = error as PurchasesError;

      this.logSubscriptionEvent({
        type: 'purchase_failed',
        productId: packageToPurchase.identifier,
        error: purchasesError.message,
        timestamp: new Date().toISOString(),
        userId: 'current_user',
      });

      exerciseLogger.error('Subscription purchase failed', {
        error: purchasesError.message,
        code: purchasesError.code,
        productId: packageToPurchase.identifier,
      });

      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      await this.initialize();

      this.logSubscriptionEvent({
        type: 'restore_started',
        timestamp: new Date().toISOString(),
        userId: 'current_user',
      });

      const customerInfo = await Purchases.restorePurchases();
      this.currentCustomerInfo = customerInfo;

      this.logSubscriptionEvent({
        type: 'restore_completed',
        timestamp: new Date().toISOString(),
        userId: 'current_user',
      });

      exerciseLogger.info('Purchases restored', {
        hasActiveEntitlements:
          Object.keys(customerInfo.entitlements.active).length > 0,
      });

      return customerInfo;
    } catch (error) {
      exerciseLogger.error('Failed to restore purchases', { error });
      throw error;
    }
  }

  /**
   * Get feature access for current subscription
   */
  async getFeatureAccess(): Promise<FeatureAccess> {
    try {
      const status = await this.getSubscriptionStatus();

      if (!status.isActive || !status.tier) {
        return FEATURE_ACCESS.free;
      }

      const accessKey = status.tier.id;
      return FEATURE_ACCESS[accessKey] || FEATURE_ACCESS.free;
    } catch (error) {
      exerciseLogger.error('Failed to get feature access', { error });
      return FEATURE_ACCESS.free;
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(feature: keyof FeatureAccess): Promise<boolean> {
    try {
      const access = await this.getFeatureAccess();
      return !!access[feature];
    } catch (error) {
      exerciseLogger.error('Failed to check feature access', {
        error,
        feature,
      });
      return false;
    }
  }

  /**
   * Get trial information
   */
  async getTrialInfo(): Promise<TrialInfo> {
    try {
      const status = await this.getSubscriptionStatus();

      if (status.isInTrial && status.expiresAt) {
        const expiresAt = new Date(status.expiresAt);
        const now = new Date();
        const daysRemaining = Math.max(
          0,
          Math.ceil(
            (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        );

        return {
          isEligible: false,
          daysRemaining,
          startedAt: status.originalPurchaseDate || undefined,
          endsAt: status.expiresAt,
          hasUsedTrial: true,
        };
      }

      // Check if user has previously used trial
      const hasUsedTrial =
        this.currentCustomerInfo?.originalPurchaseDate !== null;

      return {
        isEligible: !hasUsedTrial,
        hasUsedTrial,
      };
    } catch (error) {
      exerciseLogger.error('Failed to get trial info', { error });
      return {
        isEligible: true,
        hasUsedTrial: false,
      };
    }
  }

  /**
   * Handle customer info updates
   */
  private handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    this.currentCustomerInfo = customerInfo;
    exerciseLogger.info('Customer info updated', {
      hasActiveEntitlements:
        Object.keys(customerInfo.entitlements.active).length > 0,
    });
  };

  /**
   * Get demo subscription status when RevenueCat is not configured
   */
  private getDemoSubscriptionStatus(): SubscriptionStatus {
    const freeTier = SUBSCRIPTION_TIERS.find(t => t.id === 'free') || null;

    return {
      isActive: false,
      isInTrial: false,
      tier: freeTier,
      expiresAt: null,
      renewsAt: null,
      isCanceled: false,
      isInGracePeriod: false,
      originalPurchaseDate: null,
      lastRenewalDate: null,
    };
  }

  /**
   * Parse customer info into subscription status
   */
  private parseSubscriptionStatus(
    customerInfo: CustomerInfo
  ): SubscriptionStatus {
    const activeEntitlements = customerInfo.entitlements.active;
    const hasActiveSubscription = Object.keys(activeEntitlements).length > 0;

    let tier: SubscriptionTier | null = null;
    let expiresAt: string | null = null;
    let originalPurchaseDate: string | null = null;

    if (hasActiveSubscription) {
      // Get the first active entitlement (assuming one subscription type)
      const entitlementKey = Object.keys(activeEntitlements)[0];
      const entitlement = activeEntitlements[entitlementKey];

      expiresAt = entitlement.expirationDate;
      originalPurchaseDate = customerInfo.originalPurchaseDate;

      // Determine tier based on product identifier
      if (
        entitlement.productIdentifier === REVENUE_CAT_PRODUCTS.PREMIUM_MONTHLY
      ) {
        tier = SUBSCRIPTION_TIERS.find(t => t.id === 'premium_monthly') || null;
      } else if (
        entitlement.productIdentifier === REVENUE_CAT_PRODUCTS.PREMIUM_ANNUAL
      ) {
        tier = SUBSCRIPTION_TIERS.find(t => t.id === 'premium_annual') || null;
      }
    }

    if (!tier) {
      tier = SUBSCRIPTION_TIERS.find(t => t.id === 'free') || null;
    }

    const now = new Date();
    const expiryDate = expiresAt ? new Date(expiresAt) : null;
    const isInTrial =
      hasActiveSubscription && expiryDate
        ? expiryDate.getTime() - now.getTime() <=
          FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000
        : false;

    return {
      isActive: hasActiveSubscription,
      isInTrial,
      tier,
      expiresAt,
      renewsAt: expiresAt,
      isCanceled: false, // RevenueCat handles this automatically
      isInGracePeriod: false,
      originalPurchaseDate,
      lastRenewalDate: null,
    };
  }

  /**
   * Log subscription events for analytics
   */
  private logSubscriptionEvent(event: SubscriptionEvent): void {
    exerciseLogger.info('Subscription event', event);

    // Here you could also send to analytics services
    // analytics.track('subscription_event', event);
  }

  /**
   * Clean up when user logs out
   */
  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
      this.currentCustomerInfo = null;
      exerciseLogger.info('RevenueCat user logged out');
    } catch (error) {
      exerciseLogger.error('Failed to log out from RevenueCat', { error });
    }
  }
}

export const subscriptionService = new SubscriptionService();
