import { useState, useCallback } from 'react';
import { aiQuestionnaireService, AIQuestionnaireSession } from '../services/aiQuestionnaireService';
import type { QuestionnaireResponse } from '../types/questionnaire';

export interface UseAdaptiveQuestionnaireProps {
  userId?: string;
  onComplete?: (responses: QuestionnaireResponse[], summary: any) => void;
  onError?: (error: Error) => void;
}

export interface UseAdaptiveQuestionnaireReturn {
  // State
  session: AIQuestionnaireSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startQuestionnaire: () => Promise<void>;
  submitResponse: (questionId: string, response: any) => Promise<{ hasNext: boolean; isComplete: boolean }>;
  completeQuestionnaire: () => Promise<void>;
  resetQuestionnaire: () => void;
  
  // Utilities
  getCurrentQuestion: () => any | null;
  getProgress: () => number;
  canGoBack: () => boolean;
  goBack: () => boolean;
}

export const useAdaptiveQuestionnaire = ({
  userId,
  onComplete,
  onError,
}: UseAdaptiveQuestionnaireProps = {}): UseAdaptiveQuestionnaireReturn => {
  const [session, setSession] = useState<AIQuestionnaireSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    onError?.(err);
  }, [onError]);

  const startQuestionnaire = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newSession = await aiQuestionnaireService.startAdaptiveQuestionnaire(userId);
      setSession(newSession);
      setCurrentQuestionIndex(0);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to start questionnaire'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, handleError]);

  const submitResponse = useCallback(async (questionId: string, response: any) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await aiQuestionnaireService.submitResponse(
        session.sessionId,
        questionId,
        response
      );

      setSession(result.session);

      if (result.nextQuestion) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      return {
        hasNext: !!result.nextQuestion,
        isComplete: !!result.isComplete,
      };
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to submit response'));
      return { hasNext: false, isComplete: false };
    } finally {
      setIsLoading(false);
    }
  }, [session, handleError]);

  const completeQuestionnaire = useCallback(async () => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await aiQuestionnaireService.completeSession(session.sessionId);
      const responses = aiQuestionnaireService.convertToStandardResponses(result.session);
      
      setSession(result.session);
      onComplete?.(responses, result.summary);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to complete questionnaire'));
    } finally {
      setIsLoading(false);
    }
  }, [session, onComplete, handleError]);

  const resetQuestionnaire = useCallback(() => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setError(null);
  }, []);

  const getCurrentQuestion = useCallback(() => {
    if (!session || currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[currentQuestionIndex];
  }, [session, currentQuestionIndex]);

  const getProgress = useCallback(() => {
    if (!session || session.questions.length === 0) {
      return 0;
    }
    
    // Add 1 to total if questionnaire is still in progress (expecting more questions)
    const totalQuestions = session.completionStatus === 'in_progress' 
      ? session.questions.length + 1 
      : session.questions.length;
    
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  }, [session, currentQuestionIndex]);

  const canGoBack = useCallback(() => {
    return currentQuestionIndex > 0;
  }, [currentQuestionIndex]);

  const goBack = useCallback(() => {
    if (canGoBack()) {
      setCurrentQuestionIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [canGoBack]);

  return {
    // State
    session,
    isLoading,
    error,
    
    // Actions
    startQuestionnaire,
    submitResponse,
    completeQuestionnaire,
    resetQuestionnaire,
    
    // Utilities
    getCurrentQuestion,
    getProgress,
    canGoBack,
    goBack,
  };
};

/**
 * Utility hook for comparing static vs adaptive questionnaire performance
 */
export const useQuestionnaireMode = () => {
  const [mode, setMode] = useState<'static' | 'adaptive' | 'hybrid'>('adaptive');
  const [metrics, setMetrics] = useState({
    questionsAsked: 0,
    completionTime: 0,
    userSatisfaction: 0,
    adaptiveAccuracy: 0,
  });

  const trackMetrics = useCallback((metric: Partial<typeof metrics>) => {
    setMetrics(prev => ({ ...prev, ...metric }));
  }, []);

  const switchMode = useCallback((newMode: typeof mode) => {
    setMode(newMode);
    // Reset metrics when switching modes
    setMetrics({
      questionsAsked: 0,
      completionTime: 0,
      userSatisfaction: 0,
      adaptiveAccuracy: 0,
    });
  }, []);

  return {
    mode,
    metrics,
    switchMode,
    trackMetrics,
  };
};
