import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface MultipleChoiceQuestionProps {
  question: Question;
  value?: string[];
  onValueChange: (value: string[]) => void;
  disabled?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  value = [],
  onValueChange,
  disabled = false,
}) => {
  const options = question.options || [];
  const maxSelections = question.metadata?.maxSelections as number | undefined;

  const handleOptionPress = (optionValue: string) => {
    if (disabled) return;

    const currentValues = Array.isArray(value) ? value : [];
    const isSelected = currentValues.includes(optionValue);

    if (isSelected) {
      // Remove the option
      const newValues = currentValues.filter(v => v !== optionValue);
      onValueChange(newValues);
    } else {
      // Add the option (if not at max limit)
      if (!maxSelections || currentValues.length < maxSelections) {
        const newValues = [...currentValues, optionValue];
        onValueChange(newValues);
      }
    }
  };

  const isAtMaxSelections = maxSelections && value.length >= maxSelections;

  return (
    <View>
      {maxSelections && (
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            marginBottom: 8,
            textAlign: 'right',
          }}
        >
          {value.length}/{maxSelections} selected
        </Text>
      )}

      {options.map((option, index) => {
        const isSelected = value.includes(option.value.toString());
        const isDisabledOption = disabled || (!isSelected && isAtMaxSelections);

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
              opacity: isDisabledOption ? 0.6 : 1,
            }}
            onPress={() => handleOptionPress(option.value.toString())}
            disabled={Boolean(isDisabledOption)}
          >
            {/* Checkbox indicator */}
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
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
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: theme.colors.white,
                  }}
                >
                  ✓
                </Text>
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
