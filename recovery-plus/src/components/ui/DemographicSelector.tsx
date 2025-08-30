import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';

export interface DemographicOption {
  id: string;
  label: string;
  value: string | number;
  icon?: string;
  description?: string;
  category?: string;
}

interface DemographicSelectorProps {
  title: string;
  subtitle?: string;
  options: DemographicOption[];
  selectedValue?: string | number;
  onSelectionChange: (value: string | number) => void;
  type: 'age' | 'gender' | 'activity-level' | 'experience' | 'goal' | 'custom';
  layout?: 'grid' | 'list';
  columns?: number;
  showIcons?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DemographicSelector: React.FC<DemographicSelectorProps> = ({
  title,
  subtitle,
  options,
  selectedValue,
  onSelectionChange,
  type,
  layout = 'grid',
  columns = 2,
  showIcons = true,
  required = false,
  disabled = false,
  className,
}) => {
  const getDefaultOptions = (): DemographicOption[] => {
    switch (type) {
      case 'age':
        return [
          { id: '18-24', label: '18-24', value: '18-24', icon: '🧒' },
          { id: '25-34', label: '25-34', value: '25-34', icon: '🧑' },
          { id: '35-44', label: '35-44', value: '35-44', icon: '👨' },
          { id: '45-54', label: '45-54', value: '45-54', icon: '👩' },
          { id: '55-64', label: '55-64', value: '55-64', icon: '🧓' },
          { id: '65+', label: '65+', value: '65+', icon: '👴' },
        ];

      case 'gender':
        return [
          { id: 'male', label: 'Male', value: 'male', icon: '♂️' },
          { id: 'female', label: 'Female', value: 'female', icon: '♀️' },
          {
            id: 'non-binary',
            label: 'Non-binary',
            value: 'non-binary',
            icon: '⚧️',
          },
          {
            id: 'prefer-not-to-say',
            label: 'Prefer not to say',
            value: 'prefer-not-to-say',
            icon: '🤐',
          },
        ];

      case 'activity-level':
        return [
          {
            id: 'sedentary',
            label: 'Sedentary',
            value: 'sedentary',
            icon: '🛋️',
            description: 'Little to no exercise',
          },
          {
            id: 'lightly-active',
            label: 'Lightly Active',
            value: 'lightly-active',
            icon: '🚶',
            description: '1-3 days per week',
          },
          {
            id: 'moderately-active',
            label: 'Moderately Active',
            value: 'moderately-active',
            icon: '🏃',
            description: '3-5 days per week',
          },
          {
            id: 'very-active',
            label: 'Very Active',
            value: 'very-active',
            icon: '💪',
            description: '6-7 days per week',
          },
        ];

      case 'experience':
        return [
          {
            id: 'beginner',
            label: 'Beginner',
            value: 'beginner',
            icon: '🌱',
            description: 'New to fitness/rehab',
          },
          {
            id: 'intermediate',
            label: 'Intermediate',
            value: 'intermediate',
            icon: '🌿',
            description: 'Some experience',
          },
          {
            id: 'advanced',
            label: 'Advanced',
            value: 'advanced',
            icon: '🌳',
            description: 'Very experienced',
          },
        ];

      case 'goal':
        return [
          {
            id: 'pain-relief',
            label: 'Pain Relief',
            value: 'pain-relief',
            icon: '🎯',
            description: 'Reduce pain and discomfort',
          },
          {
            id: 'mobility',
            label: 'Improve Mobility',
            value: 'mobility',
            icon: '🤸',
            description: 'Increase flexibility and range of motion',
          },
          {
            id: 'strength',
            label: 'Build Strength',
            value: 'strength',
            icon: '💪',
            description: 'Strengthen muscles and joints',
          },
          {
            id: 'prevention',
            label: 'Prevent Injury',
            value: 'prevention',
            icon: '🛡️',
            description: 'Avoid future problems',
          },
        ];

      default:
        return [];
    }
  };

  const displayOptions = options.length > 0 ? options : getDefaultOptions();

  const renderOption = (option: DemographicOption) => {
    const isSelected = selectedValue === option.value;

    return (
      <Pressable
        key={option.id}
        onPress={() => onSelectionChange(option.value)}
        disabled={disabled}
        style={{
          padding: theme.spacing[4],
          borderRadius: theme.borderRadius.lg,
          backgroundColor: isSelected
            ? theme.colors.primary[50]
            : theme.colors.surface,
          borderWidth: 2,
          borderColor: isSelected
            ? theme.colors.primary[500]
            : theme.colors.border,
          marginBottom: theme.spacing[3],
          opacity: disabled ? 0.6 : 1,
          minHeight: 80,
          justifyContent: 'center',
          alignItems: layout === 'grid' ? 'center' : 'flex-start',
          elevation: isSelected ? 2 : 1,
          shadowOffset: { width: 0, height: isSelected ? 2 : 1 },
          shadowOpacity: isSelected ? 0.1 : 0.05,
          shadowRadius: isSelected ? 4 : 2,
        }}
      >
        {/* Icon */}
        {showIcons && option.icon && (
          <Text
            style={{
              fontSize: layout === 'grid' ? 32 : 24,
              marginBottom: layout === 'grid' ? theme.spacing[2] : 0,
              marginRight: layout === 'list' ? theme.spacing[3] : 0,
            }}
          >
            {option.icon}
          </Text>
        )}

        <View
          style={{
            alignItems: layout === 'grid' ? 'center' : 'flex-start',
            flex: layout === 'list' ? 1 : 0,
          }}
        >
          {/* Label */}
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: isSelected
                ? theme.colors.primary[700]
                : theme.colors.text.primary,
              textAlign: layout === 'grid' ? 'center' : 'left',
              marginBottom: option.description ? theme.spacing[1] : 0,
            }}
          >
            {option.label}
          </Text>

          {/* Description */}
          {option.description && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: isSelected
                  ? theme.colors.primary[600]
                  : theme.colors.text.secondary,
                textAlign: layout === 'grid' ? 'center' : 'left',
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {option.description}
            </Text>
          )}
        </View>

        {/* Selection indicator for list layout */}
        {layout === 'list' && (
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: isSelected
                ? theme.colors.primary[500]
                : theme.colors.gray[300],
              backgroundColor: isSelected
                ? theme.colors.primary[500]
                : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: theme.spacing[2],
            }}
          >
            {isSelected && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.surface,
                }}
              />
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const renderGrid = () => {
    const numColumns = Math.min(columns, displayOptions.length);
    const rows: DemographicOption[][] = [];

    for (let i = 0; i < displayOptions.length; i += numColumns) {
      rows.push(displayOptions.slice(i, i + numColumns));
    }

    return (
      <View>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginHorizontal: -theme.spacing[1],
            }}
          >
            {row.map(option => (
              <View
                key={option.id}
                style={{
                  flex: 1,
                  marginHorizontal: theme.spacing[1],
                }}
              >
                {renderOption(option)}
              </View>
            ))}

            {/* Fill remaining columns if needed */}
            {row.length < numColumns &&
              Array.from({ length: numColumns - row.length }, (_, index) => (
                <View
                  key={`empty-${index}`}
                  style={{
                    flex: 1,
                    marginHorizontal: theme.spacing[1],
                  }}
                />
              ))}
          </View>
        ))}
      </View>
    );
  };

  const renderList = () => (
    <View>
      {displayOptions.map(option => (
        <View
          key={option.id}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {renderOption(option)}
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: theme.spacing[4] }}>
        {/* Header */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textAlign: 'center',
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
                textAlign: 'center',
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Options */}
        <View>{layout === 'grid' ? renderGrid() : renderList()}</View>

        {/* Validation message */}
        {required && !selectedValue && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.error[500],
              textAlign: 'center',
              marginTop: theme.spacing[4],
            }}
          >
            Please select an option to continue
          </Text>
        )}
      </View>
    </ScrollView>
  );
};
