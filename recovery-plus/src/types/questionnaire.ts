// Questionnaire Types - Designed for easy editing and configuration

export type QuestionType =
  | 'multiple_choice'
  | 'single_choice'
  | 'scale'
  | 'text'
  | 'number'
  | 'body_areas'
  | 'boolean'
  | 'pain_scale'
  | 'demographics';

export interface QuestionOption {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  icon?: string;
}

export interface ConditionalLogic {
  /** Question ID this logic depends on */
  dependsOn: string;
  /** Condition to evaluate */
  condition:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'in_array';
  /** Value(s) to compare against */
  value: string | number | string[] | number[];
  /** Action to take when condition is met */
  action: 'show' | 'hide' | 'skip' | 'require';
}

export interface ValidationRule {
  type:
    | 'required'
    | 'min_length'
    | 'max_length'
    | 'min_value'
    | 'max_value'
    | 'email'
    | 'custom';
  value?: number | string;
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface Question {
  /** Unique question identifier */
  id: string;

  /** Type of question */
  type: QuestionType;

  /** Main question text */
  title: string;

  /** Optional subtitle/description */
  subtitle?: string;

  /** Help text or instructions */
  helpText?: string;

  /** Whether this question is required */
  required?: boolean;

  /** Options for choice-based questions */
  options?: QuestionOption[];

  /** For scale questions: min, max, and step */
  scale?: {
    min: number;
    max: number;
    step?: number;
    minLabel?: string;
    maxLabel?: string;
  };

  /** Validation rules */
  validation?: ValidationRule[];

  /** Conditional logic */
  conditionalLogic?: ConditionalLogic[];

  /** Default value */
  defaultValue?: any;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  /** Whether this section can be skipped */
  optional?: boolean;
}

export interface QuestionnaireConfig {
  /** Unique questionnaire identifier */
  id: string;

  /** Questionnaire name/title */
  title: string;

  /** Description */
  description?: string;

  /** Version for config management */
  version: string;

  /** Organized sections */
  sections: QuestionnaireSection[];

  /** Global settings */
  settings: {
    /** Allow going back to previous questions */
    allowBack?: boolean;
    /** Show progress indicator */
    showProgress?: boolean;
    /** Auto-save responses */
    autoSave?: boolean;
    /** Completion message */
    completionMessage?: string;
  };

  /** Metadata */
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    lastModified?: string;
    tags?: string[];
  };
}

export interface QuestionnaireResponse {
  questionId: string;
  value: any;
  timestamp?: string;
}

export interface QuestionnaireSession {
  id: string;
  configId: string;
  userId: string;
  responses: QuestionnaireResponse[];
  currentQuestionId?: string;
  currentSectionId?: string;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

// Utility types for easy configuration
export interface QuestionBuilder {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  helpText?: string;
  required?: boolean;
}

export interface MultipleChoiceBuilder extends QuestionBuilder {
  type: 'multiple_choice';
  options: Array<{ label: string; value: string; description?: string }>;
  maxSelections?: number;
}

export interface SingleChoiceBuilder extends QuestionBuilder {
  type: 'single_choice';
  options: Array<{ label: string; value: string; description?: string }>;
}

export interface ScaleBuilder extends QuestionBuilder {
  type: 'scale';
  min: number;
  max: number;
  step?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface PainScaleBuilder extends QuestionBuilder {
  type: 'pain_scale';
  // Pain scale is always 0-10
}

export interface TextBuilder extends QuestionBuilder {
  type: 'text';
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}

export interface NumberBuilder extends QuestionBuilder {
  type: 'number';
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface BooleanBuilder extends QuestionBuilder {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
}

export interface BodyAreasBuilder extends QuestionBuilder {
  type: 'body_areas';
  maxSelections?: number;
}

export interface DemographicsBuilder extends QuestionBuilder {
  type: 'demographics';
  fields: Array<'age' | 'gender' | 'height' | 'weight' | 'activity_level'>;
}

// Builder types union
export type AnyQuestionBuilder =
  | MultipleChoiceBuilder
  | SingleChoiceBuilder
  | ScaleBuilder
  | PainScaleBuilder
  | TextBuilder
  | NumberBuilder
  | BooleanBuilder
  | BodyAreasBuilder
  | DemographicsBuilder;
