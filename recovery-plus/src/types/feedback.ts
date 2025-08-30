export interface ExerciseFeedback {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;

  // Pain and difficulty ratings (1-10 scale)
  painLevel: number; // 1 = no pain, 10 = severe pain
  difficultyRating: number; // 1 = very easy, 10 = extremely difficult

  // Additional feedback
  energyLevel?: number; // 1 = exhausted, 10 = energized
  enjoymentRating?: number; // 1 = hated it, 10 = loved it
  perceivedEffectiveness?: number; // 1 = not helpful, 10 = very helpful

  // Qualitative feedback
  notes?: string;
  modifications?: string; // What modifications were needed
  completionStatus: 'completed' | 'partial' | 'skipped' | 'modified';

  // Context
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  durationMinutes: number;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number;

  // Tracking
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackTrend {
  exerciseId: string;
  exerciseName: string;
  averagePainLevel: number;
  averageDifficultyRating: number;
  totalSessions: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  lastFeedbackDate: string;
}

export interface FeedbackAnalysis {
  userId: string;
  overallPainTrend: 'improving' | 'stable' | 'worsening';
  averagePainLevel: number;
  averageDifficultyRating: number;
  mostEffectiveExercises: string[];
  leastEffectiveExercises: string[];
  recommendedModifications: string[];
  progressScore: number; // 0-100
  analysisDate: string;
}

export interface FeedbackPrompt {
  id: string;
  type: 'pain' | 'difficulty' | 'energy' | 'enjoyment' | 'effectiveness';
  question: string;
  scale: {
    min: number;
    max: number;
    labels: {
      [key: number]: string;
    };
  };
  isRequired: boolean;
}

export interface FeedbackSession {
  id: string;
  userId: string;
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  prompts: FeedbackPrompt[];
  responses: Record<string, number | string>;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}
