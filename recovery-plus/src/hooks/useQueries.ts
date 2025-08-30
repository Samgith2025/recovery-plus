import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../services/supabase';
import { aiService } from '../services/openai';

// Query keys
export const queryKeys = {
  userProfile: (userId: string) => ['userProfile', userId],
  questionnaire: (userId: string) => ['questionnaire', userId],
  recoveryPhase: (userId: string) => ['recoveryPhase', userId],
  exercises: (filters?: { bodyPart?: string; difficulty?: number }) => [
    'exercises',
    filters,
  ],
  exerciseSessions: (userId: string, exerciseId?: string) => [
    'exerciseSessions',
    userId,
    exerciseId,
  ],
  chatHistory: (userId: string) => ['chatHistory', userId],
};

// User profile queries
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.userProfile(userId),
    queryFn: () => db.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      db.updateUserProfile(userId, updates),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfile(userId),
      });
    },
  });
};

// Questionnaire queries
export const useQuestionnaireResponse = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.questionnaire(userId),
    queryFn: () => db.getQuestionnaireResponse(userId),
    enabled: !!userId,
    retry: (failureCount, error: any) => {
      // Don't retry if questionnaire doesn't exist
      if (error?.code === 'PGRST116') return false;
      return failureCount < 2;
    },
  });
};

export const useSaveQuestionnaireResponse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, responses }: { userId: string; responses: any }) =>
      db.saveQuestionnaireResponse(userId, responses),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.questionnaire(userId),
      });
    },
  });
};

// Recovery phase queries
export const useRecoveryPhase = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.recoveryPhase(userId),
    queryFn: () => db.getUserRecoveryPhase(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateRecoveryPhase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phaseData: any) => db.createRecoveryPhase(phaseData),
    onSuccess: data => {
      if (data.data?.user_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.recoveryPhase(data.data.user_id),
        });
      }
    },
  });
};

// Exercise queries
export const useExercises = (filters?: {
  bodyPart?: string;
  difficulty?: number;
}) => {
  return useQuery({
    queryKey: queryKeys.exercises(filters),
    queryFn: () => db.getExercises(filters),
    staleTime: 30 * 60 * 1000, // 30 minutes - exercises don't change often
  });
};

export const useExerciseSessions = (userId: string, exerciseId?: string) => {
  return useQuery({
    queryKey: queryKeys.exerciseSessions(userId, exerciseId),
    queryFn: () => db.getUserExerciseSessions(userId, exerciseId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSaveExerciseSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData: any) => db.saveExerciseSession(sessionData),
    onSuccess: data => {
      if (data.data?.user_id) {
        queryClient.invalidateQueries({
          queryKey: ['exerciseSessions', data.data.user_id],
        });
      }
    },
  });
};

// Chat queries
export const useChatHistory = (userId: string, limit?: number) => {
  return useQuery({
    queryKey: queryKeys.chatHistory(userId),
    queryFn: () => db.getChatHistory(userId, limit),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useSaveChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      message,
      isUser,
    }: {
      userId: string;
      message: string;
      isUser: boolean;
    }) => db.saveChatMessage(userId, message, isUser),
    onSuccess: (data, { userId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.chatHistory(userId),
      });
    },
  });
};

// AI service queries
export const useAICoachingResponse = () => {
  return useMutation({
    mutationFn: ({
      messages,
      userContext,
    }: {
      messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
      }>;
      userContext?: any;
    }) => aiService.generateCoachingResponse(messages, userContext),
  });
};

export const useAIExerciseRecommendations = () => {
  return useMutation({
    mutationFn: (userProfile: {
      painAreas: string[];
      painLevel: number;
      activityLevel: string;
      limitations?: string[];
    }) => aiService.generateExerciseRecommendations(userProfile),
  });
};

export const useAIPhaseAnalysis = () => {
  return useMutation({
    mutationFn: (questionnaireData: Record<string, unknown>) =>
      aiService.analyzeQuestionnaireForPhase(questionnaireData),
  });
};
