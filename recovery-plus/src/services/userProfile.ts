import { db } from './supabase';
import { Database } from '../types/supabase';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  notificationsEnabled: boolean;
  reminderTime: string | null;
  theme: string;
  language: string;
  privacyAnalytics: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userProfileService = {
  /**
   * Create a new user profile
   */
  createProfile: async (
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
    try {
      const { data, error } = await db.createUserProfile(
        userId,
        email,
        firstName,
        lastName
      );

      if (error) {
        return { success: false, error: error.message };
      }

      // Also create default user preferences
      await userProfileService.createDefaultPreferences(userId);

      return {
        success: true,
        data: data
          ? {
              id: data.id,
              email: data.email,
              firstName: data.first_name,
              lastName: data.last_name,
              avatarUrl: data.avatar_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : undefined,
      };
    } catch {
      return { success: false, error: 'Failed to create user profile' };
    }
  },

  /**
   * Get user profile by ID
   */
  getProfile: async (
    userId: string
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
    try {
      const { data, error } = await db.getUserProfile(userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data
          ? {
              id: data.id,
              email: data.email,
              firstName: data.first_name,
              lastName: data.last_name,
              avatarUrl: data.avatar_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : undefined,
      };
    } catch {
      return { success: false, error: 'Failed to get user profile' };
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (
    userId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      email?: string;
      avatarUrl?: string;
    }
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> => {
    try {
      const dbUpdates: Partial<
        Database['public']['Tables']['user_profiles']['Update']
      > = {};

      if (updates.firstName !== undefined)
        dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined)
        dbUpdates.last_name = updates.lastName;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.avatarUrl !== undefined)
        dbUpdates.avatar_url = updates.avatarUrl;

      const { data, error } = await db.updateUserProfile(userId, dbUpdates);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data
          ? {
              id: data.id,
              email: data.email,
              firstName: data.first_name,
              lastName: data.last_name,
              avatarUrl: data.avatar_url,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : undefined,
      };
    } catch {
      return { success: false, error: 'Failed to update user profile' };
    }
  },

  /**
   * Delete user profile
   */
  deleteProfile: async (
    userId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await db.deleteUserProfile(userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to delete user profile' };
    }
  },

  /**
   * Create default user preferences
   */
  createDefaultPreferences: async (
    userId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await db.createUserPreferences(userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Failed to create user preferences' };
    }
  },

  /**
   * Get user preferences
   */
  getPreferences: async (
    userId: string
  ): Promise<{ success: boolean; data?: UserPreferences; error?: string }> => {
    try {
      const { data, error } = await db.getUserPreferences(userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data
          ? {
              id: data.id,
              userId: data.user_id,
              notificationsEnabled: data.notifications_enabled,
              reminderTime: data.reminder_time,
              theme: data.theme,
              language: data.language,
              privacyAnalytics: data.privacy_analytics,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : undefined,
      };
    } catch {
      return { success: false, error: 'Failed to get user preferences' };
    }
  },

  /**
   * Update user preferences
   */
  updatePreferences: async (
    userId: string,
    updates: {
      notificationsEnabled?: boolean;
      reminderTime?: string | null;
      theme?: string;
      language?: string;
      privacyAnalytics?: boolean;
    }
  ): Promise<{ success: boolean; data?: UserPreferences; error?: string }> => {
    try {
      const dbUpdates: Partial<
        Database['public']['Tables']['user_preferences']['Update']
      > = {};

      if (updates.notificationsEnabled !== undefined)
        dbUpdates.notifications_enabled = updates.notificationsEnabled;
      if (updates.reminderTime !== undefined)
        dbUpdates.reminder_time = updates.reminderTime;
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.language !== undefined) dbUpdates.language = updates.language;
      if (updates.privacyAnalytics !== undefined)
        dbUpdates.privacy_analytics = updates.privacyAnalytics;

      const { data, error } = await db.updateUserPreferences(userId, dbUpdates);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: data
          ? {
              id: data.id,
              userId: data.user_id,
              notificationsEnabled: data.notifications_enabled,
              reminderTime: data.reminder_time,
              theme: data.theme,
              language: data.language,
              privacyAnalytics: data.privacy_analytics,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            }
          : undefined,
      };
    } catch {
      return { success: false, error: 'Failed to update user preferences' };
    }
  },
};
