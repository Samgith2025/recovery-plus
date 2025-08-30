import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import { DemographicSelector } from '../../components/ui/DemographicSelector';
import { useQuestionnaireStore } from '../../store/questionnaire';
import { getSafeAreaInsets } from '../../utils/device';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type DemographicsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Demographics'
>;
type DemographicsScreenRouteProp = RouteProp<
  RootStackParamList,
  'Demographics'
>;

// Demographics steps
const demographicsSteps = [
  {
    id: 'age',
    type: 'age' as const,
    title: "What's your age range?",
    subtitle: 'This helps us tailor exercises to your fitness level',
    required: true,
  },
  {
    id: 'activity-level',
    type: 'activity-level' as const,
    title: "What's your current activity level?",
    subtitle: "Be honest - we'll create a plan that fits your current fitness",
    required: true,
  },
  {
    id: 'experience',
    type: 'experience' as const,
    title: "What's your experience with exercise and rehab?",
    subtitle: 'This helps us adjust the complexity of your program',
    required: true,
  },
  {
    id: 'goal',
    type: 'goal' as const,
    title: "What's your primary goal?",
    subtitle: "We'll focus your recovery plan on what matters most to you",
    required: true,
  },
];

export const DemographicsScreen: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<DemographicsScreenNavigationProp>();
  const route = useRoute<DemographicsScreenRouteProp>();
  const safeArea = getSafeAreaInsets();

  const { updateResponse, setCurrentStep } = useQuestionnaireStore();

  const currentStep = demographicsSteps[currentStepIndex];
  const isLastStep = currentStepIndex === demographicsSteps.length - 1;
  const canContinue = !currentStep.required || responses[currentStep.id];

  const handleSelectionChange = (value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [currentStep.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep.required && !responses[currentStep.id]) {
      Alert.alert(
        'Required Selection',
        'Please make a selection before continuing'
      );
      return;
    }

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Save all demographic responses
      Object.entries(responses).forEach(([questionId, value]) => {
        updateResponse({
          questionId,
          answer: value,
          answerText: String(value),
        });
      });

      setCurrentStep(4);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigation.navigate('Completion');
    } catch (error) {
      Alert.alert('Error', 'Failed to save information. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress indicator */}
        <View style={{ marginBottom: theme.spacing[6] }}>
          <ProgressIndicator
            currentStep={4}
            totalSteps={5}
            showStepNumbers={true}
          />
        </View>

        {/* Demographics selector */}
        <DemographicSelector
          title={currentStep.title}
          subtitle={currentStep.subtitle}
          type={currentStep.type}
          selectedValue={responses[currentStep.id]}
          onSelectionChange={handleSelectionChange}
          options={[]} // Will use default options from component
          layout="grid"
          columns={2}
          required={currentStep.required}
        />

        {/* Navigation buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            marginTop: theme.spacing[6],
          }}
        >
          {currentStepIndex > 0 && (
            <View style={{ flex: 1 }}>
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="secondary"
                size="large"
                disabled={isLoading}
              />
            </View>
          )}

          <View style={{ flex: currentStepIndex > 0 ? 1 : 2 }}>
            <Button
              title={
                isLoading
                  ? 'Processing...'
                  : isLastStep
                    ? 'Complete Profile'
                    : 'Next'
              }
              onPress={handleNext}
              variant="primary"
              size="large"
              disabled={!canContinue || isLoading}
            />
          </View>
        </View>

        {/* Step progress */}
        <View
          style={{
            alignItems: 'center',
            marginTop: theme.spacing[4],
          }}
        >
          <ProgressIndicator
            currentStep={currentStepIndex + 1}
            totalSteps={demographicsSteps.length}
            showStepNumbers={false}
            height={2}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
