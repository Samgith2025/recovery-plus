import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface SingleChoiceQuestionProps {
  question: Question;
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  value,
  onValueChange,
  disabled = false,
}) => {
  const options = question.options || [];

  const handleOptionPress = (optionValue: string) => {
    if (disabled) return;
    onValueChange(optionValue);
  };

  return (
    <View>
      {options.map((option, index) => {
        const isSelected = value === option.value;

        return (
          <TouchableOpacity
            key={option.id || index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              marginBottom: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isSelected
                ? theme.colors.primary[500]
                : theme.colors.border,
              backgroundColor: isSelected
                ? theme.colors.primary[50]
                : theme.colors.surface,
            }}
            onPress={() => handleOptionPress(option.value.toString())}
            disabled={disabled}
          >
            {/* Radio button indicator */}
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: isSelected
                  ? theme.colors.primary[500]
                  : theme.colors.border,
                marginRight: 12,
                backgroundColor: isSelected
                  ? theme.colors.primary[500]
                  : 'transparent',
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
                    backgroundColor: theme.colors.white,
                  }}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected
                    ? theme.colors.primary[700]
                    : theme.colors.text.primary,
                  marginBottom: option.description ? 4 : 0,
                }}
              >
                {option.label}
              </Text>

              {option.description && (
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                  }}
                >
                  {option.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
