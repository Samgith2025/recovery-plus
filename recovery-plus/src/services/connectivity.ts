// Service connectivity testing
import { config } from './config';
import { supabase } from './supabase';
import { aiService } from './openai';

export interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'not_configured';
  message: string;
  details?: any;
}

export const testServiceConnectivity = async (): Promise<ServiceStatus[]> => {
  const results: ServiceStatus[] = [];

  // Test Supabase connection
  if (config.supabase.url && config.supabase.anonKey) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (
        error &&
        !error.message.includes('relation "user_profiles" does not exist')
      ) {
        throw error;
      }

      results.push({
        name: 'Supabase',
        status: 'connected',
        message: 'Successfully connected to Supabase',
        details: { tablesAccessible: !error },
      });
    } catch (error: any) {
      results.push({
        name: 'Supabase',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: { error: error.message },
      });
    }
  } else {
    results.push({
      name: 'Supabase',
      status: 'not_configured',
      message: 'Supabase credentials not configured',
    });
  }

  // Test OpenAI connection
  if (config.openai.apiKey) {
    try {
      const response = await aiService.generateCoachingResponse([
        { role: 'user', content: 'Test connection' },
      ]);

      results.push({
        name: 'OpenAI',
        status: response.success ? 'connected' : 'error',
        message: response.success
          ? 'Successfully connected to OpenAI'
          : 'OpenAI connection test failed',
        details: response,
      });
    } catch (error: any) {
      results.push({
        name: 'OpenAI',
        status: 'error',
        message: 'Failed to connect to OpenAI',
        details: { error: error.message },
      });
    }
  } else {
    results.push({
      name: 'OpenAI',
      status: 'not_configured',
      message: 'OpenAI API key not configured',
    });
  }

  // Test Clerk configuration (basic check)
  if (config.clerk.publishableKey) {
    results.push({
      name: 'Clerk',
      status: 'connected',
      message: 'Clerk publishable key is configured',
      details: { keyLength: config.clerk.publishableKey.length },
    });
  } else {
    results.push({
      name: 'Clerk',
      status: 'not_configured',
      message: 'Clerk publishable key not configured',
    });
  }

  return results;
};

export const getServiceSummary = (results: ServiceStatus[]) => {
  const connected = results.filter(r => r.status === 'connected').length;
  const total = results.length;
  const hasErrors = results.some(r => r.status === 'error');
  const notConfigured = results.filter(
    r => r.status === 'not_configured'
  ).length;

  return {
    connected,
    total,
    hasErrors,
    notConfigured,
    isFullyConfigured: connected === total,
    summary: `${connected}/${total} services connected${notConfigured > 0 ? `, ${notConfigured} not configured` : ''}${hasErrors ? ', some errors detected' : ''}`,
  };
};
