// App constants

export const APP_CONFIG = {
  name: 'Recovery+',
  version: '1.0.0',
  bundleId: 'com.recoveryplus.app',
} as const;

export const API_ENDPOINTS = {
  questionnaire: '/questionnaire',
  chat: '/chat',
  exercises: '/exercises',
  phases: '/phases',
  user: '/user',
} as const;

export const STORAGE_KEYS = {
  user: '@recovery_plus_user',
  questionnaire: '@recovery_plus_questionnaire',
  onboarding: '@recovery_plus_onboarding',
} as const;

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5AC8FA',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
} as const;

export const PAIN_SCALE = [
  { value: 1, label: 'No Pain', description: 'I feel great!' },
  { value: 2, label: 'Minimal', description: 'Barely noticeable' },
  { value: 3, label: 'Mild', description: 'Noticeable but manageable' },
  { value: 4, label: 'Moderate', description: 'Somewhat uncomfortable' },
  { value: 5, label: 'Moderate+', description: 'Moderately uncomfortable' },
  { value: 6, label: 'Strong', description: 'Quite uncomfortable' },
  { value: 7, label: 'Strong+', description: 'Very uncomfortable' },
  { value: 8, label: 'Severe', description: 'Extremely uncomfortable' },
  { value: 9, label: 'Severe+', description: 'Nearly unbearable' },
  { value: 10, label: 'Unbearable', description: 'Worst imaginable' },
] as const;

export const RECOVERY_PHASES = {
  1: {
    title: 'Initial Assessment',
    description: 'Getting started with gentle movements',
  },
  2: {
    title: 'Foundation Building',
    description: 'Building basic strength and mobility',
  },
  3: {
    title: 'Progressive Loading',
    description: 'Gradually increasing activity',
  },
  4: {
    title: 'Functional Recovery',
    description: 'Return to daily activities',
  },
  5: {
    title: 'Performance Optimization',
    description: 'Peak recovery and prevention',
  },
} as const;
