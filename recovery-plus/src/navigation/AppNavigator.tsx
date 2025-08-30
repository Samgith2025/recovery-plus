import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useAppStore } from '../store';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { Exercise } from '../components/ui/ExerciseCard';
import { authService } from '../services/auth';
import { LoadingScreen } from '../components/common/LoadingScreen';

// Onboarding screens (we'll create these next)
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { BodyAreasScreen } from '../screens/onboarding/BodyAreasScreen';
import { AssessmentScreen } from '../screens/onboarding/AssessmentScreen';
import { DemographicsScreen } from '../screens/onboarding/DemographicsScreen';
import { CompletionScreen } from '../screens/onboarding/CompletionScreen';

export type RootStackParamList = {
  // Auth flow
  Auth: undefined;

  // Onboarding flow
  Welcome: undefined;
  BodyAreas: undefined;
  Assessment: { step: number };
  Demographics: { step: number };
  Completion: undefined;

  // Main app
  MainTabs: undefined;
  ExerciseDetail: { exercise: Exercise };

  // Additional screens
  Preferences: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isLoaded, isSignedIn, signOut: clerkSignOut } = useAuth();
  const { user } = useUser();
  const {
    isAuthenticated,
    hasCompletedOnboarding,
    signIn,
    signOut,
    setIsLoading,
  } = useAppStore();
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  // Sync Clerk authentication with Zustand store and handle session persistence
  useEffect(() => {
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    const syncAuthState = async () => {
      if (isSignedIn && user && !isAuthenticated) {
        // User is signed in with Clerk but not in our store - sync them
        try {
          await authService.handleAuthSuccess(user, signIn);
        } catch (error) {
          console.error('Failed to sync auth state:', error);
          // Fall back to basic user info
          const appUser = authService.convertClerkUser(user);
          signIn(appUser);
        }
      } else if (!isSignedIn && isAuthenticated) {
        // User is signed out of Clerk but still in our store - sync them
        signOut();
      }
    };

    syncAuthState();
  }, [
    isLoaded,
    isSignedIn,
    user,
    isAuthenticated,
    signIn,
    signOut,
    setIsLoading,
  ]);

  const handleExercisePress = (exercise: Exercise) => {
    setCurrentExercise(exercise);
  };

  const handleBackFromExercise = () => {
    setCurrentExercise(null);
  };

  const handleSignOut = async () => {
    await authService.signOut(clerkSignOut, signOut);
  };

  // Show loading while Clerk is initializing
  if (!isLoaded) {
    return <LoadingScreen message="Initializing authentication..." />;
  }

  // If showing exercise detail
  if (currentExercise) {
    return (
      <ExerciseDetailScreen
        exercise={currentExercise}
        onBackPress={handleBackFromExercise}
        onStartWorkout={exercise => {
          console.log('Starting workout:', exercise.name);
          // Could navigate to workout screen or show modal
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Authentication flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          // Onboarding flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="BodyAreas" component={BodyAreasScreen} />
            <Stack.Screen name="Assessment" component={AssessmentScreen} />
            <Stack.Screen name="Demographics" component={DemographicsScreen} />
            <Stack.Screen name="Completion" component={CompletionScreen} />
          </>
        ) : (
          // Main app flow
          <>
            <Stack.Screen name="MainTabs">
              {() => (
                <TabNavigator
                  onExercisePress={handleExercisePress}
                  onSignOut={handleSignOut}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
