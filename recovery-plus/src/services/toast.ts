import { Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export const toastService = {
  /**
   * Show a success toast
   */
  success: (message: string, title?: string) => {
    Alert.alert(title || 'Success', message);
  },

  /**
   * Show an error toast
   */
  error: (message: string, title?: string) => {
    Alert.alert(title || 'Error', message);
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, title?: string) => {
    Alert.alert(title || 'Warning', message);
  },

  /**
   * Show an info toast
   */
  info: (message: string, title?: string) => {
    Alert.alert(title || 'Info', message);
  },

  /**
   * Show a generic toast
   */
  show: ({ title, message, type = 'info' }: ToastOptions) => {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Info',
    };

    Alert.alert(title || titles[type], message);
  },

  /**
   * Show a confirmation dialog
   */
  confirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    Alert.alert(title || 'Confirm', message, [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'OK',
        onPress: onConfirm,
      },
    ]);
  },
};
