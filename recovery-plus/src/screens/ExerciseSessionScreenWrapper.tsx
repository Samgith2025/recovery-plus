import React, { useEffect, useState } from 'react';
import { ExerciseSessionScreen } from './ExerciseSessionScreen';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Exercise } from '../types';
import { useExerciseStore } from '../store/exercise';

// Define the route params type
type ExerciseSessionRouteProp = RouteProp<
  { ExerciseSession: { exerciseId: string } },
  'ExerciseSession'
>;

export const ExerciseSessionScreenWrapper: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ExerciseSessionRouteProp>();
  const { exerciseId } = route.params;
  const [exercise, setExercise] = useState<Exercise | null>(null);

  const { currentSession, currentExercise } = useExerciseStore();

  useEffect(() => {
    // Try to get the exercise from the current session or find it by ID
    if (currentExercise && currentExercise.id === exerciseId) {
      setExercise(currentExercise);
    } else {
      // If no current exercise, create a basic exercise object for demo
      // In a real app, you'd fetch this from a database or store
      const mockExercise: Exercise = {
        id: exerciseId,
        name: 'Exercise Session',
        description: 'Exercise in progress',
        instructions: ['Follow the exercise instructions'],
        sets: 3,
        reps: 10,
        level: 'BEGINNER',
        difficulty: 1,
        type: 'strength',
        targetMuscles: ['General'],
        bodyPart: ['Body'],
        videoUrls: [],
        duration: '10 mins',
      };
      setExercise(mockExercise);
    }
  }, [exerciseId, currentExercise]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleCompleteWorkout = () => {
    // Navigate back to the main tabs or exercise detail
    navigation.navigate('MainTabs' as never);
  };

  if (!exercise) {
    return null; // Loading state
  }

  return (
    <ExerciseSessionScreen
      exercise={exercise}
      onBackPress={handleBackPress}
      onCompleteWorkout={handleCompleteWorkout}
    />
  );
};
