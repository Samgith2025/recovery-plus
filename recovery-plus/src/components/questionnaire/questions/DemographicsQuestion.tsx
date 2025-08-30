import React from 'react';
import { View, Text } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { DemographicSelector } from '../../ui/DemographicSelector';
import { theme } from '../../../styles/theme';

interface DemographicsQuestionProps {
  question: Question;
  value?: Record<string, any>;
  onValueChange: (value: Record<string, any>) => void;
  disabled?: boolean;
}

export const DemographicsQuestion: React.FC<DemographicsQuestionProps> = ({
  question,
  value = {},
  onValueChange,
  disabled = false,
}) => {
  const fields = (question.metadata?.fields as string[]) || [
    'age',
    'gender',
    'height',
    'weight',
    'activity_level',
  ];

  const handleDemographicsChange = (updates: Record<string, any>) => {
    if (disabled) return;
    onValueChange({ ...value, ...updates });
  };

  return (
    <View>
      <DemographicSelector
        fields={fields}
        value={value}
        onValueChange={handleDemographicsChange}
        disabled={disabled}
      />

      {Object.keys(value).length > 0 && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
              marginBottom: 8,
              fontWeight: '500',
            }}
          >
            Summary:
          </Text>
          {Object.entries(value).map(([key, val]) => (
            <Text
              key={key}
              style={{
                fontSize: 13,
                color: theme.colors.text.primary,
                marginBottom: 2,
              }}
            >
              {key.replace('_', ' ')}: {val?.toString() || 'Not specified'}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
