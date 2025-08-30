import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Question } from '../../../types/questionnaire';
import { theme } from '../../../styles/theme';

interface BooleanQuestionProps {
  question: Question;
  value?: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const BooleanQuestion: React.FC<BooleanQuestionProps> = ({
  question,
  value,
  onValueChange,
  disabled = false,
}) => {
  const trueLabel = (question.metadata?.trueLabel as string) || 'Yes';
  const falseLabel = (question.metadata?.falseLabel as string) || 'No';

  const handleOptionPress = (booleanValue: boolean) => {
    if (disabled) return;
    onValueChange(booleanValue);
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
      }}
    >
      {/* True option */}
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor:
            value === true ? theme.colors.primary[500] : theme.colors.border,
          backgroundColor:
            value === true ? theme.colors.primary[50] : theme.colors.surface,
        }}
        onPress={() => handleOptionPress(true)}
        disabled={disabled}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor:
              value === true ? theme.colors.primary[500] : theme.colors.border,
            marginRight: 8,
            backgroundColor:
              value === true ? theme.colors.primary[500] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {value === true && (
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

        <Text
          style={{
            fontSize: 16,
            fontWeight: value === true ? '600' : '400',
            color:
              value === true
                ? theme.colors.primary[700]
                : theme.colors.text.primary,
            textAlign: 'center',
            flex: 1,
          }}
        >
          {trueLabel}
        </Text>
      </TouchableOpacity>

      {/* False option */}
      <TouchableOpacity
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor:
            value === false ? theme.colors.primary[500] : theme.colors.border,
          backgroundColor:
            value === false ? theme.colors.primary[50] : theme.colors.surface,
        }}
        onPress={() => handleOptionPress(false)}
        disabled={disabled}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor:
              value === false ? theme.colors.primary[500] : theme.colors.border,
            marginRight: 8,
            backgroundColor:
              value === false ? theme.colors.primary[500] : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {value === false && (
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

        <Text
          style={{
            fontSize: 16,
            fontWeight: value === false ? '600' : '400',
            color:
              value === false
                ? theme.colors.primary[700]
                : theme.colors.text.primary,
            textAlign: 'center',
            flex: 1,
          }}
        >
          {falseLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
