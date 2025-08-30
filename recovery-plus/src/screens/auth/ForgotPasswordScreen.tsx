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
import { Button } from '../../components/ui/Button';
import { theme } from '../../styles/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { SCREEN_NAMES } from '../../navigation/types';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!isLoaded || !signIn) return;

    try {
      setLoading(true);

      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Please check your email for instructions to reset your password.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.errors?.[0]?.message || 'Failed to send reset email'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate(SCREEN_NAMES.SIGN_IN);
  };

  if (emailSent) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Check Your Email
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            We&apos;ve sent password reset instructions to {email}
          </Text>
        </View>

        <Button onPress={handleBackToSignIn} variant="outline">
          Back to Sign In
        </Button>
      </View>
    );
  }

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
        <TouchableOpacity
          onPress={handleBackToSignIn}
          style={{ alignSelf: 'flex-start', marginBottom: 20 }}
        >
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.primary,
              fontWeight: '500',
            }}
          >
            ← Back to Sign In
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: theme.colors.text.primary,
              marginBottom: 8,
            }}
          >
            Reset Password
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: theme.colors.text.secondary,
              textAlign: 'center',
            }}
          >
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
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

        <Button
          onPress={handleForgotPassword}
          disabled={loading || !email}
          style={{ marginBottom: 16 }}
        >
          {loading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
