import React from 'react';
import { View, TextInput, Text } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface NumberQuestionProps {
  question: Question;
  value?: number;
  onValueChange: (value: number | undefined) => void;
  disabled?: boolean;
}

export const NumberQuestion: React.FC<NumberQuestionProps> = ({
  question,
  value,
  onValueChange,
  disabled = false,
}) => {
  const placeholder =
    (question.metadata?.placeholder as string) || 'Enter a number...';
  const min = (question.metadata?.min as number) || undefined;
  const max = (question.metadata?.max as number) || undefined;

  const handleTextChange = (text: string) => {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanedText = text.replace(/[^0-9.-]/g, '');

    if (cleanedText === '' || cleanedText === '-') {
      onValueChange(undefined);
      return;
    }

    const numValue = parseFloat(cleanedText);

    if (isNaN(numValue)) {
      return;
    }

    // Check bounds
    if (min !== undefined && numValue < min) return;
    if (max !== undefined && numValue > max) return;

    onValueChange(numValue);
  };

  return (
    <View>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          color: theme.colors.text.primary,
          backgroundColor: theme.colors.surface,
          minHeight: 48,
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        value={value?.toString() || ''}
        onChangeText={handleTextChange}
        keyboardType="numeric"
        editable={!disabled}
      />

      {(min !== undefined || max !== undefined) && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            marginTop: 4,
            textAlign: 'right',
          }}
        >
          {min !== undefined && max !== undefined
            ? `Range: ${min} - ${max}`
            : min !== undefined
              ? `Min: ${min}`
              : `Max: ${max}`}
        </Text>
      )}
    </View>
  );
};
