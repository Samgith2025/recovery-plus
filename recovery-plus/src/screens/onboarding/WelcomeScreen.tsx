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
import {
  MultiChoiceCard,
  ChoiceOption,
} from '../../components/ui/MultiChoiceCard';
import { useAppStore } from '../../store';
import { getSafeAreaInsets } from '../../utils/device';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

const authOptions: ChoiceOption[] = [
  {
    id: 'email',
    label: 'Continue with Email',
    description: 'Sign up or sign in with your email address',
    icon: '📧',
  },
  {
    id: 'google',
    label: 'Continue with Google',
    description: 'Quick sign up with your Google account',
    icon: '🔍',
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    description: 'Sign up with Apple ID (iOS only)',
    icon: '🍎',
  },
];

export const WelcomeScreen: React.FC = () => {
  const [selectedAuthMethod, setSelectedAuthMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const safeArea = getSafeAreaInsets();

  const { signIn } = useAppStore();

  const handleAuthSelection = (optionId: string) => {
    setSelectedAuthMethod(optionId);
  };

  const handleContinue = async () => {
    if (!selectedAuthMethod) {
      Alert.alert(
        'Please select a sign-in method',
        "Choose how you'd like to continue"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock successful sign in
      signIn({
        id: '1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isAuthenticated: true,
      });

      // Navigate to body areas screen
      navigation.navigate('BodyAreas');
    } catch (error) {
      Alert.alert('Sign In Failed', 'Please try again');
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
        <View style={{ marginBottom: theme.spacing[8] }}>
          <ProgressIndicator
            currentStep={1}
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
            <Text style={{ fontSize: 40 }}>💪</Text>
          </View>

          <Text
            style={{
              fontSize: theme.typography.fontSize['3xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[3],
            }}
          >
            Welcome to Recovery+
          </Text>

          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: theme.typography.lineHeight.relaxed,
            }}
          >
            Your personal AI-powered recovery coach for pain management and
            injury prevention
          </Text>
        </View>

        {/* Authentication options */}
        <MultiChoiceCard
          title="Let's get started"
          subtitle="Choose how you'd like to sign up or sign in"
          options={authOptions}
          selectedOption={selectedAuthMethod}
          onSelectionChange={handleAuthSelection}
          layout="stack"
          cardStyle="default"
        />

        {/* Continue button */}
        <View style={{ marginTop: theme.spacing[6] }}>
          <Button
            title={isLoading ? 'Signing In...' : 'Continue'}
            onPress={handleContinue}
            disabled={!selectedAuthMethod || isLoading}
            variant="primary"
            size="lg"
          />
        </View>

        {/* Terms and privacy */}
        <Text
          style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.text.tertiary,
            textAlign: 'center',
            marginTop: theme.spacing[6],
            lineHeight: theme.typography.lineHeight.relaxed,
          }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Recovery+ is designed to support your health journey but is not a
          replacement for professional medical advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};
