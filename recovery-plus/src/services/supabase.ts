import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a mock client if environment variables are missing (for development)
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables missing - using mock client');
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
};

export const supabase = createSupabaseClient();

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => {
    if (!supabase) {
      return Promise.resolve({
        data: { user: null },
        error: { message: 'Supabase not configured' },
      });
    }
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      return {
        data: { subscription: null },
        error: { message: 'Supabase not configured' },
      };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Helper function for null supabase client
const createMockDbResponse = (message = 'Supabase not configured') => {
  return Promise.resolve({
    data: null,
    error: { message, code: 'SUPABASE_NOT_CONFIGURED' },
  });
};

// Wrapper function to handle supabase operations safely
const safeSupabaseOperation = async (operation: () => Promise<any>) => {
  if (!supabase) {
    return createMockDbResponse();
  }
  try {
    return await operation();
  } catch (error) {
    return { data: null, error };
  }
};

// Database helpers
export const db = {
  // User profile operations
  createUserProfile: async (
    userId: string,
    email: string,
    firstName?: string,
    lastName?: string
  ) => {
    if (!supabase) return createMockDbResponse();

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  getUserProfile: async (userId: string) => {
    if (!supabase) return createMockDbResponse();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateUserProfile: async (
    userId: string,
    updates: Partial<Database['public']['Tables']['user_profiles']['Update']>
  ) => {
    if (!supabase) return createMockDbResponse();

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  upsertUserProfile: async (
    userId: string,
    profileData: Database['public']['Tables']['user_profiles']['Insert']
  ) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        ...profileData,
        id: userId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  deleteUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);
    return { data, error };
  },

  // Questionnaire operations
  saveQuestionnaireResponse: async (userId: string, responses: any) => {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .insert({
        user_id: userId,
        responses,
        completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  getQuestionnaireResponse: async (userId: string) => {
    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  },

  // Recovery phase operations
  createRecoveryPhase: async (phaseData: any) => {
    const { data, error } = await supabase
      .from('recovery_phases')
      .insert(phaseData)
      .select()
      .single();
    return { data, error };
  },

  getUserRecoveryPhase: async (userId: string) => {
    const { data, error } = await supabase
      .from('recovery_phases')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    return { data, error };
  },

  // Exercise operations
  getExercises: async (filters?: {
    bodyPart?: string;
    difficulty?: number;
  }) => {
    let query = supabase.from('exercises').select('*');

    if (filters?.bodyPart) {
      query = query.contains('body_parts', [filters.bodyPart]);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Exercise session operations
  saveExerciseSession: async (sessionData: any) => {
    const { data, error } = await supabase
      .from('exercise_sessions')
      .insert(sessionData)
      .select()
      .single();
    return { data, error };
  },

  getUserExerciseSessions: async (userId: string, exerciseId?: string) => {
    let query = supabase
      .from('exercise_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // User preferences operations
  getUserPreferences: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  createUserPreferences: async (
    userId: string,
    preferences?: Partial<
      Database['public']['Tables']['user_preferences']['Insert']
    >
  ) => {
    const defaultPreferences = {
      notifications_enabled: true,
      theme: 'light',
      language: 'en',
      privacy_analytics: false,
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        ...defaultPreferences,
        ...preferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  updateUserPreferences: async (
    userId: string,
    updates: Partial<Database['public']['Tables']['user_preferences']['Update']>
  ) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  },

  upsertUserPreferences: async (
    userId: string,
    preferences: Partial<
      Database['public']['Tables']['user_preferences']['Insert']
    >
  ) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    return { data, error };
  },

  // Chat operations
  saveChatMessage: async (userId: string, message: string, isUser: boolean) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        content: message,
        is_user: isUser,
        created_at: new Date().toISOString(),
      } as Database['public']['Tables']['chat_messages']['Insert'])
      .select()
      .single();
    return { data, error };
  },

  getChatHistory: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);
    return { data, error };
  },
};
