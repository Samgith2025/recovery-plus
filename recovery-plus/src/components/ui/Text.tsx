import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { theme } from '../../styles/theme';

export interface TextProps extends RNTextProps {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'h5'
    | 'h6'
    | 'body'
    | 'caption'
    | 'overline';
  color?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'disabled'
    | 'error'
    | 'success'
    | 'warning';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'heavy';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const variantStyles = {
  h1: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.tight,
  },
  h2: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.tight,
  },
  h3: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.snug,
  },
  h4: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.snug,
  },
  h5: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.normal,
  },
  h6: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.normal,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.normal,
  },
  caption: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.normal,
    lineHeight: theme.typography.lineHeight.normal,
  },
  overline: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    lineHeight: theme.typography.lineHeight.normal,
    textTransform: 'uppercase' as const,
  },
};

const colorStyles = {
  primary: { color: theme.colors.text.primary },
  secondary: { color: theme.colors.text.secondary },
  tertiary: { color: theme.colors.text.tertiary },
  disabled: { color: theme.colors.text.disabled },
  error: { color: theme.colors.error[500] },
  success: { color: theme.colors.success[500] },
  warning: { color: theme.colors.warning[500] },
};

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  className,
  style,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const colorStyle = colorStyles[color];

  const computedStyle = [
    {
      fontFamily: theme.typography.fontFamily.sans[0],
      ...variantStyle,
      ...colorStyle,
    },
    weight && { fontWeight: theme.typography.fontWeight[weight] },
    align && { textAlign: align },
    style,
  ];

  return <RNText style={computedStyle} className={className} {...props} />;
};
