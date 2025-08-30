import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { theme } from '../../styles/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { SCREEN_NAMES } from '../../navigation/types';

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignUp'
>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { signIn: storeSignIn, setIsLoading } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;

    try {
      setLoading(true);
      setIsLoading(true);

      const completeSignUp = await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });

        // Update app store with user info
        storeSignIn({
          id: completeSignUp.createdUserId || '',
          email: email,
          firstName,
          lastName,
          createdAt: new Date().toISOString(),
        });
      } else if (completeSignUp.status === 'missing_requirements') {
        // Handle email verification if required
        Alert.alert(
          'Verification Required',
          'Please check your email to verify your account.'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Sign Up Error',
        error.errors?.[0]?.message || 'Failed to sign up'
      );
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate(SCREEN_NAMES.SIGN_IN);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Recovery+
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Start your recovery journey today
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              First Name
            </Text>
            <TextInput
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                fontSize: 16,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
              placeholder="First name"
              placeholderTextColor={theme.colors.text.muted}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text.primary,
                marginBottom: 8,
              }}
            >
              Last Name
            </Text>
            <TextInput
              style={{
                height: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                fontSize: 16,
                color: theme.colors.text.primary,
                backgroundColor: theme.colors.surface,
              }}
              placeholder="Last name"
              placeholderTextColor={theme.colors.text.muted}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Email
          </Text>
          <TextInput
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 8,
              paddingHorizontal: 16,
              fontSize: 16,
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.surface,
            }}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.text.muted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Password
          </Text>
          <TextInput
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: 8,
              paddingHorizontal: 16,
              fontSize: 16,
              color: theme.colors.text.primary,
              backgroundColor: theme.colors.surface,
            }}
            placeholder="Create a password"
            placeholderTextColor={theme.colors.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.text.muted,
              marginTop: 4,
            }}
          >
            Password must be at least 8 characters long
          </Text>
        </View>

        <Button
          onPress={handleSignUp}
          disabled={loading || !email || !password || !firstName || !lastName}
          style={{ marginBottom: 16 }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text.secondary,
            }}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.primary,
                fontWeight: '600',
              }}
            >
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
