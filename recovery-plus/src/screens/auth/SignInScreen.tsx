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
import { useSignIn } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../../store';
import { Button } from '../../components/ui/Button';
import { theme } from '../../styles/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { SCREEN_NAMES } from '../../navigation/types';
import { toastService } from '../../services/toast';

type SignInScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignIn'
>;

export const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signIn: storeSignIn, setIsLoading } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);
      setIsLoading(true);

      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });

        // Update app store with user info
        storeSignIn({
          id: completeSignIn.createdUserId || '',
          email: email,
          firstName: '',
          lastName: '',
          createdAt: new Date().toISOString(),
        });

        toastService.success('Welcome back!', 'Sign In Successful');
      }
    } catch (error: any) {
      toastService.error(
        error.errors?.[0]?.message || 'Failed to sign in',
        'Sign In Error'
      );
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate(SCREEN_NAMES.SIGN_UP);
  };

  const handleForgotPassword = () => {
    navigation.navigate(SCREEN_NAMES.FORGOT_PASSWORD);
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
            Your personal injury recovery companion
          </Text>
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
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={{ alignSelf: 'flex-end', marginBottom: 24 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.primary,
              fontWeight: '500',
            }}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <Button
          onPress={handleSignIn}
          disabled={loading || !email || !password}
          style={{ marginBottom: 16 }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
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
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.primary,
                fontWeight: '600',
              }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
