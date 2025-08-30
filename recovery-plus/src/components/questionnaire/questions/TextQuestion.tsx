import React from 'react';
import { View, TextInput, Text } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface TextQuestionProps {
  question: Question;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const TextQuestion: React.FC<TextQuestionProps> = ({
  question,
  value = '',
  onValueChange,
  disabled = false,
}) => {
  const placeholder =
    (question.metadata?.placeholder as string) || 'Enter your response...';
  const multiline = (question.metadata?.multiline as boolean) || false;
  const maxLength = (question.metadata?.maxLength as number) || undefined;

  const handleTextChange = (text: string) => {
    if (maxLength && text.length > maxLength) return;
    onValueChange(text);
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
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.muted}
        value={value}
        onChangeText={handleTextChange}
        multiline={multiline}
        maxLength={maxLength}
        editable={!disabled}
        numberOfLines={multiline ? 4 : 1}
      />

      {maxLength && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color:
                value.length > maxLength * 0.8
                  ? theme.colors.warning
                  : theme.colors.text.muted,
            }}
          >
            {value.length}/{maxLength}
          </Text>
        </View>
      )}
    </View>
  );
};
