import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppStore } from '../store';
import { RootStackParamList, SCREEN_NAMES } from './types';

// Import navigators (will be created in subsequent steps)
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';

// Import screens
import { QuestionnaireScreen } from '../screens/questionnaire/QuestionnaireScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ExerciseDetailScreenWrapper } from '../screens/ExerciseDetailScreenWrapper';
import { ExerciseSessionScreen } from '../screens/ExerciseSessionScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, questionnaireResponse } =
    useAppStore();

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!hasCompletedOnboarding ? (
          // User hasn't completed onboarding
          <RootStack.Screen
            name={SCREEN_NAMES.ONBOARDING}
            component={OnboardingNavigator}
          />
        ) : !isAuthenticated ? (
          // User needs to authenticate
          <RootStack.Screen
            name={SCREEN_NAMES.AUTH}
            component={AuthNavigator}
          />
        ) : !questionnaireResponse?.completed ? (
          // User needs to complete questionnaire
          <RootStack.Screen
            name={SCREEN_NAMES.QUESTIONNAIRE}
            component={QuestionnaireScreen}
          />
        ) : (
          // Main app flow
          <>
            <RootStack.Screen
              name={SCREEN_NAMES.MAIN}
              component={MainTabNavigator}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.CHAT}
              component={ChatScreen}
              options={{
                headerShown: true,
                title: 'Recovery Coach',
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name="ExerciseDetail"
              component={ExerciseDetailScreenWrapper}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <RootStack.Screen
              name={SCREEN_NAMES.EXERCISE_SESSION}
              component={ExerciseSessionScreen}
              options={{
                headerShown: true,
                title: 'Exercise Session',
                presentation: 'fullScreenModal',
              }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
