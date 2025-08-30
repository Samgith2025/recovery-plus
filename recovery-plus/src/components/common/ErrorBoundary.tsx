import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent } = this.props;
      const { error } = this.state;

      if (FallbackComponent && error) {
        return <FallbackComponent error={error} retry={this.handleRetry} />;
      }

      return <DefaultErrorFallback error={error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  onRetry,
}) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing[6],
        backgroundColor: theme.colors.background,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          marginBottom: theme.spacing[6],
        }}
      >
        <Ionicons
          name="warning-outline"
          size={64}
          color={theme.colors.error[500]}
        />
      </View>

      <Text
        style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          textAlign: 'center',
          marginBottom: theme.spacing[2],
        }}
      >
        Oops! Something went wrong
      </Text>

      <Text
        style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.secondary,
          textAlign: 'center',
          marginBottom: theme.spacing[6],
          lineHeight: theme.typography.lineHeight.relaxed,
        }}
      >
        We're sorry for the inconvenience. The app encountered an unexpected
        error.
      </Text>

      {false && error && (
        <View
          style={{
            backgroundColor: theme.colors.gray[100],
            padding: theme.spacing[4],
            borderRadius: theme.borderRadius.lg,
            marginBottom: theme.spacing[6],
            width: '100%',
          }}
        >
          <Text
            style={{
              fontSize: theme.typography.fontSize.sm,
              fontFamily: 'monospace',
              color: theme.colors.gray[700],
            }}
          >
            {error?.message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onRetry}
        style={{
          backgroundColor: theme.colors.primary[500],
          paddingHorizontal: theme.spacing[6],
          paddingVertical: theme.spacing[3],
          borderRadius: theme.borderRadius.lg,
        }}
      >
        <Text
          style={{
            color: theme.colors.surface,
            fontWeight: theme.typography.fontWeight.semibold,
            textAlign: 'center',
          }}
        >
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};
