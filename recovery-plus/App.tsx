import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { theme } from './src/styles/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ChatTabScreenWrapper } from './src/screens/chat/ChatTabScreenWrapper';
import { ExercisesScreen as ProperExercisesScreen } from './src/screens/exercises/ExercisesScreen';
import { ExerciseDetailScreenWrapper } from './src/screens/ExerciseDetailScreenWrapper';
import { ExerciseSessionScreenWrapper } from './src/screens/ExerciseSessionScreenWrapper';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Simple onboarding screens
interface NavigationProp {
  navigate: (screen: string) => void;
  goBack: () => void;
}

function WelcomeScreen({ navigation }: { navigation: NavigationProp }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20, paddingTop: 80 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>🏥</Text>
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: theme.colors.primary[500],
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Welcome to Recovery+
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: 24,
              paddingHorizontal: 20,
            }}
          >
            Your personalized recovery journey starts here. Let&apos;s learn
            about your needs and create a custom plan just for you.
          </Text>
        </View>

        {/* Features */}
        <View style={{ marginBottom: 40 }}>
          {[
            {
              icon: '🤖',
              title: 'AI-Powered Coaching',
              desc: 'Get personalized exercise recommendations',
            },
            {
              icon: '📊',
              title: 'Progress Tracking',
              desc: 'Monitor your recovery with detailed analytics',
            },
            {
              icon: '💪',
              title: 'Exercise Library',
              desc: 'Access hundreds of recovery exercises',
            },
            {
              icon: '🎯',
              title: 'Custom Plans',
              desc: 'Tailored workouts for your specific needs',
            },
          ].map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>
                {feature.icon}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}
                >
                  {feature.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.text.secondary,
                    lineHeight: 20,
                  }}
                >
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary[500],
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={() => navigation.navigate('Demographics')}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            Get Started
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: 'center', padding: 16 }}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={{ color: theme.colors.text.secondary, fontSize: 16 }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DemographicsScreen({ navigation }: { navigation: NavigationProp }) {
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
          About You
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 30,
            lineHeight: 24,
          }}
        >
          Help us personalize your recovery plan by sharing some basic
          information.
        </Text>

        {/* Age Selection */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Age Range
          </Text>
          {['18-25', '26-35', '36-45', '46-55', '55+'].map(ageRange => (
            <TouchableOpacity
              key={ageRange}
              style={{
                backgroundColor:
                  age === ageRange
                    ? theme.colors.primary[100]
                    : theme.colors.surface,
                padding: 16,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: age === ageRange ? 2 : 1,
                borderColor:
                  age === ageRange
                    ? theme.colors.primary[500]
                    : theme.colors.border,
              }}
              onPress={() => setAge(ageRange)}
            >
              <Text
                style={{
                  fontSize: 16,
                  color:
                    age === ageRange
                      ? theme.colors.primary[700]
                      : theme.colors.text.primary,
                }}
              >
                {ageRange}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Activity Level */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Activity Level
          </Text>
          {[
            {
              id: 'sedentary',
              label: 'Sedentary',
              desc: 'Little to no exercise',
            },
            { id: 'light', label: 'Light', desc: '1-2 days per week' },
            { id: 'moderate', label: 'Moderate', desc: '3-4 days per week' },
            { id: 'active', label: 'Very Active', desc: '5+ days per week' },
          ].map(level => (
            <TouchableOpacity
              key={level.id}
              style={{
                backgroundColor:
                  activityLevel === level.id
                    ? theme.colors.primary[100]
                    : theme.colors.surface,
                padding: 16,
                borderRadius: 8,
                marginBottom: 8,
                borderWidth: activityLevel === level.id ? 2 : 1,
                borderColor:
                  activityLevel === level.id
                    ? theme.colors.primary[500]
                    : theme.colors.border,
              }}
              onPress={() => setActivityLevel(level.id)}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color:
                    activityLevel === level.id
                      ? theme.colors.primary[700]
                      : theme.colors.text.primary,
                  marginBottom: 4,
                }}
              >
                {level.label}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color:
                    activityLevel === level.id
                      ? theme.colors.primary[600]
                      : theme.colors.text.secondary,
                }}
              >
                {level.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor:
              age && activityLevel
                ? theme.colors.primary[500]
                : theme.colors.gray[300],
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={() => {
            if (age && activityLevel) {
              navigation.navigate('BodyAreas');
            } else {
              Alert.alert(
                'Please complete all fields',
                'We need this information to create your personalized plan.'
              );
            }
          }}
          disabled={!age || !activityLevel}
        >
          <Text
            style={{
              color:
                age && activityLevel ? 'white' : theme.colors.text.secondary,
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: 'center', padding: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.text.secondary, fontSize: 16 }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function BodyAreasScreen({ navigation }: { navigation: NavigationProp }) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const bodyAreas = [
    { id: 'neck', label: 'Neck', icon: '🦴' },
    { id: 'shoulders', label: 'Shoulders', icon: '💪' },
    { id: 'back', label: 'Back', icon: '🏃' },
    { id: 'arms', label: 'Arms', icon: '💪' },
    { id: 'core', label: 'Core', icon: '🏋️' },
    { id: 'hips', label: 'Hips', icon: '🦵' },
    { id: 'knees', label: 'Knees', icon: '🦵' },
    { id: 'ankles', label: 'Ankles', icon: '🦶' },
  ];

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
          Problem Areas
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 30,
            lineHeight: 24,
          }}
        >
          Select the areas where you&apos;re experiencing pain or want to focus
          on recovery. You can choose multiple areas.
        </Text>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            marginBottom: 40,
          }}
        >
          {bodyAreas.map(area => (
            <TouchableOpacity
              key={area.id}
              style={{
                width: '48%',
                backgroundColor: selectedAreas.includes(area.id)
                  ? theme.colors.primary[100]
                  : theme.colors.surface,
                padding: 20,
                borderRadius: 12,
                alignItems: 'center',
                marginBottom: 12,
                borderWidth: selectedAreas.includes(area.id) ? 2 : 1,
                borderColor: selectedAreas.includes(area.id)
                  ? theme.colors.primary[500]
                  : theme.colors.border,
              }}
              onPress={() => toggleArea(area.id)}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{area.icon}</Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: selectedAreas.includes(area.id)
                    ? theme.colors.primary[700]
                    : theme.colors.text.primary,
                  textAlign: 'center',
                }}
              >
                {area.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor:
              selectedAreas.length > 0
                ? theme.colors.primary[500]
                : theme.colors.gray[300],
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 16,
          }}
          onPress={() => {
            if (selectedAreas.length > 0) {
              navigation.navigate('Completion');
            } else {
              Alert.alert(
                'Select at least one area',
                'Please choose the areas you want to focus on.'
              );
            }
          }}
          disabled={selectedAreas.length === 0}
        >
          <Text
            style={{
              color:
                selectedAreas.length > 0
                  ? 'white'
                  : theme.colors.text.secondary,
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ alignItems: 'center', padding: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.text.secondary, fontSize: 16 }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CompletionScreen({ navigation }: { navigation: NavigationProp }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20, paddingTop: 80, alignItems: 'center' }}>
        <Text style={{ fontSize: 64, marginBottom: 20 }}>🎉</Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.colors.primary[500],
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          You&apos;re All Set!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 40,
            paddingHorizontal: 20,
          }}
        >
          We&apos;ve created a personalized recovery plan based on your
          responses. Ready to start your journey?
        </Text>

        {/* Plan Summary */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: 12,
            width: '100%',
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Your Plan Includes:
          </Text>

          {[
            '🎯 Personalized exercises for your problem areas',
            '📱 Daily progress tracking',
            '🤖 AI-powered coaching tips',
            '📊 Weekly progress reports',
          ].map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, lineHeight: 24 }}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary[500],
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            width: '100%',
            marginBottom: 16,
          }}
          onPress={() => navigation.navigate('MainApp')}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            Start My Recovery Journey
          </Text>
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.primary[700],
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            💡 Tip: You can always adjust your preferences and goals in the
            Profile section later.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Home Screen with Recovery+ content
function HomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: theme.colors.primary[500],
            marginBottom: 10,
          }}
        >
          Welcome to Recovery+
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.text.secondary,
            marginBottom: 30,
            lineHeight: 24,
          }}
        >
          Your personalized recovery journey starts here. Get AI-powered
          guidance, track your progress, and access premium features.
        </Text>

        {/* Daily Progress Card */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
            Today&apos;s Progress
          </Text>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: theme.colors.primary[500],
                }}
              >
                3
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.colors.text.secondary }}
              >
                Exercises
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: theme.colors.success[500],
                }}
              >
                45
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.colors.text.secondary }}
              >
                Minutes
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: theme.colors.warning[500],
                }}
              >
                8/10
              </Text>
              <Text
                style={{ fontSize: 12, color: theme.colors.text.secondary }}
              >
                Pain Level
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
            Quick Actions
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary[500],
              padding: 15,
              borderRadius: 8,
              marginBottom: 10,
            }}
            onPress={() => {
              Alert.alert(
                'Start Exercises',
                'Exercise functionality is now available! Try using the AI Coach in the "Coach" tab to get personalized exercise recommendations.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <Text
              style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}
            >
              Start Today&apos;s Exercises
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              padding: 15,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <Text
              style={{
                color: theme.colors.text.primary,
                textAlign: 'center',
                fontWeight: '600',
              }}
            >
              Track Pain Level
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Progress Screen
function ProgressScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Your Progress
        </Text>

        {/* Weekly Stats */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 15 }}>
            This Week
          </Text>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-around' }}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: theme.colors.primary[500],
                }}
              >
                12
              </Text>
              <Text style={{ color: theme.colors.text.secondary }}>
                Sessions
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: theme.colors.success[500],
                }}
              >
                4.2
              </Text>
              <Text style={{ color: theme.colors.text.secondary }}>
                Avg Hours
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: theme.colors.warning[500],
                }}
              >
                -15%
              </Text>
              <Text style={{ color: theme.colors.text.secondary }}>
                Pain Level
              </Text>
            </View>
          </View>
        </View>

        {/* Premium Analytics Teaser */}
        <View
          style={{
            backgroundColor: theme.colors.primary[50],
            padding: 20,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.primary[200],
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 10 }}>⭐</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme.colors.primary[700],
              marginBottom: 8,
            }}
          >
            Advanced Analytics
          </Text>
          <Text
            style={{
              textAlign: 'center',
              color: theme.colors.primary[600],
              marginBottom: 15,
              lineHeight: 20,
            }}
          >
            Get detailed insights, trends, and AI-powered recommendations with
            Premium.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary[500],
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Upgrade to Premium
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Profile Screen
function ProfileScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          Profile
        </Text>

        {/* User Info */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary[100],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 15,
            }}
          >
            <Text style={{ fontSize: 32, color: theme.colors.primary[500] }}>
              👤
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 5 }}>
            Recovery User
          </Text>
          <Text style={{ color: theme.colors.text.secondary }}>
            Free Plan • 3/5 exercises used this week
          </Text>
        </View>

        {/* Subscription Section */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary[500],
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Upgrade to Premium
          </Text>
          <Text
            style={{
              color: 'white',
              opacity: 0.9,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Unlock unlimited exercises, AI coaching, and advanced analytics
          </Text>
        </TouchableOpacity>

        {/* Menu Items */}
        {[
          '⚙️ Settings',
          '📊 Usage Statistics',
          '🎯 Goals & Preferences',
          '💬 Support',
          '📄 Privacy Policy',
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            style={{
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 8,
              marginBottom: 8,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16 }}>{item}</Text>
            <Text style={{ color: theme.colors.text.secondary, fontSize: 18 }}>
              ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Exercises"
        component={ProperExercisesScreen}
        options={{
          tabBarLabel: 'Exercises',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>💪</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatTabScreenWrapper}
        options={{
          tabBarLabel: 'Coach',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🤖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App with Stack Navigator for modals
function MainAppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreenWrapper}
        options={{
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="ExerciseSession"
        component={ExerciseSessionScreenWrapper}
        options={{
          presentation: 'fullScreenModal',
        }}
      />
    </Stack.Navigator>
  );
}

// Onboarding Flow
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Demographics" component={DemographicsScreen} />
      <Stack.Screen name="BodyAreas" component={BodyAreasScreen} />
      <Stack.Screen name="Completion" component={CompletionScreen} />
      <Stack.Screen name="MainApp" component={MainAppStack} />
    </Stack.Navigator>
  );
}

// App Root - determines whether to show onboarding or main app
function AppRoot() {
  const [isFirstTime] = useState(true); // In real app, this would check AsyncStorage

  useEffect(() => {
    // In a real app, you'd check AsyncStorage to see if user has completed onboarding
    // For demo, we'll always show onboarding first
  }, []);

  if (isFirstTime) {
    return <OnboardingStack />;
  }

  return <MainAppStack />;
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <AppRoot />
    </NavigationContainer>
  );
}
