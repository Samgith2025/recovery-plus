import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
} from 'react-native';
import { theme } from '../../styles/theme';
import { ExerciseCard } from '../../components/ui/ExerciseCard';
import { Exercise } from '../../types';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

// Mock exercise data for testing
const MOCK_EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Cat-Cow Stretch',
    description: 'Gentle spinal mobility exercise to improve back flexibility',
    instructions: [
      'Start on hands and knees in tabletop position',
      'Arch your back and lift your head for cow pose',
      'Round your spine and tuck chin to chest for cat pose',
      'Alternate slowly between positions',
    ],
    sets: 3,
    reps: 10,
    holdTime: 2,
    restTime: 30,
    level: 'BEGINNER',
    difficulty: 1,
    type: 'mobility',
    targetMuscles: ['Core', 'Back'],
    bodyPart: ['Spine', 'Core'],
    videoUrls: [
      'https://www.youtube.com/watch?v=K9bK0BwKFjs', // Cat Cow exercise
    ],
    icon: '🐱',
    duration: '5 mins',
    equipment: [],
  },
  {
    id: 'ex-2',
    name: 'Bird Dog',
    description: 'Core stability exercise for back pain relief',
    instructions: [
      'Start in tabletop position',
      'Extend opposite arm and leg',
      'Hold position maintaining balance',
      'Return to start and switch sides',
    ],
    sets: 3,
    reps: 8,
    holdTime: 5,
    restTime: 45,
    level: 'INTERMEDIATE',
    difficulty: 3,
    type: 'strength',
    targetMuscles: ['Core', 'Back', 'Glutes'],
    bodyPart: ['Core', 'Back', 'Hips'],
    videoUrls: [
      'https://www.youtube.com/watch?v=wiFNA3sqjCA', // Bird dog exercise
    ],
    icon: '🐦',
    duration: '8 mins',
    equipment: [],
  },
  {
    id: 'ex-3',
    name: 'Dead Bug',
    description: 'Core strengthening exercise with controlled movement',
    instructions: [
      'Lie on back with arms extended toward ceiling',
      'Bend knees at 90 degrees, shins parallel to floor',
      'Lower opposite arm and leg slowly',
      'Return to start and repeat other side',
    ],
    sets: 3,
    reps: 12,
    holdTime: 3,
    restTime: 60,
    level: 'INTERMEDIATE',
    difficulty: 2,
    type: 'strength',
    targetMuscles: ['Core', 'Hip Flexors'],
    bodyPart: ['Core', 'Hips'],
    videoUrls: [
      'https://www.youtube.com/watch?v=hVgSWu6hAyE', // Dead bug exercise
    ],
    icon: '🪲',
    duration: '10 mins',
    equipment: [],
  },
];

export const ExercisesScreen: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    // Load mock exercises
    setExercises(MOCK_EXERCISES);
  }, []);

  const handleExercisePress = (exercise: Exercise) => {
    // Navigate to ExerciseDetailScreen
    navigation.navigate('ExerciseDetail', { exercise });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            textAlign: 'center',
          }}
        >
          Exercises
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            marginTop: theme.spacing[1],
          }}
        >
          Tap an exercise to view details and watch videos
        </Text>
      </View>

      {/* Exercise List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: theme.spacing[4],
        }}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length > 0 ? (
          exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onPress={handleExercisePress}
              showPlayButton={true}
            />
          ))
        ) : (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.spacing[8],
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.text.secondary,
                textAlign: 'center',
              }}
            >
              No exercises available
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
