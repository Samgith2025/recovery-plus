import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { theme } from '../../styles/theme';
import { youtubeService, VideoQuality } from '../../services/youtubeService';

interface VideoQualitySelectorProps {
  currentQuality: string;
  onQualityChange: (quality: string) => void;
  visible: boolean;
  onClose: () => void;
}

export const VideoQualitySelector: React.FC<VideoQualitySelectorProps> = ({
  currentQuality,
  onQualityChange,
  visible,
  onClose,
}) => {
  const availableQualities = youtubeService.getAvailableQualities();

  if (!visible) return null;

  const handleQualitySelect = (quality: string) => {
    onQualityChange(quality);
    onClose();
  };

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing[4],
          minWidth: 250,
          maxWidth: '80%',
          elevation: 8,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing[4],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}
          >
            Video Quality
          </Text>
          <Pressable
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.colors.gray[100],
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: theme.colors.text.secondary,
              }}
            >
              ×
            </Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {availableQualities.map((quality: VideoQuality) => {
            const isSelected = quality.value === currentQuality;
            return (
              <Pressable
                key={quality.value}
                onPress={() => handleQualitySelect(quality.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: theme.spacing[3],
                  paddingHorizontal: theme.spacing[2],
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: isSelected
                    ? theme.colors.primary[50]
                    : 'transparent',
                  marginBottom: theme.spacing[1],
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: isSelected
                        ? theme.typography.fontWeight.medium
                        : theme.typography.fontWeight.normal,
                      color: isSelected
                        ? theme.colors.primary[700]
                        : theme.colors.text.primary,
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    {quality.label}
                  </Text>
                  {quality.bandwidth && (
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.text.secondary,
                      }}
                    >
                      ~{quality.bandwidth} kbps
                    </Text>
                  )}
                </View>

                {isSelected && (
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: theme.colors.primary[500],
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.surface,
                      }}
                    >
                      ✓
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={{
            marginTop: theme.spacing[4],
            paddingTop: theme.spacing[3],
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            Higher quality requires more data and may take longer to load
          </Text>
        </View>
      </View>
    </View>
  );
};
