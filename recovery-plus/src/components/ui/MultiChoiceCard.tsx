import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../../styles/theme';

export interface ChoiceOption {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  value?: string | number;
}

interface MultiChoiceCardProps {
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
  selectedOption?: string;
  onSelectionChange: (optionId: string) => void;
  multiSelect?: boolean;
  selectedOptions?: string[];
  onMultiSelectionChange?: (optionIds: string[]) => void;
  maxSelections?: number;
  layout?: 'stack' | 'grid';
  cardStyle?: 'default' | 'minimal' | 'prominent';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const MultiChoiceCard: React.FC<MultiChoiceCardProps> = ({
  title,
  subtitle,
  options,
  selectedOption,
  onSelectionChange,
  multiSelect = false,
  selectedOptions = [],
  onMultiSelectionChange,
  maxSelections,
  layout = 'stack',
  cardStyle = 'default',
  disabled = false,
  required = false,
  className,
}) => {
  const handleOptionPress = (optionId: string) => {
    if (disabled) return;

    if (multiSelect && onMultiSelectionChange) {
      const isSelected = selectedOptions.includes(optionId);

      if (isSelected) {
        // Remove from selection
        onMultiSelectionChange(selectedOptions.filter(id => id !== optionId));
      } else {
        // Add to selection (if under limit)
        if (!maxSelections || selectedOptions.length < maxSelections) {
          onMultiSelectionChange([...selectedOptions, optionId]);
        }
      }
    } else {
      // Single select
      onSelectionChange(optionId);
    }
  };

  const isOptionSelected = (optionId: string) => {
    if (multiSelect) {
      return selectedOptions.includes(optionId);
    }
    return selectedOption === optionId;
  };

  const getCardStyles = (isSelected: boolean, isDisabled: boolean) => {
    const baseStyles = {
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing[3],
      borderWidth: 2,
      elevation: isSelected ? 3 : 1,
      shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
      shadowOpacity: isSelected ? 0.15 : 0.05,
      shadowRadius: isSelected ? 6 : 3,
    };

    if (cardStyle === 'prominent') {
      return {
        ...baseStyles,
        padding: theme.spacing[5],
        backgroundColor: isSelected
          ? theme.colors.secondary[500]
          : theme.colors.surface,
        borderColor: isSelected
          ? theme.colors.secondary[600]
          : theme.colors.border,
      };
    }

    if (cardStyle === 'minimal') {
      return {
        ...baseStyles,
        padding: theme.spacing[4],
        backgroundColor: isSelected
          ? theme.colors.primary[50]
          : theme.colors.surface,
        borderColor: isSelected
          ? theme.colors.primary[500]
          : theme.colors.gray[200],
        elevation: 0,
        shadowOpacity: 0,
      };
    }

    // Default style
    return {
      ...baseStyles,
      padding: theme.spacing[4],
      backgroundColor: isSelected
        ? theme.colors.primary[50]
        : theme.colors.surface,
      borderColor: isSelected ? theme.colors.primary[500] : theme.colors.border,
      opacity: isDisabled ? 0.6 : 1,
    };
  };

  const getTextColor = (isSelected: boolean) => {
    if (cardStyle === 'prominent' && isSelected) {
      return theme.colors.surface;
    }
    return isSelected ? theme.colors.primary[700] : theme.colors.text.primary;
  };

  const getSubtextColor = (isSelected: boolean) => {
    if (cardStyle === 'prominent' && isSelected) {
      return theme.colors.secondary[100];
    }
    return isSelected ? theme.colors.primary[600] : theme.colors.text.secondary;
  };

  const renderOption = (option: ChoiceOption) => {
    const isSelected = isOptionSelected(option.id);
    const canSelect =
      !maxSelections || selectedOptions.length < maxSelections || isSelected;
    const isDisabled = disabled || (!canSelect && multiSelect);

    return (
      <Pressable
        key={option.id}
        onPress={() => handleOptionPress(option.id)}
        style={getCardStyles(isSelected, isDisabled)}
        disabled={isDisabled}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {option.icon && (
            <Text
              style={{
                fontSize: 24,
                marginRight: theme.spacing[3],
              }}
            >
              {option.icon}
            </Text>
          )}

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: getTextColor(isSelected),
                marginBottom: option.description ? theme.spacing[1] : 0,
              }}
            >
              {option.label}
            </Text>

            {option.description && (
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: getSubtextColor(isSelected),
                  lineHeight: theme.typography.lineHeight.relaxed,
                }}
              >
                {option.description}
              </Text>
            )}
          </View>

          {/* Selection indicator */}
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: isSelected
                ? cardStyle === 'prominent'
                  ? theme.colors.surface
                  : theme.colors.primary[500]
                : theme.colors.gray[300],
              backgroundColor: isSelected
                ? cardStyle === 'prominent'
                  ? theme.colors.surface
                  : theme.colors.primary[500]
                : 'transparent',
              marginLeft: theme.spacing[3],
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
                  backgroundColor:
                    cardStyle === 'prominent'
                      ? theme.colors.secondary[500]
                      : theme.colors.surface,
                }}
              />
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderGrid = () => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -theme.spacing[1],
      }}
    >
      {options.map(option => (
        <View
          key={option.id}
          style={{
            width: '48%',
            marginHorizontal: theme.spacing[1],
          }}
        >
          {renderOption(option)}
        </View>
      ))}
    </View>
  );

  return (
    <View className={className} style={{ padding: theme.spacing[4] }}>
      {/* Header */}
      <View style={{ marginBottom: theme.spacing[6] }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            marginBottom: subtitle ? theme.spacing[2] : 0,
          }}
        >
          {title}
          {required && (
            <Text style={{ color: theme.colors.error[500] }}> *</Text>
          )}
        </Text>

        {subtitle && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            {subtitle}
          </Text>
        )}

        {/* Multi-select info */}
        {multiSelect && maxSelections && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.tertiary,
              marginTop: theme.spacing[1],
            }}
          >
            Select up to {maxSelections} options ({selectedOptions.length}/
            {maxSelections})
          </Text>
        )}
      </View>

      {/* Options */}
      <View>
        {layout === 'grid' ? renderGrid() : options.map(renderOption)}
      </View>

      {/* Validation message */}
      {required && !selectedOption && selectedOptions.length === 0 && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error[500],
            marginTop: theme.spacing[2],
          }}
        >
          Please select an option to continue
        </Text>
      )}
    </View>
  );
};
