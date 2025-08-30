// Theme configuration for consistent styling

export const theme = {
  colors: {
    // Primary brand colors (Deep Purple/Indigo)
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1', // Main brand color (matches your purple)
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },

    // Secondary colors (Bright Magenta/Pink for selections)
    secondary: {
      50: '#FFF0F8',
      100: '#FFE4F1',
      200: '#FFCCE5',
      300: '#FFA8D8',
      400: '#FF7AC7',
      500: '#E91E63', // Bright pink for selections
      600: '#D1477A',
      700: '#B91C1C',
      800: '#991B1B',
      900: '#7F1D1D',
    },

    // Success colors
    success: {
      50: '#E6F7EA',
      100: '#B3E6C0',
      200: '#80D596',
      300: '#4DC46C',
      400: '#1AB342',
      500: '#34C759',
      600: '#28A745',
      700: '#1E7E34',
      800: '#155724',
      900: '#0B2E13',
    },

    // Warning colors
    warning: {
      50: '#FFF5E6',
      100: '#FFE1B3',
      200: '#FFCD80',
      300: '#FFB94D',
      400: '#FFA51A',
      500: '#FF9500',
      600: '#E6850E',
      700: '#CC750C',
      800: '#B3650A',
      900: '#995508',
    },

    // Error colors
    error: {
      50: '#FFE6E6',
      100: '#FFB3B3',
      200: '#FF8080',
      300: '#FF4D4D',
      400: '#FF1A1A',
      500: '#FF3B30',
      600: '#E6342A',
      700: '#CC2E24',
      800: '#B3271E',
      900: '#992018',
    },

    // Neutral colors
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // iOS system colors
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: {
      primary: '#1C1C1E',
      secondary: '#8E8E93',
      tertiary: '#C7C7CC',
      disabled: '#D1D1D6',
      muted: '#8E8E93',
    },

    // Common colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Semantic colors
    info: '#007AFF',
    link: '#007AFF',
    border: '#C6C6C8',
    separator: '#E5E5E7',
    overlay: 'rgba(0, 0, 0, 0.4)',
  },

  // Typography scale
  typography: {
    // Font families
    fontFamily: {
      sans: ['SF Pro Display', 'system-ui', 'sans-serif'],
      mono: ['SF Mono', 'Menlo', 'monospace'],
    },

    // Font sizes (following iOS Human Interface Guidelines)
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 17,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 34,
      '5xl': 40,
      '6xl': 48,
    },

    // Font weights
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },

    // Line heights
    lineHeight: {
      none: 1,
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 2,
    },
  },

  // Spacing scale (following iOS 8-point grid system)
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
    32: 128,
    40: 160,
    48: 192,
    56: 224,
    64: 256,
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
  },

  // Shadows (iOS style)
  shadow: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  // Component sizes
  sizes: {
    button: {
      sm: { height: 32, paddingHorizontal: 12 },
      base: { height: 44, paddingHorizontal: 16 },
      lg: { height: 56, paddingHorizontal: 20 },
    },
    input: {
      sm: { height: 32 },
      base: { height: 44 },
      lg: { height: 56 },
    },
    icon: {
      xs: 12,
      sm: 16,
      base: 20,
      md: 24,
      lg: 32,
      xl: 40,
    },
  },

  // Animation durations
  animation: {
    duration: {
      fast: 150,
      normal: 250,
      slow: 350,
      slower: 500,
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    },
  },

  // Breakpoints for responsive design
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
} as const;

export type Theme = typeof theme;

// Helper function to get theme values
export const getThemeValue = (path: string): any => {
  return path
    .split('.')
    .reduce((obj, key) => (obj as any)?.[key], theme as any);
};

// Responsive helpers
export const responsive = {
  // Get value based on screen size
  value: <T>(values: {
    base: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    '2xl'?: T;
  }): T => {
    // This would be implemented with actual screen size detection
    // For now, return base value
    return values.base;
  },

  // Media query helpers for web
  above: (breakpoint: keyof typeof theme.breakpoints) =>
    `@media (min-width: ${theme.breakpoints[breakpoint]}px)`,

  below: (breakpoint: keyof typeof theme.breakpoints) =>
    `@media (max-width: ${theme.breakpoints[breakpoint] - 1}px)`,

  between: (
    min: keyof typeof theme.breakpoints,
    max: keyof typeof theme.breakpoints
  ) =>
    `@media (min-width: ${theme.breakpoints[min]}px) and (max-width: ${theme.breakpoints[max] - 1}px)`,
};
