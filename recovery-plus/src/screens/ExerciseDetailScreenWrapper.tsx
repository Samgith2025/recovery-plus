import React from 'react';
import { ExerciseDetailScreen } from './ExerciseDetailScreen';
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Exercise } from '../types';

type ExerciseDetailRouteProp = RouteProp<RootStackParamList, 'ExerciseDetail'>;

export const ExerciseDetailScreenWrapper: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<ExerciseDetailRouteProp>();
  const { exercise } = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleStartWorkout = (exercise: Exercise) => {
    // Navigate to ExerciseSession screen
    navigation.navigate('ExerciseSession', { exerciseId: exercise.id });
  };

  return (
    <ExerciseDetailScreen
      exercise={exercise}
      onBackPress={handleBackPress}
      onStartWorkout={handleStartWorkout}
    />
  );
};
