import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList, SCREEN_NAMES } from './types';

// Import tab screens
import { HomeScreen } from '../screens/HomeScreen';
import { ExercisesScreen } from '../screens/exercises/ExercisesScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ChatTabScreenWrapper } from '../screens/chat/ChatTabScreenWrapper';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import icons (using Expo vector icons for now)
import { Ionicons } from '@expo/vector-icons';

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <MainTab.Navigator
      initialRouteName={SCREEN_NAMES.HOME}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E7',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <MainTab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name={SCREEN_NAMES.EXERCISES}
        component={ExercisesScreen}
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name={SCREEN_NAMES.PROGRESS}
        component={ProgressScreen}
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name="Chat"
        component={ChatTabScreenWrapper}
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <MainTab.Screen
        name={SCREEN_NAMES.PROFILE}
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </MainTab.Navigator>
  );
};
