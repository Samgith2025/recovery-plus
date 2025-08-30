import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import { Text } from './Text';
import { theme } from '../../styles/theme';

export interface ButtonProps extends TouchableOpacityProps {
  title?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'base' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles = {
  primary: {
    backgroundColor: theme.colors.primary[500],
    borderColor: theme.colors.primary[500],
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: theme.colors.secondary[500],
    borderColor: theme.colors.secondary[500],
    borderWidth: 1,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary[500],
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  danger: {
    backgroundColor: theme.colors.error[500],
    borderColor: theme.colors.error[500],
    borderWidth: 1,
  },
};

const variantTextColors = {
  primary: theme.colors.surface,
  secondary: theme.colors.surface,
  outline: theme.colors.primary[500],
  ghost: theme.colors.primary[500],
  danger: theme.colors.surface,
};

const sizeStyles = {
  sm: {
    height: theme.sizes.button.sm.height,
    paddingHorizontal: theme.sizes.button.sm.paddingHorizontal,
    borderRadius: theme.borderRadius.base,
  },
  base: {
    height: theme.sizes.button.base.height,
    paddingHorizontal: theme.sizes.button.base.paddingHorizontal,
    borderRadius: theme.borderRadius.md,
  },
  lg: {
    height: theme.sizes.button.lg.height,
    paddingHorizontal: theme.sizes.button.lg.paddingHorizontal,
    borderRadius: theme.borderRadius.lg,
  },
};

const textSizes = {
  sm: theme.typography.fontSize.sm,
  base: theme.typography.fontSize.base,
  lg: theme.typography.fontSize.lg,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  variant = 'primary',
  size = 'base',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  style,
  ...props
}) => {
  const buttonStyle = [
    {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      opacity: disabled ? 0.6 : 1,
    },
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && { width: '100%' as const },
    style,
  ].filter(Boolean);

  const textColor = variantTextColors[variant];
  const fontSize = textSizes[size];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={className}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon && (
            <Text style={{ marginRight: theme.spacing[2] }}>{leftIcon}</Text>
          )}

          {children ? (
            children
          ) : (
            <Text
              style={{
                color: textColor,
                fontSize,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              {title}
            </Text>
          )}

          {rightIcon && (
            <Text style={{ marginLeft: theme.spacing[2] }}>{rightIcon}</Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};
