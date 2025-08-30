import React, { useState, useEffect } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import {
  AssessmentQuestion,
  AssessmentQuestionData,
  AssessmentAnswer,
} from '../../components/ui/AssessmentQuestion';
import { useQuestionnaireStore } from '../../store/questionnaire';
import { getSafeAreaInsets } from '../../utils/device';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AssessmentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Assessment'
>;
type AssessmentScreenRouteProp = RouteProp<RootStackParamList, 'Assessment'>;

// Assessment questions
const assessmentQuestions: AssessmentQuestionData[] = [
  {
    id: 'pain-level',
    type: 'scale',
    title: 'Pain Level Assessment',
    subtitle: 'How would you rate your current pain level?',
    description: 'Rate your pain from 1 (no pain) to 10 (severe pain)',
    required: true,
    scaleMin: 1,
    scaleMax: 10,
    scaleLabels: {
      min: 'No pain',
      max: 'Severe pain',
    },
  },
  {
    id: 'pain-frequency',
    type: 'multiple-choice',
    title: 'Pain Frequency',
    subtitle: 'How often do you experience this pain?',
    required: true,
    options: [
      { id: 'daily', label: 'Daily', value: 'daily' },
      {
        id: 'few-times-week',
        label: 'Few times a week',
        value: 'few-times-week',
      },
      { id: 'weekly', label: 'Weekly', value: 'weekly' },
      { id: 'occasionally', label: 'Occasionally', value: 'occasionally' },
      { id: 'rarely', label: 'Rarely', value: 'rarely' },
    ],
  },
  {
    id: 'pain-triggers',
    type: 'multiple-choice',
    title: 'Pain Triggers',
    subtitle: 'What typically triggers or worsens your pain?',
    required: false,
    options: [
      { id: 'movement', label: 'Movement or activity', value: 'movement' },
      { id: 'sitting', label: 'Sitting for long periods', value: 'sitting' },
      { id: 'standing', label: 'Standing for long periods', value: 'standing' },
      {
        id: 'exercise',
        label: 'Exercise or physical activity',
        value: 'exercise',
      },
      { id: 'stress', label: 'Stress or tension', value: 'stress' },
      { id: 'weather', label: 'Weather changes', value: 'weather' },
    ],
  },
  {
    id: 'previous-treatment',
    type: 'yesno',
    title: 'Previous Treatment',
    subtitle: 'Have you received treatment for this condition before?',
    description:
      'This includes physical therapy, medication, or other treatments',
    required: true,
  },
  {
    id: 'treatment-details',
    type: 'textarea',
    title: 'Treatment Details',
    subtitle: "Please describe any previous treatments you've tried",
    description:
      'Include physical therapy, medications, surgeries, or other approaches',
    placeholder: 'Describe your previous treatments...',
    required: false,
    validation: {
      maxLength: 500,
    },
  },
];

export const AssessmentScreen: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<AssessmentScreenNavigationProp>();
  const route = useRoute<AssessmentScreenRouteProp>();
  const safeArea = getSafeAreaInsets();

  const { updateResponse, setCurrentStep, responses } = useQuestionnaireStore();

  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const isLastQuestion =
    currentQuestionIndex === assessmentQuestions.length - 1;
  const canContinue = !currentQuestion.required || answers[currentQuestion.id];

  // Skip treatment details if user answered "No" to previous treatment
  useEffect(() => {
    if (currentQuestion.id === 'treatment-details') {
      const previousTreatmentAnswer = answers['previous-treatment'];
      if (previousTreatmentAnswer && previousTreatmentAnswer.value === 'no') {
        // Skip this question
        handleNext();
      }
    }
  }, [currentQuestionIndex, answers]);

  const handleAnswerChange = (answer: AssessmentAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [answer.questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      Alert.alert(
        'Required Question',
        'Please answer this question before continuing'
      );
      return;
    }

    if (isLastQuestion) {
      handleComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      // Save all assessment answers
      Object.values(answers).forEach(answer => {
        updateResponse({
          questionId: answer.questionId,
          answer: answer.value,
          answerText: answer.text || String(answer.value),
        });
      });

      setCurrentStep(3);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      navigation.navigate('Demographics', { step: 1 });
    } catch (error) {
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedback = () => {
    // Provide contextual feedback based on answers
    if (currentQuestion.id === 'pain-level' && answers[currentQuestion.id]) {
      const painLevel = answers[currentQuestion.id].value as number;
      if (painLevel >= 8) {
        return {
          type: 'warning' as const,
          message:
            "High pain levels may require medical attention. Please consult a healthcare provider if you haven't already.",
        };
      } else if (painLevel >= 5) {
        return {
          type: 'info' as const,
          message:
            "Moderate pain can often be managed with appropriate exercises and techniques. We'll help you create a plan.",
        };
      } else if (painLevel <= 3) {
        return {
          type: 'success' as const,
          message:
            'Great! Low pain levels are ideal for preventive exercises and strengthening.',
        };
      }
    }

    return undefined;
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
            currentStep={3}
            totalSteps={5}
            showStepNumbers={true}
          />
        </View>

        {/* Question */}
        <AssessmentQuestion
          question={currentQuestion}
          answer={answers[currentQuestion.id]}
          onAnswerChange={handleAnswerChange}
          showFeedback={true}
          feedback={getFeedback()}
        />

        {/* Navigation buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            marginTop: theme.spacing[6],
          }}
        >
          {currentQuestionIndex > 0 && (
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

          <View style={{ flex: currentQuestionIndex > 0 ? 1 : 2 }}>
            <Button
              title={
                isLoading
                  ? 'Processing...'
                  : isLastQuestion
                    ? 'Complete Assessment'
                    : 'Next Question'
              }
              onPress={handleNext}
              variant="primary"
              size="large"
              disabled={!canContinue || isLoading}
            />
          </View>
        </View>

        {/* Question progress */}
        <View
          style={{
            alignItems: 'center',
            marginTop: theme.spacing[4],
          }}
        >
          <ProgressIndicator
            currentStep={currentQuestionIndex + 1}
            totalSteps={assessmentQuestions.length}
            showStepNumbers={false}
            height={2}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
