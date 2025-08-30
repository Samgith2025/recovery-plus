import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { theme } from '../styles/theme';
import { getSafeAreaInsets } from '../utils/device';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Exercise } from '../components/ui/ExerciseCard';

const Tab = createBottomTabNavigator();

// Tab icon component
const TabIcon = ({
  focused,
  icon,
  label,
}: {
  focused: boolean;
  icon: string;
  label: string;
}) => {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          marginBottom: 4,
          opacity: focused ? 1 : 0.6,
        }}
      >
        {icon}
      </Text>
      <Text
        style={{
          fontSize: 10,
          color: focused
            ? theme.colors.primary[500]
            : theme.colors.text.secondary,
          fontWeight: focused ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

interface TabNavigatorProps {
  onExercisePress?: (exercise: Exercise) => void;
  onSignOut?: () => void;
}

export const TabNavigator: React.FC<TabNavigatorProps> = ({
  onExercisePress,
  onSignOut,
}) => {
  const safeArea = getSafeAreaInsets();

  const handleExercisePress = (exercise: Exercise) => {
    if (onExercisePress) {
      onExercisePress(exercise);
    }
  };

  const handleStartChat = () => {
    // Navigate to Chat tab - this will be handled by navigation
  };

  const handleGetStarted = () => {
    // Navigate to Chat tab when "Get Started" is pressed
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    }
  };

  const handlePreferences = () => {
    // TODO: Navigate to preferences screen
    console.log('Navigate to preferences');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 80 + safeArea.bottom,
          paddingBottom: safeArea.bottom + 8,
          paddingTop: 8,
          elevation: 8,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.secondary,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      >
        {() => (
          <HomeScreen
            onExercisePress={handleExercisePress}
            onStartChatPress={handleStartChat}
            onGetStartedPress={handleGetStarted}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="💬" label="Chat" />
          ),
        }}
      >
        {() => <ChatScreen />}
      </Tab.Screen>

      <Tab.Screen
        name="Progress"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="📈" label="Progress" />
          ),
        }}
      >
        {() => <ProgressScreen />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="👤" label="Profile" />
          ),
        }}
      >
        {() => (
          <ProfileScreen
            onSignOutPress={handleSignOut}
            onPreferencesPress={handlePreferences}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
};
