import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import type {
  QuestionnaireConfig,
  QuestionnaireSession,
  QuestionnaireResponse,
  Question,
} from '../../types/questionnaire';
import { QuestionRenderer } from './QuestionRenderer';
import { Button } from '../ui/Button';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { theme } from '../../styles/theme';

interface QuestionnaireManagerProps {
  config: QuestionnaireConfig;
  session?: QuestionnaireSession;
  onComplete: (responses: QuestionnaireResponse[]) => void;
  onSave?: (responses: QuestionnaireResponse[]) => void;
  onExit?: () => void;
}

export const QuestionnaireManager: React.FC<QuestionnaireManagerProps> = ({
  config,
  session,
  onComplete,
  onSave,
  onExit,
}) => {
  // Flatten all questions across sections for easier navigation
  const allQuestions = config.sections.flatMap(section =>
    section.questions.map(question => ({
      ...question,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>(() => {
    // Initialize with existing session responses
    const initialResponses: Record<string, any> = {};
    if (session?.responses) {
      session.responses.forEach(response => {
        initialResponses[response.questionId] = response.value;
      });
    }
    return initialResponses;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentQuestion = allQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / allQuestions.length) * 100;

  // Auto-save functionality
  useEffect(() => {
    if (config.settings.autoSave && onSave) {
      const responseArray = Object.entries(responses).map(
        ([questionId, value]) => ({
          questionId,
          value,
          timestamp: new Date().toISOString(),
        })
      );
      onSave(responseArray);
    }
  }, [responses, config.settings.autoSave, onSave]);

  const validateResponse = (question: Question, value: any): string | null => {
    if (
      question.required &&
      (value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return 'This question is required';
    }

    if (question.validation) {
      for (const rule of question.validation) {
        switch (rule.type) {
          case 'required':
            if (!value) return rule.message;
            break;
          case 'min_length':
            if (
              typeof value === 'string' &&
              value.length < (rule.value as number)
            ) {
              return rule.message;
            }
            break;
          case 'max_length':
            if (
              typeof value === 'string' &&
              value.length > (rule.value as number)
            ) {
              return rule.message;
            }
            break;
          case 'min_value':
            if (typeof value === 'number' && value < (rule.value as number)) {
              return rule.message;
            }
            break;
          case 'max_value':
            if (typeof value === 'number' && value > (rule.value as number)) {
              return rule.message;
            }
            break;
          case 'custom':
            if (rule.customValidator && !rule.customValidator(value)) {
              return rule.message;
            }
            break;
        }
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

  const handleNext = () => {
    const currentValue = responses[currentQuestion.id];
    const error = validateResponse(currentQuestion, currentValue);

    if (error) {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: error,
      }));
      return;
    }

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Complete questionnaire
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    // Validate all responses
    const allErrors: Record<string, string> = {};

    allQuestions.forEach(question => {
      const value = responses[question.id];
      const error = validateResponse(question, value);
      if (error) {
        allErrors[question.id] = error;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      Alert.alert(
        'Incomplete Questionnaire',
        'Please complete all required questions before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Convert to response format
    const responseArray: QuestionnaireResponse[] = Object.entries(
      responses
    ).map(([questionId, value]) => ({
      questionId,
      value,
      timestamp: new Date().toISOString(),
    }));

    onComplete(responseArray);
  };

  const handleExit = () => {
    if (Object.keys(responses).length > 0) {
      Alert.alert(
        'Exit Questionnaire',
        'Are you sure you want to exit? Your progress will be saved.',
        [
          { text: 'Continue', style: 'cancel' },
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

  const canGoBack = config.settings.allowBack && currentQuestionIndex > 0;
  const isLastQuestion = currentQuestionIndex === allQuestions.length - 1;

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
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.text.primary,
            }}
          >
            {config.title}
          </Text>

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

        {config.settings.showProgress && (
          <ProgressIndicator
            currentStep={currentQuestionIndex + 1}
            totalSteps={allQuestions.length}
            progress={progress}
          />
        )}
      </View>

      {/* Section header */}
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
            fontSize: 16,
            fontWeight: '500',
            color: theme.colors.primary[700],
            marginBottom: 4,
          }}
        >
          {currentQuestion.sectionTitle}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.primary[600],
          }}
        >
          Question {currentQuestionIndex + 1} of {allQuestions.length}
        </Text>
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
          >
            Previous
          </Button>
        )}

        <Button onPress={handleNext} style={{ flex: canGoBack ? 1 : 2 }}>
          {isLastQuestion ? 'Complete' : 'Next'}
        </Button>
      </View>
    </View>
  );
};
