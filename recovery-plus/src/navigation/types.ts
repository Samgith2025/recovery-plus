// Navigation parameter lists for type safety

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Main: undefined;
  Questionnaire: undefined;
  Chat: undefined;
  ExerciseDetail: { exercise: any };
  ExerciseSession: { exerciseId: string };
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  GetStarted: undefined;
  Permissions: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Exercises: undefined;
  Progress: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type ExerciseStackParamList = {
  ExerciseList: undefined;
  ExerciseDetail: { exerciseId: string };
  ExercisePlayer: { exerciseId: string };
  ExerciseFeedback: { sessionId: string };
};

export type ChatStackParamList = {
  ChatHistory: undefined;
  ChatSession: undefined;
  ChatOnboarding: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  Subscription: undefined;
  Help: undefined;
  About: undefined;
};

// Screen names constants
export const SCREEN_NAMES = {
  // Root
  ONBOARDING: 'Onboarding' as const,
  AUTH: 'Auth' as const,
  MAIN: 'Main' as const,
  QUESTIONNAIRE: 'Questionnaire' as const,
  CHAT: 'Chat' as const,
  EXERCISE: 'Exercise' as const,
  EXERCISE_SESSION: 'ExerciseSession' as const,

  // Auth
  SIGN_IN: 'SignIn' as const,
  SIGN_UP: 'SignUp' as const,
  FORGOT_PASSWORD: 'ForgotPassword' as const,

  // Onboarding
  WELCOME: 'Welcome' as const,
  GET_STARTED: 'GetStarted' as const,
  PERMISSIONS: 'Permissions' as const,

  // Main Tabs
  HOME: 'Home' as const,
  EXERCISES: 'Exercises' as const,
  PROGRESS: 'Progress' as const,
  CHAT_TAB: 'Chat' as const,
  PROFILE: 'Profile' as const,

  // Exercise Stack
  EXERCISE_LIST: 'ExerciseList' as const,
  EXERCISE_DETAIL: 'ExerciseDetail' as const,
  EXERCISE_PLAYER: 'ExercisePlayer' as const,
  EXERCISE_FEEDBACK: 'ExerciseFeedback' as const,

  // Chat Stack
  CHAT_HISTORY: 'ChatHistory' as const,
  CHAT_SESSION: 'ChatSession' as const,
  CHAT_ONBOARDING: 'ChatOnboarding' as const,

  // Profile Stack
  PROFILE_MAIN: 'ProfileMain' as const,
  SETTINGS: 'Settings' as const,
  SUBSCRIPTION: 'Subscription' as const,
  HELP: 'Help' as const,
  ABOUT: 'About' as const,
} as const;
