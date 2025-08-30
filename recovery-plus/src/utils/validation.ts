// Validation utilities for forms and data

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => ValidationResult;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      error:
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }

  return { isValid: true };
};

// Name validation
export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name must be less than 50 characters' };
  }

  return { isValid: true };
};

// Pain level validation (1-10 scale)
export const validatePainLevel = (level: number): ValidationResult => {
  if (level === undefined || level === null) {
    return { isValid: false, error: 'Pain level is required' };
  }

  if (level < 1 || level > 10) {
    return { isValid: false, error: 'Pain level must be between 1 and 10' };
  }

  return { isValid: true };
};

// Generic field validation
export const validateField = (
  value: any,
  rules: ValidationRule
): ValidationResult => {
  // Required check
  if (
    rules.required &&
    (!value || (typeof value === 'string' && !value.trim()))
  ) {
    return { isValid: false, error: 'This field is required' };
  }

  // Skip other validations if not required and empty
  if (
    !rules.required &&
    (!value || (typeof value === 'string' && !value.trim()))
  ) {
    return { isValid: true };
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return {
        isValid: false,
        error: `Must be at least ${rules.minLength} characters long`,
      };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        isValid: false,
        error: `Must be less than ${rules.maxLength} characters`,
      };
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Invalid format' };
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return { isValid: true };
};

// Form validation helper
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.keys(rules).forEach(field => {
    const result = validateField(data[field], rules[field]);
    if (!result.isValid) {
      errors[field] = result.error || 'Invalid value';
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Questionnaire response validation
export const validateQuestionnaireResponse = (
  response: Record<string, unknown>
): ValidationResult => {
  const requiredFields = [
    'painAreas',
    'painLevel',
    'onsetDate',
    'activityLevel',
  ];

  for (const field of requiredFields) {
    if (!response[field]) {
      return {
        isValid: false,
        error: `${field} is required to continue`,
      };
    }
  }

  // Validate pain level
  if (typeof response.painLevel === 'number') {
    const painValidation = validatePainLevel(response.painLevel);
    if (!painValidation.isValid) {
      return painValidation;
    }
  }

  return { isValid: true };
};
