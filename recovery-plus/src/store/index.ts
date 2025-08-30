import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, QuestionnaireResponse, RecoveryPhase } from '../types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  signIn: (user: User) => void;
  signOut: () => void;

  // Onboarding state
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Questionnaire state
  questionnaireResponse: QuestionnaireResponse | null;
  setQuestionnaireResponse: (response: QuestionnaireResponse | null) => void;

  // Recovery phase state
  currentPhase: RecoveryPhase | null;
  setCurrentPhase: (phase: RecoveryPhase | null) => void;

  // App state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Premium features
  isPremium: boolean;
  setIsPremium: (premium: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      // User state
      user: null,
      isAuthenticated: false,
      setUser: user => set({ user, isAuthenticated: !!user }),
      signIn: user => set({ user, isAuthenticated: true }),
      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          questionnaireResponse: null,
          currentPhase: null,
        }),

      // Onboarding state
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: completed =>
        set({ hasCompletedOnboarding: completed }),

      // Questionnaire state
      questionnaireResponse: null,
      setQuestionnaireResponse: response =>
        set({ questionnaireResponse: response }),

      // Recovery phase state
      currentPhase: null,
      setCurrentPhase: phase => set({ currentPhase: phase }),

      // App state
      isLoading: false,
      setIsLoading: loading => set({ isLoading: loading }),

      // Premium features
      isPremium: false,
      setIsPremium: premium => set({ isPremium: premium }),
    }),
    {
      name: 'recovery-plus-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        questionnaireResponse: state.questionnaireResponse,
        currentPhase: state.currentPhase,
        isPremium: state.isPremium,
      }),
    }
  )
);
