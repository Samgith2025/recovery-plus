import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';

interface BodyArea {
  id: string;
  name: string;
  icon: string;
  position: 'left' | 'right' | 'center';
  top: number;
  left: number;
}

interface BodyAreaSelectorProps {
  selectedAreas: string[];
  onSelectionChange: (areas: string[]) => void;
  maxSelections?: number;
  title?: string;
  subtitle?: string;
  className?: string;
}

const bodyAreas: BodyArea[] = [
  // Head and neck
  {
    id: 'head',
    name: 'Head',
    icon: '🧠',
    position: 'center',
    top: 5,
    left: 45,
  },
  {
    id: 'neck',
    name: 'Neck',
    icon: '🔗',
    position: 'center',
    top: 15,
    left: 45,
  },

  // Upper body
  {
    id: 'left-shoulder',
    name: 'Left Shoulder',
    icon: '🫲',
    position: 'left',
    top: 20,
    left: 25,
  },
  {
    id: 'right-shoulder',
    name: 'Right Shoulder',
    icon: '🫱',
    position: 'right',
    top: 20,
    left: 65,
  },
  {
    id: 'chest',
    name: 'Chest',
    icon: '🫁',
    position: 'center',
    top: 25,
    left: 45,
  },
  {
    id: 'upper-back',
    name: 'Upper Back',
    icon: '🔺',
    position: 'center',
    top: 22,
    left: 45,
  },

  // Arms
  {
    id: 'left-arm',
    name: 'Left Arm',
    icon: '💪',
    position: 'left',
    top: 30,
    left: 15,
  },
  {
    id: 'right-arm',
    name: 'Right Arm',
    icon: '💪',
    position: 'right',
    top: 30,
    left: 75,
  },
  {
    id: 'left-elbow',
    name: 'Left Elbow',
    icon: '🔄',
    position: 'left',
    top: 40,
    left: 20,
  },
  {
    id: 'right-elbow',
    name: 'Right Elbow',
    icon: '🔄',
    position: 'right',
    top: 40,
    left: 70,
  },
  {
    id: 'left-wrist',
    name: 'Left Wrist',
    icon: '⚡',
    position: 'left',
    top: 50,
    left: 18,
  },
  {
    id: 'right-wrist',
    name: 'Right Wrist',
    icon: '⚡',
    position: 'right',
    top: 50,
    left: 72,
  },

  // Core
  {
    id: 'core',
    name: 'Core/Abs',
    icon: '💎',
    position: 'center',
    top: 35,
    left: 45,
  },
  {
    id: 'lower-back',
    name: 'Lower Back',
    icon: '🔻',
    position: 'center',
    top: 45,
    left: 45,
  },

  // Hips and pelvis
  {
    id: 'left-hip',
    name: 'Left Hip',
    icon: '⭕',
    position: 'left',
    top: 55,
    left: 35,
  },
  {
    id: 'right-hip',
    name: 'Right Hip',
    icon: '⭕',
    position: 'right',
    top: 55,
    left: 55,
  },
  {
    id: 'pelvis',
    name: 'Pelvis',
    icon: '🔸',
    position: 'center',
    top: 55,
    left: 45,
  },

  // Legs
  {
    id: 'left-thigh',
    name: 'Left Thigh',
    icon: '🦵',
    position: 'left',
    top: 65,
    left: 35,
  },
  {
    id: 'right-thigh',
    name: 'Right Thigh',
    icon: '🦵',
    position: 'right',
    top: 65,
    left: 55,
  },
  {
    id: 'left-knee',
    name: 'Left Knee',
    icon: '🔘',
    position: 'left',
    top: 75,
    left: 35,
  },
  {
    id: 'right-knee',
    name: 'Right Knee',
    icon: '🔘',
    position: 'right',
    top: 75,
    left: 55,
  },
  {
    id: 'left-calf',
    name: 'Left Calf',
    icon: '🦿',
    position: 'left',
    top: 85,
    left: 35,
  },
  {
    id: 'right-calf',
    name: 'Right Calf',
    icon: '🦿',
    position: 'right',
    top: 85,
    left: 55,
  },
  {
    id: 'left-ankle',
    name: 'Left Ankle',
    icon: '🔗',
    position: 'left',
    top: 92,
    left: 35,
  },
  {
    id: 'right-ankle',
    name: 'Right Ankle',
    icon: '🔗',
    position: 'right',
    top: 92,
    left: 55,
  },
  {
    id: 'left-foot',
    name: 'Left Foot',
    icon: '🦶',
    position: 'left',
    top: 96,
    left: 35,
  },
  {
    id: 'right-foot',
    name: 'Right Foot',
    icon: '🦶',
    position: 'right',
    top: 96,
    left: 55,
  },
];

export const BodyAreaSelector: React.FC<BodyAreaSelectorProps> = ({
  selectedAreas,
  onSelectionChange,
  maxSelections,
  title = 'Where do you feel pain or discomfort?',
  subtitle = 'Select all areas that apply',
  className,
}) => {
  const [pressedArea, setPressedArea] = useState<string | null>(null);

  const handleAreaPress = (areaId: string) => {
    const isSelected = selectedAreas.includes(areaId);

    if (isSelected) {
      // Remove from selection
      onSelectionChange(selectedAreas.filter(id => id !== areaId));
    } else {
      // Add to selection (if under limit)
      if (!maxSelections || selectedAreas.length < maxSelections) {
        onSelectionChange([...selectedAreas, areaId]);
      }
    }
  };

  const renderBodyArea = (area: BodyArea) => {
    const isSelected = selectedAreas.includes(area.id);
    const isPressed = pressedArea === area.id;
    const canSelect =
      !maxSelections || selectedAreas.length < maxSelections || isSelected;

    return (
      <Pressable
        key={area.id}
        onPress={() => handleAreaPress(area.id)}
        onPressIn={() => setPressedArea(area.id)}
        onPressOut={() => setPressedArea(null)}
        style={{
          position: 'absolute',
          top: `${area.top}%`,
          left: `${area.left}%`,
          transform: [{ translateX: -16 }, { translateY: -16 }],
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isSelected
            ? theme.colors.secondary[500]
            : isPressed
              ? theme.colors.primary[200]
              : theme.colors.surface,
          borderWidth: 2,
          borderColor: isSelected
            ? theme.colors.secondary[600]
            : canSelect
              ? theme.colors.primary[300]
              : theme.colors.gray[300],
          justifyContent: 'center',
          alignItems: 'center',
          opacity: canSelect ? 1 : 0.5,
          elevation: isSelected ? 4 : 2,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isSelected ? 0.25 : 0.1,
          shadowRadius: isSelected ? 4 : 2,
        }}
      >
        <Text style={{ fontSize: 16 }}>{area.icon}</Text>
      </Pressable>
    );
  };

  const selectedAreaNames = selectedAreas
    .map(id => bodyAreas.find(area => area.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: theme.spacing[4] }}>
        {/* Header */}
        <View style={{ marginBottom: theme.spacing[8] }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: theme.spacing[1],
            }}
          >
            {subtitle}
          </Text>
          {maxSelections && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.tertiary,
                textAlign: 'center',
              }}
            >
              Select up to {maxSelections} areas
            </Text>
          )}
        </View>

        {/* Body diagram */}
        <View
          style={{
            height: 600,
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.borderRadius.lg,
            marginBottom: theme.spacing[6],
            position: 'relative',
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
        >
          {/* Body outline placeholder */}
          <View
            style={{
              position: 'absolute',
              top: '10%',
              left: '35%',
              width: '30%',
              height: '80%',
              backgroundColor: theme.colors.gray[100],
              borderRadius: 40,
              opacity: 0.3,
            }}
          />

          {/* Render body areas */}
          {bodyAreas.map(renderBodyArea)}
        </View>

        {/* Selected areas display */}
        {selectedAreas.length > 0 && (
          <View
            style={{
              backgroundColor: theme.colors.primary[50],
              padding: theme.spacing[4],
              borderRadius: theme.borderRadius.md,
              borderWidth: 1,
              borderColor: theme.colors.primary[200],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.primary[700],
                marginBottom: theme.spacing[1],
              }}
            >
              Selected areas ({selectedAreas.length}):
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.primary[600],
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              {selectedAreaNames}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
