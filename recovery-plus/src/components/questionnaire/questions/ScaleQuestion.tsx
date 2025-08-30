import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface ScaleQuestionProps {
  question: Question;
  value?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

export const ScaleQuestion: React.FC<ScaleQuestionProps> = ({
  question,
  value,
  onValueChange,
  disabled = false,
}) => {
  const scale = question.scale || { min: 1, max: 10, step: 1 };
  const { min, max, step = 1, minLabel, maxLabel } = scale;

  // Generate scale values
  const scaleValues: number[] = [];
  for (let i = min; i <= max; i += step) {
    scaleValues.push(i);
  }

  const handleValuePress = (scaleValue: number) => {
    if (disabled) return;
    onValueChange(scaleValue);
  };

  return (
    <View>
      {/* Scale labels */}
      {(minLabel || maxLabel) && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          {minLabel && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.muted,
                textAlign: 'left',
              }}
            >
              {minLabel}
            </Text>
          )}
          {maxLabel && (
            <Text
              style={{
                fontSize: 12,
                color: theme.colors.text.muted,
                textAlign: 'right',
              }}
            >
              {maxLabel}
            </Text>
          )}
        </View>
      )}

      {/* Scale buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {scaleValues.map(scaleValue => {
          const isSelected = value === scaleValue;

          return (
            <TouchableOpacity
              key={scaleValue}
              style={{
                width: Math.min(48, (100 / scaleValues.length) * 3.6) + '%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected
                  ? theme.colors.primary[500]
                  : theme.colors.border,
                backgroundColor: isSelected
                  ? theme.colors.primary[500]
                  : theme.colors.surface,
              }}
              onPress={() => handleValuePress(scaleValue)}
              disabled={disabled}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected
                    ? theme.colors.white
                    : theme.colors.text.primary,
                }}
              >
                {scaleValue}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected value display */}
      {value !== undefined && (
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.primary[600],
            textAlign: 'center',
            marginTop: 12,
            fontWeight: '500',
          }}
        >
          Selected: {value}
        </Text>
      )}
    </View>
  );
};
