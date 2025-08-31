import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, Alert } from 'react-native';
import { theme } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { ProgressIndicator } from '../../components/ui/ProgressIndicator';
import { BodyAreaSelector } from '../../components/ui/BodyAreaSelector';
import { useQuestionnaireStore } from '../../store/questionnaire';
import { getSafeAreaInsets } from '../../utils/device';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type BodyAreasScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'BodyAreas'
>;

export const BodyAreasScreen: React.FC = () => {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const navigation = useNavigation<BodyAreasScreenNavigationProp>();
  const safeArea = getSafeAreaInsets();

  const { updateResponse, setCurrentStep } = useQuestionnaireStore();

  const handleAreaSelectionChange = (areas: string[]) => {
    setSelectedAreas(areas);
  };

  const handleContinue = () => {
    if (selectedAreas.length === 0) {
      Alert.alert(
        'Select Problem Areas',
        'Please select at least one area where you experience pain or discomfort'
      );
      return;
    }

    // Save response to questionnaire store
    updateResponse({
      questionId: 'body-areas',
      answer: selectedAreas,
      answerText: selectedAreas.join(', '),
    });

    setCurrentStep(2);
    navigation.navigate('AdaptiveAssessment');
  };

  const handleSkip = () => {
    // Allow skipping if user doesn't want to specify areas
    updateResponse({
      questionId: 'body-areas',
      answer: [],
      answerText: 'Skipped',
    });

    setCurrentStep(2);
    navigation.navigate('Assessment', { step: 1 });
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
            currentStep={2}
            totalSteps={5}
            showStepNumbers={true}
          />
        </View>

        {/* Body area selector */}
        <BodyAreaSelector
          selectedAreas={selectedAreas}
          onSelectionChange={handleAreaSelectionChange}
          maxSelections={10}
          title="Where do you feel pain or discomfort?"
          subtitle="Select all areas that apply - this helps us create your personalized recovery plan"
        />

        {/* Action buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            marginTop: theme.spacing[6],
          }}
        >
          <View style={{ flex: 1 }}>
            <Button
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              size="large"
            />
          </View>

          <View style={{ flex: 2 }}>
            <Button
              title={`Continue${selectedAreas.length > 0 ? ` (${selectedAreas.length})` : ''}`}
              onPress={handleContinue}
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
