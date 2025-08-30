// Configuration service for environment variables and app settings

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  clerk: {
    publishableKey: string;
  };
  openai: {
    apiKey: string;
  };
  app: {
    environment: 'development' | 'staging' | 'production';
    apiUrl: string;
  };
}

const getConfig = (): AppConfig => {
  const config: AppConfig = {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
    clerk: {
      publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    },
    openai: {
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    },
    app: {
      environment: (process.env.EXPO_PUBLIC_APP_ENV as any) || 'development',
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    },
  };

  return config;
};

export const config = getConfig();

// Validation helpers
export const validateConfig = () => {
  const missingKeys: string[] = [];

  if (!config.supabase.url) missingKeys.push('EXPO_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey)
    missingKeys.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  if (!config.clerk.publishableKey)
    missingKeys.push('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  if (!config.openai.apiKey) missingKeys.push('EXPO_PUBLIC_OPENAI_API_KEY');

  if (missingKeys.length > 0) {
    console.warn('Missing environment variables:', missingKeys);
    return {
      isValid: false,
      missingKeys,
    };
  }

  return {
    isValid: true,
    missingKeys: [],
  };
};

export const isProductionMode = () => config.app.environment === 'production';
export const isDevelopmentMode = () => config.app.environment === 'development';
