import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { theme } from '../../styles/theme';

export type QuestionType =
  | 'scale'
  | 'yesno'
  | 'multiple-choice'
  | 'text'
  | 'textarea'
  | 'rating';

export interface AssessmentAnswer {
  questionId: string;
  value: string | number;
  text?: string;
}

export interface AssessmentQuestionData {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  description?: string;
  required?: boolean;
  options?: { id: string; label: string; value: string | number }[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  };
}

interface AssessmentQuestionProps {
  question: AssessmentQuestionData;
  answer?: AssessmentAnswer;
  onAnswerChange: (answer: AssessmentAnswer) => void;
  showFeedback?: boolean;
  feedback?: {
    type: 'info' | 'warning' | 'success' | 'error';
    message: string;
  };
  disabled?: boolean;
  className?: string;
}

export const AssessmentQuestion: React.FC<AssessmentQuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  showFeedback = false,
  feedback,
  disabled = false,
  className,
}) => {
  const [textValue, setTextValue] = useState(answer?.text || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAnswerChange = (value: string | number, text?: string) => {
    const newAnswer: AssessmentAnswer = {
      questionId: question.id,
      value,
      text: text || textValue,
    };

    // Validate if needed
    if (question.validation && typeof value === 'string') {
      const error = validateInput(value);
      setValidationError(error);
      if (error) return;
    }

    onAnswerChange(newAnswer);
  };

  const validateInput = (input: string): string | null => {
    if (!question.validation) return null;

    const { minLength, maxLength, pattern, message } = question.validation;

    if (minLength && input.length < minLength) {
      return message || `Minimum ${minLength} characters required`;
    }

    if (maxLength && input.length > maxLength) {
      return message || `Maximum ${maxLength} characters allowed`;
    }

    if (pattern && !pattern.test(input)) {
      return message || 'Invalid format';
    }

    return null;
  };

  const renderScale = () => {
    const min = question.scaleMin || 1;
    const max = question.scaleMax || 10;
    const selectedValue = answer?.value as number;

    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
          }}
        >
          {Array.from({ length: max - min + 1 }, (_, index) => {
            const value = min + index;
            const isSelected = selectedValue === value;

            return (
              <Pressable
                key={value}
                onPress={() => handleAnswerChange(value)}
                disabled={disabled}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isSelected
                    ? theme.colors.primary[500]
                    : theme.colors.surface,
                  borderWidth: 2,
                  borderColor: isSelected
                    ? theme.colors.primary[600]
                    : theme.colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: isSelected
                      ? theme.colors.surface
                      : theme.colors.text.primary,
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Scale labels */}
        {question.scaleLabels && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing[2],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {question.scaleLabels.min}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {question.scaleLabels.max}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderYesNo = () => {
    const selectedValue = answer?.value as string;

    const options = [
      { id: 'yes', label: 'Yes', value: 'yes' },
      { id: 'no', label: 'No', value: 'no' },
    ];

    return (
      <View style={{ flexDirection: 'row', gap: theme.spacing[4] }}>
        {options.map(option => {
          const isSelected = selectedValue === option.value;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleAnswerChange(option.value)}
              disabled={disabled}
              style={{
                flex: 1,
                padding: theme.spacing[4],
                borderRadius: theme.borderRadius.lg,
                backgroundColor: isSelected
                  ? theme.colors.primary[500]
                  : theme.colors.surface,
                borderWidth: 2,
                borderColor: isSelected
                  ? theme.colors.primary[600]
                  : theme.colors.border,
                alignItems: 'center',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: isSelected
                    ? theme.colors.surface
                    : theme.colors.text.primary,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderMultipleChoice = () => {
    if (!question.options) return null;

    const selectedValue = answer?.value as string;

    return (
      <View>
        {question.options.map(option => {
          const isSelected = selectedValue === option.value;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleAnswerChange(option.value)}
              disabled={disabled}
              style={{
                padding: theme.spacing[4],
                marginBottom: theme.spacing[3],
                borderRadius: theme.borderRadius.lg,
                backgroundColor: isSelected
                  ? theme.colors.primary[50]
                  : theme.colors.surface,
                borderWidth: 2,
                borderColor: isSelected
                  ? theme.colors.primary[500]
                  : theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: isSelected
                    ? theme.colors.primary[500]
                    : theme.colors.gray[300],
                  backgroundColor: isSelected
                    ? theme.colors.primary[500]
                    : 'transparent',
                  marginRight: theme.spacing[3],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {isSelected && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.surface,
                    }}
                  />
                )}
              </View>

              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  color: isSelected
                    ? theme.colors.primary[700]
                    : theme.colors.text.primary,
                  flex: 1,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderTextInput = (multiline = false) => {
    return (
      <View>
        <TextInput
          value={textValue}
          onChangeText={text => {
            setTextValue(text);
            handleAnswerChange(text, text);
          }}
          placeholder={question.placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          editable={!disabled}
          style={{
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: validationError
              ? theme.colors.error[500]
              : theme.colors.border,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            minHeight: multiline ? 100 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
            opacity: disabled ? 0.6 : 1,
          }}
          placeholderTextColor={theme.colors.text.tertiary}
        />

        {question.validation?.maxLength && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
              textAlign: 'right',
              marginTop: theme.spacing[1],
            }}
          >
            {textValue.length}/{question.validation.maxLength}
          </Text>
        )}
      </View>
    );
  };

  const renderRating = () => {
    const max = question.scaleMax || 5;
    const selectedValue = answer?.value as number;

    return (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing[2],
        }}
      >
        {Array.from({ length: max }, (_, index) => {
          const value = index + 1;
          const isSelected = selectedValue >= value;

          return (
            <Pressable
              key={value}
              onPress={() => handleAnswerChange(value)}
              disabled={disabled}
              style={{
                padding: theme.spacing[1],
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  color: isSelected
                    ? theme.colors.warning[500]
                    : theme.colors.gray[300],
                }}
              >
                ⭐
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const getFeedbackStyles = () => {
    if (!feedback) return {};

    const colorMap = {
      info: theme.colors.info,
      warning: theme.colors.warning[500],
      success: theme.colors.success[500],
      error: theme.colors.error[500],
    };

    return {
      backgroundColor: `${colorMap[feedback.type]}15`,
      borderColor: colorMap[feedback.type],
      color: colorMap[feedback.type],
    };
  };

  return (
    <View style={{ padding: theme.spacing[4] }}>
      {/* Question header */}
      <View style={{ marginBottom: theme.spacing[6] }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing[2],
          }}
        >
          {question.title}
          {question.required && (
            <Text style={{ color: theme.colors.error[500] }}> *</Text>
          )}
        </Text>

        {question.subtitle && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[2],
            }}
          >
            {question.subtitle}
          </Text>
        )}

        {question.description && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.tertiary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {question.description}
          </Text>
        )}
      </View>

      {/* Question input */}
      <View style={{ marginBottom: theme.spacing[4] }}>
        {question.type === 'scale' && renderScale()}
        {question.type === 'yesno' && renderYesNo()}
        {question.type === 'multiple-choice' && renderMultipleChoice()}
        {question.type === 'text' && renderTextInput()}
        {question.type === 'textarea' && renderTextInput(true)}
        {question.type === 'rating' && renderRating()}
      </View>

      {/* Validation error */}
      {validationError && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error[500],
            marginBottom: theme.spacing[2],
          }}
        >
          {validationError}
        </Text>
      )}

      {/* Feedback */}
      {showFeedback && feedback && (
        <View
          style={{
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.md,
            borderWidth: 1,
            ...getFeedbackStyles(),
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              ...getFeedbackStyles(),
            }}
          >
            {feedback.message}
          </Text>
        </View>
      )}
    </View>
  );
};
