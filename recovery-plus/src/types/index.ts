// Core types for the Recovery+ app

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  responses: Record<string, unknown>;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryPhase {
  id: string;
  userId: string;
  phase: number;
  title: string;
  description: string;
  weeklyPlan: WeeklyPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlan {
  id: string;
  phaseId: string;
  exercises: Exercise[];
  weekNumber: number;
  isLocked: boolean;
}

export interface Exercise {
  id: string;
  name: string; // Primary display name
  title?: string; // Alternative title for compatibility
  description: string;
  instructions: string[];

  // Exercise parameters
  sets?: number;
  reps?: number;
  holdTime?: number; // In seconds
  restTime?: number; // Rest between sets in seconds
  duration?: string; // Display duration (e.g. "10 mins")

  // Classification
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  difficulty: 1 | 2 | 3 | 4 | 5;
  type: 'strength' | 'mobility' | 'isometric' | 'cardio' | 'relaxation' | 'balance';
  category?: string;

  // Body targeting
  targetMuscles: string[]; // Primary muscles targeted
  bodyPart: string[]; // Body parts involved

  // Media and resources
  videoUrl?: string; // Primary video URL
  videoUrls: string[]; // All available video URLs
  imageUrl?: string;
  icon?: string; // Emoji or icon identifier

  // Equipment and setup
  equipment?: string[];
}

export interface ExerciseSet {
  setNumber: number;
  reps?: number;
  holdTime?: number; // In seconds
  completed: boolean;
  restTimeUsed?: number; // Actual rest time taken
  startedAt?: string;
  completedAt?: string;
  painLevel?: number; // 1-10 scale for this specific set
  difficultyRating?: number; // 1-10 scale for this specific set
}

export interface ExerciseSession {
  id: string;
  exerciseId: string;
  exerciseName?: string;
  userId: string;
  completed: boolean;
  isActive?: boolean;
  startTime?: string;
  duration?: number;

  // Detailed tracking
  sets: ExerciseSet[];
  currentSet: number;
  totalSetsCompleted: number;

  // Timer state
  isTimerRunning: boolean;
  isPaused: boolean;
  currentSetStartTime?: string;
  restStartTime?: string;

  // Overall feedback
  painLevel?: number;
  difficultyRating?: number;
  energyLevel?: number; // 1-10 scale
  enjoymentRating?: number; // 1-10 scale
  notes?: string;

  // Metadata
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'yearly';
  features: string[];
}
