import React from 'react';
import { View } from 'react-native';
import { theme } from '../../styles/theme';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  progress?: number;
  showStepNumbers?: boolean;
  height?: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  progress: providedProgress,
  showStepNumbers = false,
  height = 4,
  className,
}) => {
  const progress = providedProgress ?? (currentStep / totalSteps) * 100;

  if (showStepNumbers) {
    // Step-based indicator (like in your screenshots)
    return (
      <View
        className={`flex-row items-center justify-center ${className || ''}`}
      >
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber <= currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isCompleted
                    ? theme.colors.primary[500]
                    : isCurrent
                      ? theme.colors.primary[300]
                      : theme.colors.gray[200],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginHorizontal: 4,
                }}
              >
                {isCompleted && (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: theme.colors.surface,
                    }}
                  />
                )}
              </View>
              {stepNumber < totalSteps && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor:
                      stepNumber < currentStep
                        ? theme.colors.primary[500]
                        : theme.colors.gray[200],
                    marginHorizontal: 4,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  // Simple progress bar
  return (
    <View className={className || ''}>
      <View
        style={{
          height,
          backgroundColor: theme.colors.gray[200],
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: theme.colors.primary[500],
            borderRadius: height / 2,
          }}
        />
      </View>
    </View>
  );
};
