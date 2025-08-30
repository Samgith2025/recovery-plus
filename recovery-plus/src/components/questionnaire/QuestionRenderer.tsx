import React from 'react';
import { View, Text } from 'react-native';
import type {
  Question,
  QuestionnaireResponse,
} from '../../types/questionnaire';
import { theme } from '../../styles/theme';

// Individual question components
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion';
import { SingleChoiceQuestion } from './questions/SingleChoiceQuestion';
import { ScaleQuestion } from './questions/ScaleQuestion';
import { PainScaleQuestion } from './questions/PainScaleQuestion';
import { TextQuestion } from './questions/TextQuestion';
import { NumberQuestion } from './questions/NumberQuestion';
import { BooleanQuestion } from './questions/BooleanQuestion';
import { BodyAreasQuestion } from './questions/BodyAreasQuestion';
import { DemographicsQuestion } from './questions/DemographicsQuestion';

interface QuestionRendererProps {
  question: Question;
  value?: any;
  onValueChange: (questionId: string, value: any) => void;
  error?: string;
  disabled?: boolean;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onValueChange,
  error,
  disabled = false,
}) => {
  const handleValueChange = (newValue: any) => {
    onValueChange(question.id, newValue);
  };

  const renderQuestionHeader = () => (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.colors.text.primary,
          marginBottom: 4,
        }}
      >
        {question.title}
        {question.required && (
          <Text style={{ color: theme.colors.error[500], fontSize: 16 }}>
            {' '}
            *
          </Text>
        )}
      </Text>

      {question.subtitle && (
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.text.secondary,
            marginBottom: 4,
          }}
        >
          {question.subtitle}
        </Text>
      )}

      {question.helpText && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            fontStyle: 'italic',
          }}
        >
          {question.helpText}
        </Text>
      )}
    </View>
  );

  const renderQuestionInput = () => {
    const commonProps = {
      value,
      onValueChange: handleValueChange,
      disabled,
      question,
    };

    switch (question.type) {
      case 'multiple_choice':
        return <MultipleChoiceQuestion {...commonProps} />;

      case 'single_choice':
        return <SingleChoiceQuestion {...commonProps} />;

      case 'scale':
        return <ScaleQuestion {...commonProps} />;

      case 'pain_scale':
        return <PainScaleQuestion {...commonProps} />;

      case 'text':
        return <TextQuestion {...commonProps} />;

      case 'number':
        return <NumberQuestion {...commonProps} />;

      case 'boolean':
        return <BooleanQuestion {...commonProps} />;

      case 'body_areas':
        return <BodyAreasQuestion {...commonProps} />;

      case 'demographics':
        return <DemographicsQuestion {...commonProps} />;

      default:
        return (
          <View
            style={{
              padding: 16,
              backgroundColor: theme.colors.warning[50],
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.warning[300],
            }}
          >
            <Text
              style={{ color: theme.colors.warning[700], textAlign: 'center' }}
            >
              Unsupported question type: {question.type}
            </Text>
          </View>
        );
    }
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Text
        style={{
          fontSize: 12,
          color: theme.colors.error[500],
          marginTop: 8,
          fontWeight: '500',
        }}
      >
        {error}
      </Text>
    );
  };

  return (
    <View
      style={{
        marginBottom: 32,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {renderQuestionHeader()}
      {renderQuestionInput()}
      {renderError()}
    </View>
  );
};
