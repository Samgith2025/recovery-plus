import { create } from 'zustand';
import { QuestionnaireResponse } from '../types';

interface QuestionnaireState {
  // Current questionnaire session
  currentStep: number;
  totalSteps: number;
  responses: Record<string, unknown>;
  isCompleted: boolean;

  // Saved questionnaire data
  savedResponse: QuestionnaireResponse | null;

  // Actions
  setCurrentStep: (step: number) => void;
  setTotalSteps: (total: number) => void;
  updateResponse: (key: string, value: unknown) => void;
  updateMultipleResponses: (responses: Record<string, unknown>) => void;
  setIsCompleted: (completed: boolean) => void;
  setSavedResponse: (response: QuestionnaireResponse | null) => void;
  resetQuestionnaire: () => void;

  // Computed values
  progress: () => number;
  canProceed: () => boolean;
}

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  // Initial state
  currentStep: 0,
  totalSteps: 1,
  responses: {},
  isCompleted: false,
  savedResponse: null,

  // Actions
  setCurrentStep: step => set({ currentStep: step }),
  setTotalSteps: total => set({ totalSteps: total }),

  updateResponse: (key, value) =>
    set(state => ({
      responses: { ...state.responses, [key]: value },
    })),

  updateMultipleResponses: responses =>
    set(state => ({
      responses: { ...state.responses, ...responses },
    })),

  setIsCompleted: completed => set({ isCompleted: completed }),
  setSavedResponse: response => set({ savedResponse: response }),

  resetQuestionnaire: () =>
    set({
      currentStep: 0,
      responses: {},
      isCompleted: false,
    }),

  // Computed values
  progress: () => {
    const { currentStep, totalSteps } = get();
    return totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  },

  canProceed: () => {
    const { currentStep, totalSteps } = get();
    return currentStep < totalSteps;
  },
}));
