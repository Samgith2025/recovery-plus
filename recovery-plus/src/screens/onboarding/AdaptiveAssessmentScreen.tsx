import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import { AdaptiveQuestionnaireManager } from '../../components/questionnaire/AdaptiveQuestionnaireManager';
import { QuestionnaireManager } from '../../components/questionnaire/QuestionnaireManager';
import { useQuestionnaireStore } from '../../store/questionnaire';
import { useAppStore } from '../../store';
import { getSafeAreaInsets } from '../../utils/device';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { DISCOVERY_QUESTIONNAIRE } from '../../config/questionnaires';
import type { QuestionnaireResponse } from '../../types/questionnaire';

type AdaptiveAssessmentScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Assessment'
>;

type QuestionnaireMode = 'adaptive' | 'static' | 'selection';

export const AdaptiveAssessmentScreen: React.FC = () => {
  const [mode, setMode] = useState<QuestionnaireMode>('selection');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigation = useNavigation<AdaptiveAssessmentScreenNavigationProp>();
  const safeArea = getSafeAreaInsets();
  
  const { user } = useAppStore();
  const { updateMultipleResponses, setCurrentStep } = useQuestionnaireStore();

  const handleQuestionnaireComplete = async (
    responses: QuestionnaireResponse[],
    summary?: any
  ) => {
    setIsLoading(true);

    try {
      // Convert responses to store format
      const responseMap: Record<string, unknown> = {};
      responses.forEach(response => {
        responseMap[response.questionId] = response.value;
      });

      // Update questionnaire store
      updateMultipleResponses(responseMap);
      setCurrentStep(4);

      // Show completion message with AI insights if available
      if (mode === 'adaptive' && summary) {
        Alert.alert(
          '🤖 Assessment Complete!',
          `Great! I've gathered the information needed to create your personalized recovery plan.\n\nKey insights:\n${summary.keyInsights.slice(0, 2).join('\n')}\n\nReady to proceed?`,
          [
            {
              text: 'Continue to Next Step',
              onPress: () => navigation.navigate('Demographics', { step: 1 }),
            },
          ]
        );
      } else {
        // Navigate to next step
        navigation.navigate('Demographics', { step: 1 });
      }
    } catch (error) {
      console.error('Error completing questionnaire:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionnaireSave = (responses: QuestionnaireResponse[]) => {
    // Auto-save functionality - update store without navigation
    const responseMap: Record<string, unknown> = {};
    responses.forEach(response => {
      responseMap[response.questionId] = response.value;
    });
    updateMultipleResponses(responseMap);
  };

  const handleExit = () => {
    Alert.alert(
      'Exit Assessment',
      'Are you sure you want to exit? Your progress will be saved.',
      [
        { text: 'Continue Assessment', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (mode === 'selection') {
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
          <View style={{ marginBottom: theme.spacing[8] }}>
            <ProgressIndicator
              currentStep={3}
              totalSteps={5}
              showStepNumbers={true}
            />
          </View>

          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: theme.spacing[8] }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.primary[100],
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: theme.spacing[6],
              }}
            >
              <Text style={{ fontSize: 40 }}>🤖</Text>
            </View>

            <Text
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                textAlign: 'center',
                marginBottom: theme.spacing[3],
              }}
            >
              Choose Your Assessment Style
            </Text>

            <Text
              style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              We offer two ways to understand your needs. Choose the one that feels right for you.
            </Text>
          </View>

          {/* Assessment options */}
          <View style={{ gap: theme.spacing[4] }}>
            {/* AI Adaptive Option */}
            <TouchableOpacity
              style={{
                padding: theme.spacing[6],
                borderRadius: 16,
                backgroundColor: theme.colors.primary[50],
                borderWidth: 2,
                borderColor: theme.colors.primary[200],
              }}
              onPress={() => setMode('adaptive')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[4] }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.colors.primary[200],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🧠</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[2] }}>
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.lg,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.primary[900],
                      }}
                    >
                      🤖 AI-Powered Assessment
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: theme.spacing[2],
                        paddingVertical: theme.spacing[1],
                        backgroundColor: theme.colors.primary[600],
                        borderRadius: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.white,
                        }}
                      >
                        RECOMMENDED
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.primary[700],
                      marginBottom: theme.spacing[3],
                      lineHeight: theme.typography.lineHeight.relaxed,
                    }}
                  >
                    Our AI asks personalized follow-up questions based on your responses. 
                    Typically 5-8 adaptive questions that get smarter as you answer.
                  </Text>

                  <View style={{ gap: theme.spacing[1] }}>
                    <Text style={{ fontSize: 12, color: theme.colors.primary[600] }}>✨ Personalized questions</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.primary[600] }}>⚡ Faster completion (3-5 min)</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.primary[600] }}>🎯 More relevant recommendations</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Traditional Option */}
            <TouchableOpacity
              style={{
                padding: theme.spacing[6],
                borderRadius: 16,
                backgroundColor: theme.colors.gray[50],
                borderWidth: 2,
                borderColor: theme.colors.gray[200],
              }}
              onPress={() => setMode('static')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[4] }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: theme.colors.gray[200],
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📋</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.lg,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.gray[900],
                      marginBottom: theme.spacing[2],
                    }}
                  >
                    📋 Traditional Assessment
                  </Text>

                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.gray[700],
                      marginBottom: theme.spacing[3],
                      lineHeight: theme.typography.lineHeight.relaxed,
                    }}
                  >
                    Complete our comprehensive questionnaire with structured sections. 
                    All users answer the same thorough set of questions.
                  </Text>

                  <View style={{ gap: theme.spacing[1] }}>
                    <Text style={{ fontSize: 12, color: theme.colors.gray[600] }}>📊 Comprehensive coverage</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.gray[600] }}>⏱️ Longer but thorough (8-12 min)</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.gray[600] }}>🔄 Familiar format</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info note */}
          <View
            style={{
              marginTop: theme.spacing[6],
              padding: theme.spacing[4],
              backgroundColor: theme.colors.info[50],
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.info[400],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.info[700],
                fontWeight: theme.typography.fontWeight.medium,
                marginBottom: theme.spacing[1],
              }}
            >
              💡 Both assessments create the same quality recovery plan
            </Text>
            <Text
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.info[600],
                lineHeight: theme.typography.lineHeight.relaxed,
              }}
            >
              The AI assessment is faster and more conversational, while the traditional assessment 
              is comprehensive and covers all areas systematically. Choose what feels most comfortable.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (mode === 'adaptive') {
    return (
      <AdaptiveQuestionnaireManager
        userId={user?.id}
        onComplete={handleQuestionnaireComplete}
        onSave={handleQuestionnaireSave}
        onExit={() => setMode('selection')}
      />
    );
  }

  if (mode === 'static') {
    return (
      <QuestionnaireManager
        config={DISCOVERY_QUESTIONNAIRE}
        onComplete={handleQuestionnaireComplete}
        onSave={handleQuestionnaireSave}
        onExit={() => setMode('selection')}
      />
    );
  }

  return null;
};
