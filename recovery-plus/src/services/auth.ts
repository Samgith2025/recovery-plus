import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { userProfileService } from './userProfile';

// Secure token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

export { ClerkProvider, useAuth, useUser, tokenCache };

// Auth service helpers - these are abstraction helpers for the app-specific logic
export const authService = {
  // Convert Clerk user to app User format
  convertClerkUser: (clerkUser: any) => {
    return {
      id: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      createdAt: clerkUser.createdAt || new Date().toISOString(),
      updatedAt: clerkUser.updatedAt || new Date().toISOString(),
    };
  },

  // Handle authentication success
  handleAuthSuccess: async (clerkUser: any, storeSignIn: any) => {
    const user = authService.convertClerkUser(clerkUser);

    // Create or sync user profile in Supabase
    const profileResult = await userProfileService.createProfile(
      clerkUser.id,
      clerkUser.emailAddresses[0]?.emailAddress || '',
      clerkUser.firstName || '',
      clerkUser.lastName || ''
    );

    if (!profileResult.success) {
      console.warn('Failed to create user profile:', profileResult.error);
      // Continue anyway, as the main auth succeeded
    }

    storeSignIn(user);
    return { success: true, user };
  },

  // Handle authentication error
  handleAuthError: (error: any) => {
    const message = error.errors?.[0]?.message || 'Authentication failed';
    return { success: false, error: message };
  },

  // OAuth providers (Google, Apple) - these would be implemented later
  signInWithGoogle: async () => {
    return {
      success: false,
      error: 'Google OAuth not yet implemented',
    };
  },

  signInWithApple: async () => {
    return {
      success: false,
      error: 'Apple OAuth not yet implemented',
    };
  },

  // Logout functionality
  signOut: async (
    clerkSignOut?: () => Promise<void>,
    storeSignOut?: () => void
  ) => {
    try {
      // Sign out from Clerk
      if (clerkSignOut) {
        await clerkSignOut();
      }

      // Clear local store
      if (storeSignOut) {
        storeSignOut();
      }

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local store even if Clerk signout fails
      if (storeSignOut) {
        storeSignOut();
      }
      return { success: false, error: 'Failed to sign out completely' };
    }
  },

  // Account deletion functionality
  deleteAccount: async (
    userId: string,
    clerkSignOut?: () => Promise<void>,
    storeSignOut?: () => void
  ) => {
    try {
      // First delete user profile from Supabase
      const profileResult = await userProfileService.deleteProfile(userId);

      if (!profileResult.success) {
        console.warn('Failed to delete user profile:', profileResult.error);
        // Continue anyway to complete account deletion
      }

      // Note: Clerk account deletion typically requires admin API or user action
      // For now, we'll just sign out and clear local data
      console.log(
        'Account deletion: Clerk account must be deleted separately by user'
      );

      // Sign out
      await authService.signOut(clerkSignOut, storeSignOut);

      return { success: true };
    } catch (error) {
      console.error('Account deletion error:', error);
      return { success: false, error: 'Failed to delete account' };
    }
  },
};
