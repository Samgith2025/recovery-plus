import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import { RatingScale } from '../ui/RatingScale';
import { ExerciseFeedback } from '../../types/feedback';
import { Exercise } from '../ui/ExerciseCard';
import { getSafeAreaInsets } from '../../utils/device';
import { exerciseLogger } from '../../services/logger';

interface ExerciseFeedbackFormProps {
  exercise: Exercise;
  sessionId: string;
  onSubmit: (feedback: Partial<ExerciseFeedback>) => void;
  onSkip?: () => void;
  onBackPress?: () => void;
  isSubmitting?: boolean;
}

export const ExerciseFeedbackForm: React.FC<ExerciseFeedbackFormProps> = ({
  exercise,
  sessionId,
  onSubmit,
  onSkip,
  onBackPress,
  isSubmitting = false,
}) => {
  const [painLevel, setPainLevel] = useState<number | null>(null);
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [enjoymentRating, setEnjoymentRating] = useState<number | null>(null);
  const [perceivedEffectiveness, setPerceivedEffectiveness] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState('');
  const [modifications, setModifications] = useState('');
  const [completionStatus, setCompletionStatus] = useState<
    'completed' | 'partial' | 'modified'
  >('completed');

  const safeArea = getSafeAreaInsets();

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const isFormValid = () => {
    return painLevel !== null && difficultyRating !== null;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      Alert.alert(
        'Missing Information',
        'Please rate your pain level and difficulty before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    const feedback: Partial<ExerciseFeedback> = {
      sessionId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      painLevel: painLevel!,
      difficultyRating: difficultyRating!,
      energyLevel: energyLevel || undefined,
      enjoymentRating: enjoymentRating || undefined,
      perceivedEffectiveness: perceivedEffectiveness || undefined,
      notes: notes.trim() || undefined,
      modifications: modifications.trim() || undefined,
      completionStatus,
      timeOfDay: getTimeOfDay(),
      durationMinutes: 0, // This should be calculated from session duration
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    exerciseLogger.info('Exercise feedback submitted', {
      exerciseId: exercise.id,
      painLevel,
      difficultyRating,
      completionStatus,
    });

    onSubmit(feedback);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Feedback',
      'Providing feedback helps us improve your workout plan. Are you sure you want to skip?',
      [
        { text: 'Provide Feedback', style: 'default' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            exerciseLogger.info('Exercise feedback skipped', {
              exerciseId: exercise.id,
            });
            onSkip?.();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingTop: safeArea.top,
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[3],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {onBackPress && (
            <Pressable
              onPress={onBackPress}
              style={{
                padding: theme.spacing[2],
                marginLeft: -theme.spacing[2],
              }}
            >
              <Text style={{ fontSize: 18 }}>←</Text>
            </Pressable>
          )}

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
              }}
            >
              Exercise Feedback
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.text.secondary,
                marginTop: theme.spacing[1],
              }}
            >
              {exercise.name}
            </Text>
          </View>

          {onSkip && (
            <Pressable
              onPress={handleSkip}
              style={{
                padding: theme.spacing[2],
                marginRight: -theme.spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.text.secondary,
                }}
              >
                Skip
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Completion Status */}
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
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[3],
            }}
          >
            How did you complete this exercise?
          </Text>

          <View style={{ gap: theme.spacing[2] }}>
            {[
              { key: 'completed', label: 'Completed as planned', icon: '✅' },
              { key: 'partial', label: 'Completed partially', icon: '⏸️' },
              { key: 'modified', label: 'Modified the exercise', icon: '🔄' },
            ].map(option => (
              <Pressable
                key={option.key}
                onPress={() => setCompletionStatus(option.key as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing[3],
                  borderRadius: theme.borderRadius.md,
                  backgroundColor:
                    completionStatus === option.key
                      ? theme.colors.primary[50]
                      : theme.colors.gray[50],
                  borderWidth: 1,
                  borderColor:
                    completionStatus === option.key
                      ? theme.colors.primary[300]
                      : theme.colors.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: theme.spacing[3] }}>
                  {option.icon}
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.base,
                    color:
                      completionStatus === option.key
                        ? theme.colors.primary[700]
                        : theme.colors.text.primary,
                    fontWeight:
                      completionStatus === option.key
                        ? theme.typography.fontWeight.medium
                        : theme.typography.fontWeight.normal,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Pain Level - Required */}
        <RatingScale
          value={painLevel}
          onValueChange={setPainLevel}
          question="How was your pain level during this exercise?"
          description="1 = No pain at all, 10 = Worst pain possible"
          scaleType="pain"
        />

        {/* Difficulty Rating - Required */}
        <RatingScale
          value={difficultyRating}
          onValueChange={setDifficultyRating}
          question="How difficult was this exercise?"
          description="1 = Very easy, 10 = Impossible to complete"
          scaleType="difficulty"
        />

        {/* Energy Level - Optional */}
        <RatingScale
          value={energyLevel}
          onValueChange={setEnergyLevel}
          question="How is your energy level after this exercise?"
          description="1 = Completely exhausted, 10 = Very energized"
          labels={{
            1: 'Exhausted',
            3: 'Tired',
            5: 'Neutral',
            7: 'Energized',
            10: 'Pumped',
          }}
        />

        {/* Enjoyment Rating - Optional */}
        <RatingScale
          value={enjoymentRating}
          onValueChange={setEnjoymentRating}
          question="How much did you enjoy this exercise?"
          description="1 = Hated it, 10 = Loved it"
          scaleType="satisfaction"
        />

        {/* Perceived Effectiveness - Optional */}
        <RatingScale
          value={perceivedEffectiveness}
          onValueChange={setPerceivedEffectiveness}
          question="How effective do you think this exercise was?"
          description="1 = Not helpful at all, 10 = Extremely helpful"
          scaleType="satisfaction"
        />

        {/* Modifications */}
        {completionStatus === 'modified' && (
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
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[3],
              }}
            >
              What modifications did you make?
            </Text>
            <TextInput
              value={modifications}
              onChangeText={setModifications}
              placeholder="e.g., Used lighter weight, did fewer reps, modified position..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing[3],
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.primary,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: theme.colors.border,
                minHeight: 80,
              }}
            />
          </View>
        )}

        {/* Additional Notes */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[3],
            }}
          >
            Additional notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Any other feedback about this exercise..."
            placeholderTextColor={theme.colors.text.tertiary}
            multiline
            numberOfLines={4}
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing[3],
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              textAlignVertical: 'top',
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 100,
            }}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid() || isSubmitting}
          style={{
            backgroundColor:
              isFormValid() && !isSubmitting
                ? theme.colors.primary[500]
                : theme.colors.gray[400],
            paddingVertical: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            alignItems: 'center',
            elevation: isFormValid() ? 3 : 1,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.surface,
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </Pressable>

        {/* Requirements Note */}
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.tertiary,
            textAlign: 'center',
            marginTop: theme.spacing[3],
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          * Pain level and difficulty rating are required to help us improve
          your workout plan
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
