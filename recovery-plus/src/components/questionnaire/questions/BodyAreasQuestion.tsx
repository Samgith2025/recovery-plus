import React from 'react';
import { View, Text } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { BodyAreaSelector } from '../../ui/BodyAreaSelector';
import { theme } from '../../../styles/theme';

interface BodyAreasQuestionProps {
  question: Question;
  value?: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
}

export const BodyAreasQuestion: React.FC<BodyAreasQuestionProps> = ({
  question,
  value = [],
  onValueChange,
  disabled = false,
}) => {
  const maxSelections =
    (question.metadata?.maxSelections as number) || undefined;

  const handleBodyAreasChange = (selectedAreas: string[]) => {
    if (disabled) return;
    onValueChange(selectedAreas);
  };

  return (
    <View>
      {maxSelections && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Select up to {maxSelections} area{maxSelections > 1 ? 's' : ''} (
          {value.length} selected)
        </Text>
      )}

      <BodyAreaSelector
        selectedAreas={value}
        onSelectionChange={disabled ? () => {} : handleBodyAreasChange}
        maxSelections={maxSelections}
      />

      {value.length > 0 && (
        <View
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: theme.colors.primary[50],
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.primary[200],
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.primary[700],
              textAlign: 'center',
              fontWeight: '500',
            }}
          >
            Selected: {value.join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};
