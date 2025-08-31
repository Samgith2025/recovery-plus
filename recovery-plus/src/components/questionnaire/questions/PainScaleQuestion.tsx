import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface PainScaleQuestionProps {
  question: Question;
  value?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

const PAIN_SCALE_CONFIG = [
  {
    value: 0,
    label: '0',
    description: 'No Pain',
    emoji: '😊',
    color: '#10B981',
  },
  {
    value: 1,
    label: '1',
    description: 'Minimal',
    emoji: '🙂',
    color: '#22C55E',
  },
  { value: 2, label: '2', description: 'Mild', emoji: '😐', color: '#84CC16' },
  { value: 3, label: '3', description: 'Mild', emoji: '😐', color: '#EAB308' },
  {
    value: 4,
    label: '4',
    description: 'Moderate',
    emoji: '😕',
    color: '#F59E0B',
  },
  {
    value: 5,
    label: '5',
    description: 'Moderate',
    emoji: '😟',
    color: '#F97316',
  },
  {
    value: 6,
    label: '6',
    description: 'Severe',
    emoji: '😣',
    color: '#EF4444',
  },
  {
    value: 7,
    label: '7',
    description: 'Severe',
    emoji: '😖',
    color: '#DC2626',
  },
  {
    value: 8,
    label: '8',
    description: 'Very Severe',
    emoji: '😫',
    color: '#B91C1C',
  },
  {
    value: 9,
    label: '9',
    description: 'Very Severe',
    emoji: '😩',
    color: '#991B1B',
  },
  {
    value: 10,
    label: '10',
    description: 'Worst Possible',
    emoji: '😭',
    color: '#7F1D1D',
  },
];

export const PainScaleQuestion: React.FC<PainScaleQuestionProps> = ({
  question: _question,
  value,
  onValueChange,
  disabled = false,
}) => {
  const handleValuePress = (painValue: number) => {
    if (disabled) return;
    onValueChange(painValue);
  };

  return (
    <View>
      {/* Scale description */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 16,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            textAlign: 'left',
          }}
        >
          No Pain
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.text.muted,
            textAlign: 'right',
          }}
        >
          Worst Pain
        </Text>
      </View>

      {/* Pain scale grid */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {PAIN_SCALE_CONFIG.map(painLevel => {
          const isSelected = value === painLevel.value;

          return (
            <TouchableOpacity
              key={painLevel.value}
              style={{
                width: '18%',
                aspectRatio: 1,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: isSelected ? painLevel.color : theme.colors.border,
                backgroundColor: isSelected
                  ? painLevel.color + '20'
                  : theme.colors.surface,
                padding: 4,
              }}
              onPress={() => handleValuePress(painLevel.value)}
              disabled={disabled}
            >
              <Text style={{ fontSize: 18, marginBottom: 2 }}>
                {painLevel.emoji}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isSelected ? '600' : '500',
                  color: isSelected
                    ? painLevel.color
                    : theme.colors.text.primary,
                }}
              >
                {painLevel.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected value display */}
      {value !== undefined && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor: PAIN_SCALE_CONFIG[value].color + '10',
            borderWidth: 1,
            borderColor: PAIN_SCALE_CONFIG[value].color + '40',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: PAIN_SCALE_CONFIG[value].color,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            {PAIN_SCALE_CONFIG[value].emoji} {value}/10 -{' '}
            {PAIN_SCALE_CONFIG[value].description}
          </Text>
        </View>
      )}
    </View>
  );
};
