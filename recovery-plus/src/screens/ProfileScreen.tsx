import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { theme } from '../styles/theme';
import { useAppStore } from '../store';
import { useExerciseStore } from '../store/exercise';
import { getSafeAreaInsets, getDeviceType } from '../utils/device';
import { authLogger } from '../services/logger';

interface ProfileScreenProps {
  onSignOutPress: () => void;
  onPreferencesPress: () => void;
  onBackPress?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onSignOutPress,
  onPreferencesPress,
  onBackPress,
}) => {
  const safeArea = getSafeAreaInsets();
  const deviceType = getDeviceType();
  const isTablet = deviceType === 'tablet';

  const { user, signOut } = useAppStore();
  const { sessionHistory } = useExerciseStore();

  // Calculate user stats
  const totalWorkouts = sessionHistory.length;
  const totalMinutes = sessionHistory.reduce(
    (total, session) => total + (session.duration || 0),
    0
  );
  const currentStreak = calculateCurrentStreak();

  function calculateCurrentStreak(): number {
    if (sessionHistory.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const sortedSessions = [...sessionHistory].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const session of sortedSessions) {
      const sessionDate = new Date(session.createdAt);
      const daysDiff = Math.floor(
        (today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          authLogger.info('User initiated sign out');
          signOut();
          onSignOutPress();
        },
      },
    ]);
  };

  const StatItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text
        style={{
          fontSize: isTablet
            ? theme.typography.fontSize['3xl']
            : theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          marginBottom: theme.spacing[1],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    variant = 'default',
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    variant?: 'default' | 'destructive';
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[4],
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing[3],
        elevation: 1,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor:
            variant === 'destructive'
              ? theme.colors.error[100]
              : theme.colors.gray[100],
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: theme.spacing[3],
        }}
      >
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            color:
              variant === 'destructive'
                ? theme.colors.error[600]
                : theme.colors.text.primary,
            marginBottom: subtitle ? 2 : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.secondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <Text
        style={{
          fontSize: 16,
          color: theme.colors.text.tertiary,
        }}
      >
        →
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: safeArea.top + theme.spacing[4],
          paddingHorizontal: theme.spacing[4],
          paddingBottom: theme.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text
          style={{
            fontSize: theme.typography.fontSize['2xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            textAlign: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          Profile
        </Text>

        {/* User Info */}
        <View
          style={{
            alignItems: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          {/* Avatar */}
          <View
            style={{
              width: isTablet ? 120 : 80,
              height: isTablet ? 120 : 80,
              borderRadius: isTablet ? 60 : 40,
              backgroundColor: theme.colors.primary[500],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing[4],
              elevation: 4,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: isTablet ? 48 : 32,
                color: theme.colors.surface,
              }}
            >
              👤
            </Text>
          </View>

          {/* Name and Email */}
          <Text
            style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[1],
            }}
          >
            {user?.firstName || 'User'}
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.text.secondary,
            }}
          >
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {/* Fitness Stats */}
        <View
          style={{
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing[5],
            marginBottom: theme.spacing[6],
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
              textAlign: 'center',
            }}
          >
            Fitness Stats
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <StatItem label="Workouts" value={totalWorkouts} />
            <StatItem label="Minutes" value={Math.round(totalMinutes)} />
            <StatItem label="Streak" value={currentStreak} />
          </View>
        </View>

        {/* Settings Section */}
        <View>
          <Text
            style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing[4],
            }}
          >
            Settings
          </Text>

          <SettingItem
            icon="⚙️"
            title="Preferences"
            subtitle="Customize your app experience"
            onPress={onPreferencesPress}
          />

          <SettingItem
            icon="📊"
            title="Data & Privacy"
            subtitle="Manage your data and privacy settings"
            onPress={() => {
              // TODO: Navigate to data & privacy screen
              Alert.alert(
                'Coming Soon',
                'Data & Privacy settings will be available in a future update.'
              );
            }}
          />

          <SettingItem
            icon="❓"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {
              // TODO: Navigate to help screen
              Alert.alert(
                'Coming Soon',
                'Help & Support will be available in a future update.'
              );
            }}
          />

          <SettingItem
            icon="ℹ️"
            title="About"
            subtitle="App version and information"
            onPress={() => {
              Alert.alert(
                'About Recovery+',
                'Recovery+ v1.0.0\n\nYour personal AI fitness coach for injury recovery and pain management.',
                [{ text: 'OK' }]
              );
            }}
          />

          <SettingItem
            icon="↗️"
            title="Sign Out"
            onPress={handleSignOut}
            variant="destructive"
          />
        </View>

        {/* App Info */}
        <View
          style={{
            alignItems: 'center',
            marginTop: theme.spacing[6],
            paddingTop: theme.spacing[4],
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
            }}
          >
            Recovery+ v1.0.0
          </Text>
          <Text
            style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
              marginTop: theme.spacing[1],
            }}
          >
            Made with ❤️ for your health journey
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
