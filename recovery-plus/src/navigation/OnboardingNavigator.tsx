import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStackParamList, SCREEN_NAMES } from './types';

// Import onboarding screens (placeholders for now)
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { GetStartedScreen } from '../screens/onboarding/GetStartedScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingStack.Navigator
      initialRouteName={SCREEN_NAMES.WELCOME}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <OnboardingStack.Screen
        name={SCREEN_NAMES.WELCOME}
        component={WelcomeScreen}
      />
      <OnboardingStack.Screen
        name={SCREEN_NAMES.GET_STARTED}
        component={GetStartedScreen}
      />
      <OnboardingStack.Screen
        name={SCREEN_NAMES.PERMISSIONS}
        component={PermissionsScreen}
      />
    </OnboardingStack.Navigator>
  );
};
