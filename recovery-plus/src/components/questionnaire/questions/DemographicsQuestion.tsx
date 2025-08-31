import React from 'react';
import { View, Text } from 'react-native';
import type { Question } from '../../../types/questionnaire';
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

  // Demographics change handler would be implemented here

  return (
    <View>
      {fields.map(field => (
        <View key={field} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            {field.replace('_', ' ')}
          </Text>
          {/* Simplified demographic input - would need proper implementation */}
          <Text style={{ color: theme.colors.text.secondary }}>
            {field} selection (needs implementation)
          </Text>
        </View>
      ))}

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
