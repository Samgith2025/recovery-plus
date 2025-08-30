import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import { useAppStore } from '../../store';
import { useQuestionnaireStore } from '../../store/questionnaire';
import { getSafeAreaInsets, getDeviceType } from '../../utils/device';

export const CompletionScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const safeArea = getSafeAreaInsets();
  const deviceType = getDeviceType();
  const isTablet = deviceType === 'tablet';

  const { user, setHasCompletedOnboarding } = useAppStore();
  const { responses, completeQuestionnaire } = useQuestionnaireStore();

  const handleGetStarted = async () => {
    setIsLoading(true);

    try {
      // Complete questionnaire
      await completeQuestionnaire();

      // Mark onboarding as completed
      setHasCompletedOnboarding(true);

      // Simulate processing user's responses to create personalized plan
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigation will automatically switch to main app due to state change
    } catch (error) {
      Alert.alert(
        'Setup Failed',
        'There was an error setting up your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get summary of user's responses
  const getPainAreas = () => {
    const bodyAreasResponse = responses.find(
      r => r.questionId === 'body-areas'
    );
    if (bodyAreasResponse && Array.isArray(bodyAreasResponse.answer)) {
      return bodyAreasResponse.answer.length;
    }
    return 0;
  };

  const getPainLevel = () => {
    const painLevelResponse = responses.find(
      r => r.questionId === 'pain-level'
    );
    return (painLevelResponse?.answer as number) || 0;
  };

  const getActivityLevel = () => {
    const activityResponse = responses.find(
      r => r.questionId === 'activity-level'
    );
    return String(activityResponse?.answer || '').replace('-', ' ');
  };

  const getGoal = () => {
    const goalResponse = responses.find(r => r.questionId === 'goal');
    return String(goalResponse?.answer || '').replace('-', ' ');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: safeArea.top + theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
          justifyContent: 'center',
          minHeight: '100%',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={{ marginBottom: theme.spacing[8] }}>
          <ProgressIndicator
            currentStep={5}
            totalSteps={5}
            showStepNumbers={true}
          />
        </View>

        {/* Success content */}
        <View
          style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}
        >
          {/* Success icon */}
          <View
            style={{
              width: isTablet ? 120 : 100,
              height: isTablet ? 120 : 100,
              borderRadius: isTablet ? 60 : 50,
              backgroundColor: theme.colors.success[100],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing[6],
            }}
          >
            <Text style={{ fontSize: isTablet ? 60 : 50 }}>🎉</Text>
          </View>

          {/* Header */}
          <Text
            style={{
              fontSize: isTablet
                ? theme.typography.fontSize['4xl']
                : theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[3],
            }}
          >
            You're all set!
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
              marginBottom: theme.spacing[8],
            }}
          >
            We're creating your personalized recovery plan based on your
            responses
          </Text>

          {/* Summary card */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing[6],
              width: '100%',
              marginBottom: theme.spacing[8],
              elevation: 2,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
                textAlign: 'center',
              }}
            >
              Your Recovery Profile
            </Text>

            <View style={{ gap: theme.spacing[3] }}>
              {getPainAreas() > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Problem areas:
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {getPainAreas()} selected
                  </Text>
                </View>
              )}

              {getPainLevel() > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Pain level:
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {getPainLevel()}/10
                  </Text>
                </View>
              )}

              {getActivityLevel() && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Activity level:
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      fontWeight: theme.typography.fontWeight.medium,
                      textTransform: 'capitalize',
                    }}
                  >
                    {getActivityLevel()}
                  </Text>
                </View>
              )}

              {getGoal() && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.secondary,
                    }}
                  >
                    Primary goal:
                  </Text>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.text.primary,
                      fontWeight: theme.typography.fontWeight.medium,
                      textTransform: 'capitalize',
                    }}
                  >
                    {getGoal()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Features preview */}
          <View style={{ width: '100%', marginBottom: theme.spacing[8] }}>
            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text.primary,
                marginBottom: theme.spacing[4],
                textAlign: 'center',
              }}
            >
              What you'll get:
            </Text>

            <View style={{ gap: theme.spacing[3] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: theme.spacing[3] }}>
                  🤖
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                >
                  AI-powered fitness coach available 24/7
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: theme.spacing[3] }}>
                  💪
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                >
                  Personalized exercise recommendations
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: theme.spacing[3] }}>
                  📈
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                >
                  Progress tracking and analytics
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, marginRight: theme.spacing[3] }}>
                  🎯
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.text.secondary,
                    flex: 1,
                  }}
                >
                  Goal-oriented recovery plans
                </Text>
              </View>
            </View>
          </View>

          {/* Get started button */}
          <View style={{ width: '100%' }}>
            <Button
              title={
                isLoading
                  ? 'Setting up your plan...'
                  : 'Start My Recovery Journey'
              }
              onPress={handleGetStarted}
              variant="primary"
              size="large"
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
