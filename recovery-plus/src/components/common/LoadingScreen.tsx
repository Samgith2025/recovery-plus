import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <ActivityIndicator
        size="large"
        color={theme.colors.primary[500]}
        style={{ marginBottom: 16 }}
      />
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.text.secondary,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
};
