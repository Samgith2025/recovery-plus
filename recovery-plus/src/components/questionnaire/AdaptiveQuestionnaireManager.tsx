import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../ui/Button';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { QuestionRenderer } from './QuestionRenderer';
import { 
  aiQuestionnaireService, 
  AIQuestionnaireSession, 
  AIGeneratedQuestion 
} from '../../services/aiQuestionnaireService';
import type { QuestionnaireResponse } from '../../types/questionnaire';

interface AdaptiveQuestionnaireManagerProps {
  userId?: string;
  onComplete: (responses: QuestionnaireResponse[], summary: any) => void;
  onSave?: (responses: QuestionnaireResponse[]) => void;
  onExit?: () => void;
}

export const AdaptiveQuestionnaireManager: React.FC<AdaptiveQuestionnaireManagerProps> = ({
  userId,
  onComplete,
  onSave,
  onExit,
}) => {
  const [session, setSession] = useState<AIQuestionnaireSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<AIGeneratedQuestion | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize adaptive questionnaire
  useEffect(() => {
    initializeQuestionnaire();
  }, []);

  const initializeQuestionnaire = async () => {
    try {
      setIsLoading(true);
      const newSession = await aiQuestionnaireService.startAdaptiveQuestionnaire(userId);
      setSession(newSession);
      setCurrentQuestion(newSession.questions[0]);
      setCurrentQuestionIndex(0);
    } catch (error) {
      console.error('Error initializing questionnaire:', error);
      Alert.alert(
        'Error',
        'Failed to start adaptive questionnaire. Please try again.',
        [{ text: 'OK', onPress: onExit }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (session && onSave && Object.keys(responses).length > 0) {
      const responseArray = aiQuestionnaireService.convertToStandardResponses({
        ...session,
        responses,
      });
      onSave(responseArray);
    }
  }, [responses, session, onSave]);

  const validateResponse = (question: AIGeneratedQuestion, value: any): string | null => {
    if (
      question.required &&
      (value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return 'This question is required';
    }

    // Type-specific validation
    if (question.type === 'scale' && question.min !== undefined && question.max !== undefined) {
      if (typeof value === 'number' && (value < question.min || value > question.max)) {
        return `Please select a value between ${question.min} and ${question.max}`;
      }
    }

    return null;
  };

  const handleValueChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear error for this question if it exists
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleNext = async () => {
    if (!session || !currentQuestion) return;

    const currentValue = responses[currentQuestion.id];
    const error = validateResponse(currentQuestion, currentValue);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: error,
      }));
      return;
    }

    try {
      setIsGeneratingQuestion(true);

      // Submit response and get next question
      const result = await aiQuestionnaireService.submitResponse(
        session.sessionId,
        currentQuestion.id,
        currentValue
      );

      setSession(result.session);
      setResponses(result.session.responses);

      if (result.isComplete) {
        // Complete the questionnaire
        await handleComplete();
      } else if (result.nextQuestion) {
        // Move to next question
        setCurrentQuestion(result.nextQuestion);
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Unexpected state
        await handleComplete();
      }
    } catch (error) {
      console.error('Error processing response:', error);
      Alert.alert(
        'Error',
        'Failed to process your response. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0 && session) {
      const prevQuestion = session.questions[currentQuestionIndex - 1];
      setCurrentQuestion(prevQuestion);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!session) return;

    try {
      setIsGeneratingQuestion(true);

      // Complete the session and get summary
      const result = await aiQuestionnaireService.completeSession(session.sessionId);
      
      // Convert to standard response format
      const responseArray = aiQuestionnaireService.convertToStandardResponses(result.session);
      
      onComplete(responseArray, result.summary);
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      Alert.alert(
        'Error',
        'Failed to complete questionnaire. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleExit = () => {
    if (Object.keys(responses).length > 0) {
      Alert.alert(
        'Exit Assessment',
        'Are you sure you want to exit? Your progress will be saved and you can continue later.',
        [
          { text: 'Continue Assessment', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => onExit?.(),
          },
        ]
      );
    } else {
      onExit?.();
    }
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}>
          🤖 Setting up your personalized assessment...
        </Text>
        <Text style={{
          marginTop: 8,
          fontSize: 14,
          color: theme.colors.text.muted,
          textAlign: 'center',
        }}>
          Our AI is preparing questions tailored just for you
        </Text>
      </View>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Text style={{ color: theme.colors.text.primary }}>
          Failed to load questionnaire
        </Text>
        <Button onPress={onExit} style={{ marginTop: 16 }}>
          Go Back
        </Button>
      </View>
    );
  }

  const canGoBack = currentQuestionIndex > 0;
  const progress = session.questions.length > 0 
    ? ((currentQuestionIndex + 1) / Math.max(session.questions.length, currentQuestionIndex + 2)) * 100 
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text.primary,
              }}
            >
              🤖 AI Recovery Assessment
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.muted,
                marginTop: 2,
              }}
            >
              Adaptive questions powered by AI
            </Text>
          </View>

          {onExit && (
            <TouchableOpacity onPress={handleExit}>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.text.muted,
                }}
              >
                Exit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ProgressIndicator
          currentStep={currentQuestionIndex + 1}
          totalSteps={session.questions.length + (session.completionStatus === 'in_progress' ? 1 : 0)}
          progress={progress}
        />
      </View>

      {/* AI Context */}
      <View
        style={{
          padding: 16,
          backgroundColor: theme.colors.primary[50],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.primary[100],
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.primary[700],
            marginBottom: 4,
          }}
        >
          📊 Question {currentQuestionIndex + 1} 
          {session.questions.length > currentQuestionIndex + 1 && ` of ${session.questions.length}+`}
        </Text>
        {currentQuestion.reasoning && (
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.primary[600],
              fontStyle: 'italic',
            }}
          >
            💡 {currentQuestion.reasoning}
          </Text>
        )}
      </View>

      {/* Question content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <QuestionRenderer
          question={currentQuestion}
          value={responses[currentQuestion.id]}
          onValueChange={handleValueChange}
          error={errors[currentQuestion.id]}
        />

        {/* AI Insight */}
        {currentQuestion.adaptiveScore !== undefined && (
          <View
            style={{
              marginTop: 20,
              padding: 12,
              backgroundColor: theme.colors.info[50],
              borderRadius: 8,
              borderLeftWidth: 3,
              borderLeftColor: theme.colors.info[400],
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.info[700],
                fontWeight: '500',
              }}
            >
              🧠 AI Insight
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.info[600],
                marginTop: 2,
              }}
            >
              This question was generated based on your previous responses 
              (Priority: {Math.round(currentQuestion.adaptiveScore * 100)}%)
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View
        style={{
          flexDirection: 'row',
          padding: 16,
          gap: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        {canGoBack && (
          <Button
            variant="outline"
            onPress={handlePrevious}
            style={{ flex: 1 }}
            disabled={isGeneratingQuestion}
          >
            Previous
          </Button>
        )}

        <Button 
          onPress={handleNext} 
          style={{ flex: canGoBack ? 1 : 2 }}
          loading={isGeneratingQuestion}
          disabled={isGeneratingQuestion}
        >
          {isGeneratingQuestion ? 'Generating...' : 'Next'}
        </Button>
      </View>
    </View>
  );
};
