import React from 'react';
import { ChatScreen } from '../ChatScreen';
import { useNavigation } from '@react-navigation/native';
import { Exercise } from '../../types';

export const ChatTabScreenWrapper: React.FC = () => {
  const navigation = useNavigation();

  const handleNavigateToExercise = (exercise: Exercise) => {
    // Navigate to ExerciseDetail screen
    navigation.navigate('ExerciseDetail' as never, { exercise } as never);
  };

  // No back button needed in tab context, so onBackPress is undefined
  return (
    <ChatScreen
      onBackPress={undefined}
      onNavigateToExercise={handleNavigateToExercise}
      isInTabNavigator={true}
    />
  );
};
