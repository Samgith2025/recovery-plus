import { create } from 'zustand';
import {
  ExerciseFeedback,
  FeedbackTrend,
  FeedbackAnalysis,
} from '../types/feedback';

interface FeedbackState {
  // Current feedback data
  currentFeedback: ExerciseFeedback | null;
  recentFeedback: ExerciseFeedback[];
  feedbackTrends: FeedbackTrend[];
  feedbackAnalysis: FeedbackAnalysis | null;

  // UI state
  isSubmittingFeedback: boolean;
  isLoadingFeedback: boolean;
  isLoadingAnalysis: boolean;
  feedbackError: string | null;

  // Actions
  setCurrentFeedback: (feedback: ExerciseFeedback | null) => void;
  setRecentFeedback: (feedback: ExerciseFeedback[]) => void;
  setFeedbackTrends: (trends: FeedbackTrend[]) => void;
  setFeedbackAnalysis: (analysis: FeedbackAnalysis | null) => void;

  setSubmittingFeedback: (isSubmitting: boolean) => void;
  setLoadingFeedback: (isLoading: boolean) => void;
  setLoadingAnalysis: (isLoading: boolean) => void;
  setFeedbackError: (error: string | null) => void;

  addFeedback: (feedback: ExerciseFeedback) => void;
  updateFeedback: (
    feedbackId: string,
    updates: Partial<ExerciseFeedback>
  ) => void;
  removeFeedback: (feedbackId: string) => void;

  // Computed values
  getAveragePainLevel: () => number;
  getAverageDifficultyRating: () => number;
  getExerciseFeedback: (exerciseId: string) => ExerciseFeedback[];
  getLatestFeedbackForExercise: (exerciseId: string) => ExerciseFeedback | null;
  getFeedbackCount: () => number;
  getPainTrend: () => 'improving' | 'stable' | 'worsening';

  // Clear state
  clearFeedbackData: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  // Initial state
  currentFeedback: null,
  recentFeedback: [],
  feedbackTrends: [],
  feedbackAnalysis: null,

  isSubmittingFeedback: false,
  isLoadingFeedback: false,
  isLoadingAnalysis: false,
  feedbackError: null,

  // Actions
  setCurrentFeedback: feedback => set({ currentFeedback: feedback }),
  setRecentFeedback: feedback => set({ recentFeedback: feedback }),
  setFeedbackTrends: trends => set({ feedbackTrends: trends }),
  setFeedbackAnalysis: analysis => set({ feedbackAnalysis: analysis }),

  setSubmittingFeedback: isSubmitting =>
    set({ isSubmittingFeedback: isSubmitting }),
  setLoadingFeedback: isLoading => set({ isLoadingFeedback: isLoading }),
  setLoadingAnalysis: isLoading => set({ isLoadingAnalysis: isLoading }),
  setFeedbackError: error => set({ feedbackError: error }),

  addFeedback: feedback =>
    set(state => ({
      recentFeedback: [feedback, ...state.recentFeedback].slice(0, 50), // Keep only recent 50
    })),

  updateFeedback: (feedbackId, updates) =>
    set(state => ({
      recentFeedback: state.recentFeedback.map(f =>
        f.id === feedbackId ? { ...f, ...updates } : f
      ),
      currentFeedback:
        state.currentFeedback?.id === feedbackId
          ? { ...state.currentFeedback, ...updates }
          : state.currentFeedback,
    })),

  removeFeedback: feedbackId =>
    set(state => ({
      recentFeedback: state.recentFeedback.filter(f => f.id !== feedbackId),
      currentFeedback:
        state.currentFeedback?.id === feedbackId ? null : state.currentFeedback,
    })),

  // Computed values
  getAveragePainLevel: () => {
    const { recentFeedback } = get();
    if (recentFeedback.length === 0) return 0;
    const total = recentFeedback.reduce((sum, f) => sum + f.painLevel, 0);
    return Math.round((total / recentFeedback.length) * 10) / 10;
  },

  getAverageDifficultyRating: () => {
    const { recentFeedback } = get();
    if (recentFeedback.length === 0) return 0;
    const total = recentFeedback.reduce(
      (sum, f) => sum + f.difficultyRating,
      0
    );
    return Math.round((total / recentFeedback.length) * 10) / 10;
  },

  getExerciseFeedback: exerciseId => {
    const { recentFeedback } = get();
    return recentFeedback
      .filter(f => f.exerciseId === exerciseId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  getLatestFeedbackForExercise: exerciseId => {
    const { recentFeedback } = get();
    const exerciseFeedback = recentFeedback
      .filter(f => f.exerciseId === exerciseId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return exerciseFeedback.length > 0 ? exerciseFeedback[0] : null;
  },

  getFeedbackCount: () => {
    const { recentFeedback } = get();
    return recentFeedback.length;
  },

  getPainTrend: () => {
    const { recentFeedback } = get();
    if (recentFeedback.length < 4) return 'stable';

    // Compare recent feedback to older feedback
    const sortedFeedback = [...recentFeedback].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const recentCount = Math.min(3, Math.floor(sortedFeedback.length / 2));
    const recentPain =
      sortedFeedback
        .slice(-recentCount)
        .reduce((sum, f) => sum + f.painLevel, 0) / recentCount;

    const olderPain =
      sortedFeedback
        .slice(0, recentCount)
        .reduce((sum, f) => sum + f.painLevel, 0) / recentCount;

    const difference = olderPain - recentPain;

    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'worsening';
    return 'stable';
  },

  clearFeedbackData: () =>
    set({
      currentFeedback: null,
      recentFeedback: [],
      feedbackTrends: [],
      feedbackAnalysis: null,
      feedbackError: null,
    }),
}));
