import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../styles/theme';
import { ExerciseCard } from '../../components/ui/ExerciseCard';
import { Exercise } from '../../types';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import {
  aiExerciseRecommendations,
  ExerciseRecommendation,
  UserContext,
} from '../../services/aiExerciseRecommendations';

// Temporary user context - in production this would come from user store/context
const getMockUserContext = (): UserContext => ({
  userId: 'demo-user-123',
  questionnaireData: {
    painAreas: ['back', 'neck'],
    activityLevel: 'sedentary',
    goals: ['reduce_pain', 'improve_mobility'],
    currentPhase: 1,
  },
  exerciseHistory: {
    completedExercises: [],
    avgPainLevel: 5,
    avgDifficultyRating: 3,
    recentFeedback: [],
  },
  preferences: {
    maxDifficulty: 3,
    preferredTypes: ['mobility', 'strength'],
    timeAvailable: 30,
  },
});

export const ExercisesScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<
    ExerciseRecommendation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    loadPersonalizedExercises();
  }, []);

  const loadPersonalizedExercises = async () => {
    try {
      setLoading(true);
      setError(null);

      const userContext = getMockUserContext();
      const { recommendations: aiRecommendations, error: serviceError } =
        await aiExerciseRecommendations.getPersonalizedRecommendations(
          userContext,
          10
        );

      setRecommendations(aiRecommendations);
      if (serviceError) {
        setError(serviceError);
      }
    } catch (err) {
      setError('Failed to load personalized exercises');
      console.error('Exercise loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPersonalizedExercises();
  };

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
          AI-powered personalized exercises for your recovery
        </Text>

        {/* Refresh Button */}
        <Pressable
          onPress={handleRefresh}
          style={{
            marginTop: theme.spacing[2],
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[1],
            backgroundColor: theme.colors.primary[100],
            borderRadius: 20,
            alignSelf: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.primary[600],
              fontWeight: theme.typography.fontWeight.medium,
            }}
          >
            🔄 Refresh Recommendations
          </Text>
        </Pressable>
      </View>

      {/* Loading State */}
      {loading && (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Text
            style={{
              marginTop: theme.spacing[3],
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            Generating your personalized exercises...
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing[4],
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: theme.spacing[3] }}>
            ⚠️
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.primary,
              textAlign: 'center',
              marginBottom: theme.spacing[2],
            }}
          >
            Could not load exercises
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              marginBottom: theme.spacing[4],
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={handleRefresh}
            style={{
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Try Again
            </Text>
          </Pressable>
        </View>
      )}

      {/* Exercise Recommendations List */}
      {!loading && !error && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: theme.spacing[4],
          }}
          showsVerticalScrollIndicator={false}
        >
          {recommendations.length > 0 ? (
            recommendations.map((recommendation, index) => (
              <View
                key={recommendation.exercise.id}
                style={{ marginBottom: theme.spacing[3] }}
              >
                <ExerciseCard
                  exercise={recommendation.exercise}
                  onPress={handleExercisePress}
                  showPlayButton={true}
                />

                {/* AI Recommendation Reason */}
                <View
                  style={{
                    backgroundColor: theme.colors.primary[50],
                    padding: theme.spacing[2],
                    borderRadius: 8,
                    marginTop: theme.spacing[1],
                    borderLeftWidth: 3,
                    borderLeftColor: theme.colors.primary[400],
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.primary[700],
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    🤖 AI Coach: {recommendation.reason}
                  </Text>

                  {/* Show modifications if available */}
                  {recommendation.modifications.length > 0 && (
                    <Text
                      style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.primary[600],
                        marginTop: theme.spacing[1],
                        fontStyle: 'italic',
                      }}
                    >
                      💡 {recommendation.modifications[0]}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing[8],
              }}
            >
              <Text style={{ fontSize: 40, marginBottom: theme.spacing[3] }}>
                🤖
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.lg,
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: theme.spacing[2],
                }}
              >
                No exercises found
              </Text>
              <Text
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text.secondary,
                  textAlign: 'center',
                }}
              >
                Try refreshing to get new recommendations
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
