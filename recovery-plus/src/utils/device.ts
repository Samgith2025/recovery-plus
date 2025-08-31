// Device and platform utilities

import { Dimensions, Platform, StatusBar } from 'react-native';

// Screen dimensions
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  const screenWidth = Dimensions.get('screen').width;
  const screenHeight = Dimensions.get('screen').height;

  return {
    window: { width, height },
    screen: { width: screenWidth, height: screenHeight },
    isLandscape: width > height,
    isPortrait: height > width,
  };
};

// Status bar height
export const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
};

// Safe area calculations
export const getSafeAreaInsets = () => {
  const dimensions = getScreenDimensions();
  const statusBarHeight = getStatusBarHeight();

  // Basic safe area calculation (for more accurate values, use react-native-safe-area-context)
  return {
    top: statusBarHeight,
    bottom: Platform.OS === 'ios' && dimensions.screen.height >= 812 ? 34 : 0,
    left: 0,
    right: 0,
  };
};

// Device type detection
export const getDeviceType = () => {
  const { width, height } = getScreenDimensions().window;
  const aspectRatio = height / width;

  if (Platform.OS === 'ios') {
    if (Platform.isPad) {
      return 'tablet';
    }

    // iPhone detection based on screen size
    if (width >= 414) return 'large-phone'; // iPhone Plus/Pro Max
    if (width >= 390) return 'medium-phone'; // iPhone 12/13/14
    if (width >= 375) return 'phone'; // iPhone 6/7/8/X/11
    return 'small-phone'; // iPhone SE
  }

  // Android device detection
  if (width >= 600 || (width >= 500 && aspectRatio < 1.6)) {
    return 'tablet';
  }

  if (width >= 400) return 'large-phone';
  if (width >= 360) return 'phone';
  return 'small-phone';
};

// Platform utilities
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// iOS version detection
export const getIOSVersion = () => {
  if (!isIOS) return null;
  return Platform.Version as string;
};

// Android API level
export const getAndroidAPILevel = () => {
  if (!isAndroid) return null;
  return Platform.Version as number;
};

// Device capabilities
export const getDeviceCapabilities = () => {
  const deviceType = getDeviceType();
  const dimensions = getScreenDimensions();

  return {
    deviceType,
    hasNotch: isIOS && dimensions.screen.height >= 812,
    supportsHaptics: isIOS || (isAndroid && getAndroidAPILevel()! >= 26),
    supportsBiometrics: isIOS || isAndroid, // Simplified - would need actual biometric detection
    supportsDeepLinking: !isWeb,
    supportsBackgroundTasks: !isWeb,
    supportsCamera: !isWeb,
    supportsLocation: !isWeb,
  };
};

// Responsive breakpoints (similar to Tailwind CSS)
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Check if screen size matches breakpoint
export const matchesBreakpoint = (breakpoint: keyof typeof breakpoints) => {
  const { width } = getScreenDimensions().window;
  return width >= breakpoints[breakpoint];
};

// Responsive value helper
export const getResponsiveValue = <T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}): T => {
  const { width } = getScreenDimensions().window;

  if (width >= breakpoints['2xl'] && values['2xl'] !== undefined)
    return values['2xl'];
  if (width >= breakpoints.xl && values.xl !== undefined) return values.xl;
  if (width >= breakpoints.lg && values.lg !== undefined) return values.lg;
  if (width >= breakpoints.md && values.md !== undefined) return values.md;
  if (width >= breakpoints.sm && values.sm !== undefined) return values.sm;

  return values.base;
};

// Font scaling based on device
export const getFontScale = () => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case 'small-phone':
      return 0.9;
    case 'phone':
      return 1.0;
    case 'medium-phone':
      return 1.05;
    case 'large-phone':
      return 1.1;
    case 'tablet':
      return 1.2;
    default:
      return 1.0;
  }
};

// Spacing scale based on device
export const getSpacingScale = () => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case 'small-phone':
      return 0.9;
    case 'phone':
      return 1.0;
    case 'medium-phone':
    case 'large-phone':
      return 1.0;
    case 'tablet':
      return 1.2;
    default:
      return 1.0;
  }
};

// Check if device has enough performance for complex animations
export const hasHighPerformance = () => {
  // Simplified performance detection
  if (isIOS) {
    const version = getIOSVersion();
    return version ? parseFloat(version) >= 13 : true;
  }

  if (isAndroid) {
    const apiLevel = getAndroidAPILevel();
    return apiLevel ? apiLevel >= 26 : true; // Android 8.0+
  }

  return true; // Assume web has good performance
};
