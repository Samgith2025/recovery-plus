import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { theme } from '../../styles/theme';

interface ExerciseTimerProps {
  duration?: number; // In seconds
  holdTime?: number; // In seconds for isometric exercises
  isRunning: boolean;
  isPaused: boolean;
  onComplete: () => void;
  onTick?: (remainingTime: number) => void;
  showControls?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  type?: 'countdown' | 'stopwatch' | 'hold';
}

export const ExerciseTimer: React.FC<ExerciseTimerProps> = ({
  duration = 60,
  holdTime,
  isRunning,
  isPaused,
  onComplete,
  onTick,
  showControls = true,
  onPause,
  onResume,
  type = 'countdown',
}) => {
  const [remainingTime, setRemainingTime] = useState(duration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Use holdTime if provided and type is hold
  const targetTime = type === 'hold' && holdTime ? holdTime : duration;

  useEffect(() => {
    if (type === 'countdown') {
      setRemainingTime(targetTime);
    } else {
      setElapsedTime(0);
    }
  }, [targetTime, type]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (type === 'countdown') {
          setRemainingTime(prev => {
            const newTime = prev - 1;
            onTick?.(newTime);

            if (newTime <= 0) {
              onComplete();
              return 0;
            }
            return newTime;
          });
        } else {
          setElapsedTime(prev => {
            const newTime = prev + 1;
            onTick?.(newTime);

            if (type === 'hold' && newTime >= targetTime) {
              onComplete();
            }
            return newTime;
          });
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, type, targetTime, onComplete, onTick]);

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (): number => {
    if (type === 'countdown') {
      return remainingTime;
    }
    return elapsedTime;
  };

  const getProgressPercentage = (): number => {
    if (type === 'countdown') {
      return ((targetTime - remainingTime) / targetTime) * 100;
    } else if (type === 'hold') {
      return Math.min((elapsedTime / targetTime) * 100, 100);
    }
    return 0;
  };

  const getTimerColor = (): string => {
    if (type === 'countdown' && remainingTime <= 10) {
      return theme.colors.error[500];
    } else if (type === 'hold' && elapsedTime >= targetTime) {
      return theme.colors.success[500];
    }
    return theme.colors.primary[500];
  };

  const displayTime = getDisplayTime();
  const progressPercentage = getProgressPercentage();
  const timerColor = getTimerColor();

  return (
    <View
      style={{
        alignItems: 'center',
        padding: theme.spacing[4],
      }}
    >
      {/* Circular Progress */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: theme.colors.gray[100],
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing[4],
          position: 'relative',
        }}
      >
        {/* Progress Ring */}
        {(type === 'countdown' || type === 'hold') && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 60,
              borderWidth: 4,
              borderColor: theme.colors.gray[200],
            }}
          />
        )}

        {/* Timer Display */}
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: timerColor,
              marginBottom: theme.spacing[1],
            }}
          >
            {formatTime(displayTime)}
          </Text>

          {type === 'hold' && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              {elapsedTime >= targetTime ? 'COMPLETE' : 'HOLD'}
            </Text>
          )}

          {type === 'countdown' && remainingTime <= 10 && remainingTime > 0 && (
            <Text
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.error[500],
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              HURRY UP!
            </Text>
          )}
        </View>
      </View>

      {/* Progress Bar (for longer exercises) */}
      {(type === 'countdown' || type === 'hold') && targetTime > 60 && (
        <View
          style={{
            width: '100%',
            height: 6,
            backgroundColor: theme.colors.gray[200],
            borderRadius: 3,
            marginBottom: theme.spacing[4],
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${progressPercentage}%`,
              height: '100%',
              backgroundColor: timerColor,
              borderRadius: 3,
            }}
          />
        </View>
      )}

      {/* Timer Info */}
      <View style={{ alignItems: 'center', marginBottom: theme.spacing[4] }}>
        {type === 'countdown' && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Remaining: {formatTime(remainingTime)} / {formatTime(targetTime)}
          </Text>
        )}

        {type === 'hold' && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Target: {formatTime(targetTime)}
          </Text>
        )}

        {type === 'stopwatch' && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            Elapsed Time
          </Text>
        )}
      </View>

      {/* Controls */}
      {showControls && (
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            alignItems: 'center',
          }}
        >
          {!isRunning || isPaused ? (
            <Pressable
              onPress={onResume}
              style={{
                backgroundColor: theme.colors.success[500],
                paddingHorizontal: theme.spacing[6],
                paddingVertical: theme.spacing[3],
                borderRadius: theme.borderRadius.lg,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.surface,
                }}
              >
                {isPaused ? 'Resume' : 'Start'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onPause}
              style={{
                backgroundColor: theme.colors.warning[500],
                paddingHorizontal: theme.spacing[6],
                paddingVertical: theme.spacing[3],
                borderRadius: theme.borderRadius.lg,
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.surface,
                }}
              >
                Pause
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};
