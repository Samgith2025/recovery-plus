import { create } from 'zustand';
import { Exercise, ExerciseSession, ExerciseSet, WeeklyPlan } from '../types';

interface ExerciseState {
  // Current exercise session
  currentExercise: Exercise | null;
  currentSession: ExerciseSession | null;
  isExerciseActive: boolean;
  exerciseStartTime: Date | null;

  // Weekly plan
  currentWeeklyPlan: WeeklyPlan | null;
  todaysExercises: Exercise[];
  completedTodayCount: number;

  // Exercise history
  recentSessions: ExerciseSession[];
  exerciseHistory: Record<string, ExerciseSession[]>;
  sessionHistory: ExerciseSession[];

  // Actions
  setCurrentExercise: (exercise: Exercise | null) => void;
  startExercise: (exercise: Exercise) => void;
  startSession: (exercise: Exercise) => ExerciseSession;
  completeCurrentSet: () => void;
  startNextSet: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  startRest: () => void;
  completeRest: () => void;
  updateSetFeedback: (
    setNumber: number,
    feedback: { painLevel?: number; difficultyRating?: number }
  ) => void;
  completeExercise: (session: ExerciseSession) => void;
  pauseExercise: () => void;
  resumeExercise: () => void;
  stopExercise: () => void;

  setCurrentWeeklyPlan: (plan: WeeklyPlan | null) => void;
  setTodaysExercises: (exercises: Exercise[]) => void;
  updateCompletedTodayCount: (count: number) => void;

  addSessionToHistory: (session: ExerciseSession) => void;
  setRecentSessions: (sessions: ExerciseSession[]) => void;

  // Computed values
  exerciseDuration: () => number;
  todaysProgress: () => number;
  isExerciseCompleted: (exerciseId: string) => boolean;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  // Initial state
  currentExercise: null,
  currentSession: null,
  isExerciseActive: false,
  exerciseStartTime: null,

  currentWeeklyPlan: null,
  todaysExercises: [],
  completedTodayCount: 0,

  recentSessions: [],
  exerciseHistory: {},
  sessionHistory: [],

  // Actions
  setCurrentExercise: exercise => set({ currentExercise: exercise }),

  startExercise: exercise =>
    set({
      currentExercise: exercise,
      isExerciseActive: true,
      exerciseStartTime: new Date(),
      currentSession: {
        id: `session_${Date.now()}`,
        exerciseId: exercise.id,
        userId: '', // Will be set from auth context
        completed: false,
        sets: [],
        currentSet: 0,
        totalSetsCompleted: 0,
        isTimerRunning: false,
        isPaused: false,
        painLevel: undefined,
        difficultyRating: undefined,
        notes: undefined,
        completedAt: undefined,
      },
    }),

  startSession: exercise => {
    // Initialize sets based on exercise parameters
    const numSets = exercise.sets || 1;
    const sets: ExerciseSet[] = Array.from({ length: numSets }, (_, index) => ({
      setNumber: index + 1,
      reps: exercise.reps,
      holdTime: exercise.holdTime,
      completed: false,
      restTimeUsed: undefined,
      startedAt: undefined,
      completedAt: undefined,
      painLevel: undefined,
      difficultyRating: undefined,
    }));

    const session: ExerciseSession = {
      id: `session_${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      userId: '', // Will be set from auth context
      completed: false,
      isActive: true,
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 0,

      // Detailed tracking
      sets,
      currentSet: 1,
      totalSetsCompleted: 0,

      // Timer state
      isTimerRunning: false,
      isPaused: false,
      currentSetStartTime: undefined,
      restStartTime: undefined,

      // Overall feedback (will be filled later)
      painLevel: undefined,
      difficultyRating: undefined,
      energyLevel: undefined,
      enjoymentRating: undefined,
      notes: undefined,
      completedAt: undefined,
    };

    set({
      currentExercise: exercise,
      currentSession: session,
      isExerciseActive: true,
      exerciseStartTime: new Date(),
    });
    return session;
  },

  completeCurrentSet: () =>
    set(state => {
      if (!state.currentSession) return state;

      const updatedSets = state.currentSession.sets.map(set =>
        set.setNumber === state.currentSession!.currentSet
          ? { ...set, completed: true, completedAt: new Date().toISOString() }
          : set
      );

      const updatedSession = {
        ...state.currentSession,
        sets: updatedSets,
        totalSetsCompleted: state.currentSession.totalSetsCompleted + 1,
        isTimerRunning: false,
        currentSetStartTime: undefined,
        updatedAt: new Date().toISOString(),
      };

      return {
        currentSession: updatedSession,
      };
    }),

  startNextSet: () =>
    set(state => {
      if (
        !state.currentSession ||
        state.currentSession.currentSet >= state.currentSession.sets.length
      ) {
        return state;
      }

      const updatedSession = {
        ...state.currentSession,
        currentSet: state.currentSession.currentSet + 1,
        isTimerRunning: true,
        currentSetStartTime: new Date().toISOString(),
        restStartTime: undefined,
        updatedAt: new Date().toISOString(),
      };

      return { currentSession: updatedSession };
    }),

  pauseTimer: () =>
    set(state => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            isTimerRunning: false,
            isPaused: true,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  resumeTimer: () =>
    set(state => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            isTimerRunning: true,
            isPaused: false,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  startRest: () =>
    set(state => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            isTimerRunning: false,
            restStartTime: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  completeRest: () =>
    set(state => {
      if (!state.currentSession) return state;

      const restDuration = state.currentSession.restStartTime
        ? Date.now() - new Date(state.currentSession.restStartTime).getTime()
        : 0;

      const updatedSets = state.currentSession.sets.map(set =>
        set.setNumber === state.currentSession!.currentSet - 1
          ? { ...set, restTimeUsed: Math.round(restDuration / 1000) }
          : set
      );

      const updatedSession = {
        ...state.currentSession,
        sets: updatedSets,
        restStartTime: undefined,
        updatedAt: new Date().toISOString(),
      };

      return { currentSession: updatedSession };
    }),

  updateSetFeedback: (setNumber, feedback) =>
    set(state => {
      if (!state.currentSession) return state;

      const updatedSets = state.currentSession.sets.map(set =>
        set.setNumber === setNumber ? { ...set, ...feedback } : set
      );

      const updatedSession = {
        ...state.currentSession,
        sets: updatedSets,
        updatedAt: new Date().toISOString(),
      };

      return { currentSession: updatedSession };
    }),

  completeExercise: session =>
    set(state => ({
      currentSession: {
        ...session,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      isExerciseActive: false,
      completedTodayCount: state.completedTodayCount + 1,
    })),

  pauseExercise: () =>
    set(state => ({
      isExerciseActive: false,
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            isPaused: true,
            isTimerRunning: false,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  resumeExercise: () =>
    set(state => ({
      isExerciseActive: true,
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            isPaused: false,
            updatedAt: new Date().toISOString(),
          }
        : null,
    })),

  stopExercise: () =>
    set({
      currentExercise: null,
      currentSession: null,
      isExerciseActive: false,
      exerciseStartTime: null,
    }),

  setCurrentWeeklyPlan: plan => set({ currentWeeklyPlan: plan }),
  setTodaysExercises: exercises => set({ todaysExercises: exercises }),
  updateCompletedTodayCount: count => set({ completedTodayCount: count }),

  addSessionToHistory: session =>
    set(state => ({
      recentSessions: [session, ...state.recentSessions].slice(0, 10),
      exerciseHistory: {
        ...state.exerciseHistory,
        [session.exerciseId]: [
          session,
          ...(state.exerciseHistory[session.exerciseId] || []),
        ].slice(0, 20),
      },
    })),

  setRecentSessions: sessions => set({ recentSessions: sessions }),

  // Computed values
  exerciseDuration: () => {
    const { exerciseStartTime, isExerciseActive } = get();
    if (!exerciseStartTime || !isExerciseActive) return 0;
    return Date.now() - exerciseStartTime.getTime();
  },

  todaysProgress: () => {
    const { completedTodayCount, todaysExercises } = get();
    if (todaysExercises.length === 0) return 0;
    return (completedTodayCount / todaysExercises.length) * 100;
  },

  isExerciseCompleted: exerciseId => {
    const { exerciseHistory } = get();
    const sessions = exerciseHistory[exerciseId] || [];
    const today = new Date().toDateString();
    return sessions.some(
      session =>
        session.completed &&
        session.completedAt &&
        new Date(session.completedAt).toDateString() === today
    );
  },
}));
