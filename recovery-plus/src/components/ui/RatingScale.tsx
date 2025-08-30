import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../../styles/theme';

export interface RatingScaleProps {
  value: number | null;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  question: string;
  description?: string;
  labels?: Record<number, string>;
  scaleType?: 'pain' | 'difficulty' | 'satisfaction' | 'default';
  disabled?: boolean;
}

export const RatingScale: React.FC<RatingScaleProps> = ({
  value,
  onValueChange,
  min = 1,
  max = 10,
  question,
  description,
  labels,
  scaleType = 'default',
  disabled = false,
}) => {
  const getScaleColor = (rating: number) => {
    switch (scaleType) {
      case 'pain':
        if (rating <= 3) return theme.colors.success[500];
        if (rating <= 6) return theme.colors.warning[500];
        return theme.colors.error[500];
      case 'difficulty':
        if (rating <= 3) return theme.colors.success[500];
        if (rating <= 7) return theme.colors.primary[500];
        return theme.colors.error[500];
      case 'satisfaction':
        if (rating <= 3) return theme.colors.error[500];
        if (rating <= 6) return theme.colors.warning[500];
        return theme.colors.success[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const getScaleLabels = () => {
    if (labels) return labels;

    switch (scaleType) {
      case 'pain':
        return {
          1: 'No Pain',
          3: 'Mild',
          5: 'Moderate',
          7: 'Severe',
          10: 'Worst Pain',
        };
      case 'difficulty':
        return {
          1: 'Very Easy',
          3: 'Easy',
          5: 'Moderate',
          7: 'Hard',
          10: 'Impossible',
        };
      case 'satisfaction':
        return {
          1: 'Terrible',
          3: 'Poor',
          5: 'Fair',
          7: 'Good',
          10: 'Excellent',
        };
      default:
        return {
          1: 'Low',
          5: 'Medium',
          10: 'High',
        };
    }
  };

  const scaleLabels = getScaleLabels();
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[4],
      }}
    >
      <Text
        style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[2],
          textAlign: 'center',
        }}
      >
        {question}
      </Text>

      {description && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginBottom: theme.spacing[4],
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          {description}
        </Text>
      )}

      {/* Scale Numbers */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing[3],
          paddingHorizontal: theme.spacing[2],
        }}
      >
        {numbers.map(number => {
          const isSelected = value === number;
          const color = isSelected
            ? getScaleColor(number)
            : theme.colors.gray[300];

          return (
            <Pressable
              key={number}
              onPress={() => !disabled && onValueChange(number)}
              disabled={disabled}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: color,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: disabled ? 0.6 : 1,
                elevation: isSelected ? 3 : 1,
                shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
                shadowOpacity: 0.15,
                shadowRadius: isSelected ? 6 : 2,
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: isSelected
                    ? theme.typography.fontWeight.bold
                    : theme.typography.fontWeight.medium,
                  color: isSelected
                    ? theme.colors.surface
                    : theme.colors.text.primary,
                }}
              >
                {number}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Scale Labels */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[1],
          marginBottom: theme.spacing[2],
        }}
      >
        {Object.entries(scaleLabels).map(([rating, label]) => {
          const position = ((parseInt(rating) - min) / (max - min)) * 100;

          return (
            <View
              key={rating}
              style={{
                position: 'absolute',
                left: `${position}%`,
                transform: [{ translateX: -20 }],
                width: 40,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.text.tertiary,
                  textAlign: 'center',
                  fontWeight:
                    value === parseInt(rating)
                      ? theme.typography.fontWeight.medium
                      : theme.typography.fontWeight.normal,
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Current Selection Display */}
      {value !== null && (
        <View
          style={{
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[3],
            alignItems: 'center',
            marginTop: theme.spacing[2],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing[1],
            }}
          >
            Your Rating:
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing[2],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
                color: getScaleColor(value),
              }}
            >
              {value}
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
              }}
            >
              - {scaleLabels[value] || 'Selected'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
