import type {
  Question,
  QuestionnaireConfig,
  QuestionnaireResponse,
  ConditionalLogic,
  ValidationRule,
} from '../types/questionnaire';

/**
 * Questionnaire Engine Service
 *
 * Handles conditional logic, validation, and questionnaire flow management
 */
export class QuestionnaireEngine {
  private config: QuestionnaireConfig;
  private responses: Record<string, any>;

  constructor(
    config: QuestionnaireConfig,
    responses: Record<string, any> = {}
  ) {
    this.config = config;
    this.responses = responses;
  }

  /**
   * Update responses
   */
  updateResponses(responses: Record<string, any>) {
    this.responses = responses;
  }

  /**
   * Get all questions flattened across sections
   */
  getAllQuestions(): Question[] {
    return this.config.sections.flatMap(section => section.questions);
  }

  /**
   * Check if a question should be shown based on conditional logic
   */
  shouldShowQuestion(question: Question): boolean {
    if (!question.conditionalLogic || question.conditionalLogic.length === 0) {
      return true;
    }

    return question.conditionalLogic.every(logic =>
      this.evaluateCondition(logic)
    );
  }

  /**
   * Evaluate a single conditional logic rule
   */
  private evaluateCondition(logic: ConditionalLogic): boolean {
    const dependentValue = this.responses[logic.dependsOn];

    switch (logic.condition) {
      case 'equals':
        return dependentValue === logic.value;

      case 'not_equals':
        return dependentValue !== logic.value;

      case 'greater_than':
        return (
          typeof dependentValue === 'number' &&
          typeof logic.value === 'number' &&
          dependentValue > logic.value
        );

      case 'less_than':
        return (
          typeof dependentValue === 'number' &&
          typeof logic.value === 'number' &&
          dependentValue < logic.value
        );

      case 'contains':
        if (
          typeof dependentValue === 'string' &&
          typeof logic.value === 'string'
        ) {
          return dependentValue
            .toLowerCase()
            .includes(logic.value.toLowerCase());
        }
        return false;

      case 'in_array':
        if (Array.isArray(dependentValue) && Array.isArray(logic.value)) {
          return logic.value.some(val => dependentValue.includes(val));
        }
        if (Array.isArray(logic.value)) {
          return logic.value.includes(dependentValue);
        }
        return false;

      default:
        return true;
    }
  }

  /**
   * Get the next visible question after the current index
   */
  getNextVisibleQuestion(currentIndex: number): Question | null {
    const allQuestions = this.getAllQuestions();

    for (let i = currentIndex + 1; i < allQuestions.length; i++) {
      const question = allQuestions[i];
      if (this.shouldShowQuestion(question)) {
        return question;
      }
    }

    return null;
  }

  /**
   * Get the previous visible question before the current index
   */
  getPreviousVisibleQuestion(currentIndex: number): Question | null {
    const allQuestions = this.getAllQuestions();

    for (let i = currentIndex - 1; i >= 0; i--) {
      const question = allQuestions[i];
      if (this.shouldShowQuestion(question)) {
        return question;
      }
    }

    return null;
  }

  /**
   * Get all visible questions in order
   */
  getVisibleQuestions(): Question[] {
    return this.getAllQuestions().filter(question =>
      this.shouldShowQuestion(question)
    );
  }

  /**
   * Validate a single response
   */
  validateResponse(questionId: string, value: any): string | null {
    const question = this.getAllQuestions().find(q => q.id === questionId);
    if (!question) return null;

    // Skip validation if question is not visible
    if (!this.shouldShowQuestion(question)) {
      return null;
    }

    // Required field validation
    if (
      question.required &&
      (value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return 'This question is required';
    }

    // Custom validation rules
    if (question.validation) {
      for (const rule of question.validation) {
        const error = this.validateRule(rule, value);
        if (error) return error;
      }
    }

    return null;
  }

  /**
   * Validate a single rule
   */
  private validateRule(rule: ValidationRule, value: any): string | null {
    switch (rule.type) {
      case 'required':
        if (!value && value !== 0) return rule.message;
        break;

      case 'min_length':
        if (
          typeof value === 'string' &&
          value.length < (rule.value as number)
        ) {
          return rule.message;
        }
        break;

      case 'max_length':
        if (
          typeof value === 'string' &&
          value.length > (rule.value as number)
        ) {
          return rule.message;
        }
        break;

      case 'min_value':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message;
        }
        break;

      case 'max_value':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value === 'string' && !emailRegex.test(value)) {
          return rule.message;
        }
        break;

      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          return rule.message;
        }
        break;
    }

    return null;
  }

  /**
   * Validate all current responses
   */
  validateAllResponses(): Record<string, string> {
    const errors: Record<string, string> = {};

    this.getVisibleQuestions().forEach(question => {
      const error = this.validateResponse(
        question.id,
        this.responses[question.id]
      );
      if (error) {
        errors[question.id] = error;
      }
    });

    return errors;
  }

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    const visibleQuestions = this.getVisibleQuestions();
    if (visibleQuestions.length === 0) return 100;

    const answeredQuestions = visibleQuestions.filter(question => {
      const value = this.responses[question.id];
      return (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      );
    });

    return Math.round(
      (answeredQuestions.length / visibleQuestions.length) * 100
    );
  }

  /**
   * Get questionnaire summary
   */
  getSummary(): {
    totalQuestions: number;
    visibleQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
    isComplete: boolean;
    errors: Record<string, string>;
  } {
    const allQuestions = this.getAllQuestions();
    const visibleQuestions = this.getVisibleQuestions();
    const errors = this.validateAllResponses();
    const completionPercentage = this.getCompletionPercentage();

    const answeredQuestions = visibleQuestions.filter(question => {
      const value = this.responses[question.id];
      return (
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      );
    }).length;

    return {
      totalQuestions: allQuestions.length,
      visibleQuestions: visibleQuestions.length,
      answeredQuestions,
      completionPercentage,
      isComplete:
        Object.keys(errors).length === 0 && completionPercentage === 100,
      errors,
    };
  }

  /**
   * Convert responses to QuestionnaireResponse format
   */
  toResponseArray(): QuestionnaireResponse[] {
    return Object.entries(this.responses)
      .filter(([questionId]) => {
        const question = this.getAllQuestions().find(q => q.id === questionId);
        return question && this.shouldShowQuestion(question);
      })
      .map(([questionId, value]) => ({
        questionId,
        value,
        timestamp: new Date().toISOString(),
      }));
  }
}

/**
 * Utility functions for questionnaire management
 */
export const questionnaireUtils = {
  /**
   * Create a new questionnaire engine instance
   */
  createEngine: (
    config: QuestionnaireConfig,
    responses: Record<string, any> = {}
  ) => {
    return new QuestionnaireEngine(config, responses);
  },

  /**
   * Convert response array to response map
   */
  responsesToMap: (responses: QuestionnaireResponse[]): Record<string, any> => {
    const map: Record<string, any> = {};
    responses.forEach(response => {
      map[response.questionId] = response.value;
    });
    return map;
  },

  /**
   * Generate question statistics
   */
  generateStats: (
    config: QuestionnaireConfig
  ): {
    totalQuestions: number;
    questionsByType: Record<string, number>;
    questionsBySection: Record<string, number>;
    requiredQuestions: number;
    optionalQuestions: number;
  } => {
    const allQuestions = config.sections.flatMap(section => section.questions);

    const questionsByType: Record<string, number> = {};
    const questionsBySection: Record<string, number> = {};
    let requiredQuestions = 0;

    config.sections.forEach(section => {
      questionsBySection[section.title] = section.questions.length;

      section.questions.forEach(question => {
        questionsByType[question.type] =
          (questionsByType[question.type] || 0) + 1;
        if (question.required) requiredQuestions++;
      });
    });

    return {
      totalQuestions: allQuestions.length,
      questionsByType,
      questionsBySection,
      requiredQuestions,
      optionalQuestions: allQuestions.length - requiredQuestions,
    };
  },
};
