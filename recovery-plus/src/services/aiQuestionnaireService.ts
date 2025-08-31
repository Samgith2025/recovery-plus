import { aiService } from './openai';
import type { Question, QuestionnaireResponse } from '../types/questionnaire';

/**
 * AI-Powered Adaptive Questionnaire Service
 * 
 * Generates personalized questions based on user responses
 * and adapts the flow intelligently using OpenAI
 */

export interface AIQuestionContext {
  responses: Record<string, any>;
  currentQuestionIndex: number;
  userProfile?: {
    age?: number;
    gender?: string;
    activityLevel?: string;
  };
  injuryType?: string;
  painLevel?: number;
}

export interface AIGeneratedQuestion {
  id: string;
  type: 'single_choice' | 'multiple_choice' | 'scale' | 'pain_scale' | 'text' | 'boolean';
  title: string;
  subtitle?: string;
  helpText?: string;
  required: boolean;
  options?: Array<{
    label: string;
    value: string;
    description?: string;
  }>;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
  reasoning?: string; // Why this question was generated
  adaptiveScore?: number; // How important this question is
}

export interface AIQuestionnaireSession {
  sessionId: string;
  userId?: string;
  questions: AIGeneratedQuestion[];
  responses: Record<string, any>;
  context: AIQuestionContext;
  completionStatus: 'in_progress' | 'completed' | 'adaptive_complete';
  createdAt: string;
  updatedAt: string;
}

class AIQuestionnaireService {
  private sessions: Map<string, AIQuestionnaireSession> = new Map();

  /**
   * Start a new adaptive questionnaire session
   */
  async startAdaptiveQuestionnaire(userId?: string): Promise<AIQuestionnaireSession> {
    const sessionId = `ai_questionnaire_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate the first question
    const firstQuestion = await this.generateInitialQuestion();
    
    const session: AIQuestionnaireSession = {
      sessionId,
      userId,
      questions: [firstQuestion],
      responses: {},
      context: {
        responses: {},
        currentQuestionIndex: 0,
      },
      completionStatus: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Generate the first question to start the assessment
   */
  private async generateInitialQuestion(): Promise<AIGeneratedQuestion> {
    try {
      const systemPrompt = `You are an AI recovery assessment specialist. Generate the first question for a comprehensive injury/pain assessment.

IMPORTANT GUIDELINES:
- This is the very first question to understand the user's primary concern
- Focus on identifying the main issue: injury, pain, or recovery goal
- Keep it broad but specific enough to guide the assessment
- Use encouraging, supportive language
- Make it relevant for all types of physical issues

Generate a JSON response with this structure:
{
  "type": "single_choice" | "multiple_choice" | "text",
  "title": "Clear, empathetic question",
  "subtitle": "Supporting context (optional)",
  "helpText": "Additional guidance (optional)",
  "required": true,
  "options": [{"label": "Option text", "value": "option_value", "description": "Brief explanation"}],
  "reasoning": "Why this question is important"
}`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the first assessment question.' }
      ]);

      if (response.success) {
        const questionData = this.parseAIQuestionResponse(response.message);
        return {
          id: 'ai_initial_1',
          adaptiveScore: 1.0,
          ...questionData,
        };
      }
    } catch (error) {
      console.error('Error generating initial question:', error);
    }

    // Fallback initial question
    return {
      id: 'ai_initial_1',
      type: 'single_choice',
      title: 'What brings you to Recovery+ today?',
      subtitle: 'Help us understand your primary concern so we can create the best recovery plan for you',
      required: true,
      options: [
        {
          label: 'I have a recent injury',
          value: 'recent_injury',
          description: 'Injured within the last few weeks'
        },
        {
          label: 'I have ongoing pain',
          value: 'chronic_pain',
          description: 'Pain lasting more than 3 months'
        },
        {
          label: 'I\'m recovering from surgery',
          value: 'post_surgery',
          description: 'Post-operative rehabilitation'
        },
        {
          label: 'I want to prevent injury',
          value: 'prevention',
          description: 'Improve strength and mobility'
        },
        {
          label: 'General wellness & mobility',
          value: 'wellness',
          description: 'Improve overall physical health'
        }
      ],
      reasoning: 'Understanding the primary concern helps direct the entire assessment',
      adaptiveScore: 1.0,
    };
  }

  /**
   * Submit a response and get the next adaptive question
   */
  async submitResponse(
    sessionId: string,
    questionId: string,
    response: any
  ): Promise<{ session: AIQuestionnaireSession; nextQuestion?: AIGeneratedQuestion; isComplete?: boolean }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session with response
    session.responses[questionId] = response;
    session.context.responses = session.responses;
    session.updatedAt = new Date().toISOString();

    // Check if we should generate more questions
    const shouldContinue = await this.shouldGenerateNextQuestion(session);
    
    if (!shouldContinue) {
      session.completionStatus = 'adaptive_complete';
      this.sessions.set(sessionId, session);
      return { session, isComplete: true };
    }

    // Generate next question based on context
    const nextQuestion = await this.generateNextQuestion(session);
    
    if (nextQuestion) {
      session.questions.push(nextQuestion);
      session.context.currentQuestionIndex++;
    } else {
      session.completionStatus = 'adaptive_complete';
    }

    this.sessions.set(sessionId, session);
    
    return { 
      session, 
      nextQuestion: nextQuestion || undefined,
      isComplete: !nextQuestion
    };
  }

  /**
   * Generate the next question based on user responses and context
   */
  private async generateNextQuestion(session: AIQuestionnaireSession): Promise<AIGeneratedQuestion | null> {
    try {
      const systemPrompt = `You are an AI recovery assessment specialist creating adaptive questionnaires.

CONTEXT:
- Current responses: ${JSON.stringify(session.responses, null, 2)}
- Question count: ${session.questions.length}
- Assessment goal: Create personalized recovery plan

GUIDELINES:
- Ask only the most important follow-up question based on previous responses
- Focus on gathering critical information for exercise recommendations
- Avoid redundant questions
- Use appropriate question types (single_choice, scale, boolean, text)
- Keep questions concise but thorough
- Use empathetic, supportive language

PRIORITIZE THESE AREAS (if not covered):
1. Pain level and location (if relevant)
2. Previous injuries/medical history (if injury-related)
3. Current activity level
4. Specific limitations or symptoms
5. Goals and time commitment
6. Safety considerations

Generate JSON response:
{
  "type": "question_type",
  "title": "Adaptive question based on responses",
  "subtitle": "Context or clarification",
  "helpText": "Additional guidance",
  "required": true/false,
  "options": [...] // for choice questions,
  "min": number, // for scales
  "max": number, // for scales
  "reasoning": "Why this question is needed next"
}

Return "ASSESSMENT_COMPLETE" if enough information has been gathered.`;

      const userMessage = `Based on the user's responses, what should be the next question? Previous responses: ${JSON.stringify(session.responses)}`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      if (response.success) {
        const message = response.message.trim();
        
        if (message.includes('ASSESSMENT_COMPLETE')) {
          return null;
        }

        const questionData = this.parseAIQuestionResponse(message);
        return {
          id: `ai_q_${session.questions.length + 1}`,
          adaptiveScore: this.calculateAdaptiveScore(session, questionData),
          ...questionData,
        };
      }
    } catch (error) {
      console.error('Error generating next question:', error);
    }

    return null;
  }

  /**
   * Determine if we should generate another question
   */
  private async shouldGenerateNextQuestion(session: AIQuestionnaireSession): Promise<boolean> {
    // Limit to reasonable number of questions (5-12 typically)
    if (session.questions.length >= 12) {
      return false;
    }

    // Minimum 3 questions for basic assessment
    if (session.questions.length < 3) {
      return true;
    }

    // Check if we have enough information for basic assessment
    const responses = session.responses;
    const hasBasicInfo = [
      'primary_concern',
      'pain_level',
      'activity_level',
      'goals'
    ].some(key => responses[key] !== undefined);

    // If we have basic info and 5+ questions, consider completion
    if (hasBasicInfo && session.questions.length >= 5) {
      // Use AI to determine if we have enough information
      try {
        const systemPrompt = `Analyze if this assessment has enough information to create a personalized recovery plan.

RESPONSES: ${JSON.stringify(responses, null, 2)}
QUESTION COUNT: ${session.questions.length}

REQUIRED FOR GOOD PLAN:
- Primary concern/issue
- Pain level/severity (if relevant)
- Activity level/fitness
- Basic demographics or limitations
- Recovery goals

Respond with "SUFFICIENT" if enough info gathered, or "NEED_MORE" with reason.`;

        const response = await aiService.generateCoachingResponse([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Should we continue the assessment?' }
        ]);

        if (response.success && response.message.includes('SUFFICIENT')) {
          return false;
        }
      } catch (error) {
        console.error('Error checking completion status:', error);
      }
    }

    return true;
  }

  /**
   * Parse AI response into question format
   */
  private parseAIQuestionResponse(aiResponse: string): Omit<AIGeneratedQuestion, 'id' | 'adaptiveScore'> {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          type: parsed.type || 'text',
          title: parsed.title || 'Question',
          subtitle: parsed.subtitle,
          helpText: parsed.helpText,
          required: parsed.required !== false,
          options: parsed.options,
          min: parsed.min,
          max: parsed.max,
          minLabel: parsed.minLabel,
          maxLabel: parsed.maxLabel,
          placeholder: parsed.placeholder,
          reasoning: parsed.reasoning,
        };
      }
    } catch (error) {
      console.error('Error parsing AI question response:', error);
    }

    // Fallback to simple text question
    return {
      type: 'text',
      title: aiResponse.length > 200 ? 'Please describe your situation' : aiResponse,
      required: true,
      reasoning: 'Fallback question due to parsing error',
    };
  }

  /**
   * Calculate adaptive score for question importance
   */
  private calculateAdaptiveScore(session: AIQuestionnaireSession, questionData: any): number {
    let score = 0.5; // Base score

    // Higher score for early questions
    if (session.questions.length < 3) score += 0.3;

    // Higher score for pain-related questions
    if (questionData.title?.toLowerCase().includes('pain')) score += 0.2;

    // Higher score for required questions
    if (questionData.required) score += 0.1;

    return Math.min(score, 1.0);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AIQuestionnaireSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Complete a session and generate summary
   */
  async completeSession(sessionId: string): Promise<{
    session: AIQuestionnaireSession;
    summary: {
      totalQuestions: number;
      completionTime: string;
      keyInsights: string[];
      recommendedNextSteps: string[];
    };
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    session.completionStatus = 'completed';
    session.updatedAt = new Date().toISOString();

    // Generate AI summary
    const summary = await this.generateAssessmentSummary(session);

    return { session, summary };
  }

  /**
   * Generate AI-powered assessment summary
   */
  private async generateAssessmentSummary(session: AIQuestionnaireSession): Promise<{
    totalQuestions: number;
    completionTime: string;
    keyInsights: string[];
    recommendedNextSteps: string[];
  }> {
    try {
      const systemPrompt = `Analyze this adaptive assessment and provide insights.

RESPONSES: ${JSON.stringify(session.responses, null, 2)}

Generate a JSON summary with:
{
  "keyInsights": ["3-5 key insights about the user's condition/needs"],
  "recommendedNextSteps": ["3-4 specific next steps for recovery"]
}

Focus on actionable insights and personalized recommendations.`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Analyze this assessment and provide summary.' }
      ]);

      if (response.success) {
        const parsed = JSON.parse(response.message);
        return {
          totalQuestions: session.questions.length,
          completionTime: new Date(session.updatedAt).toLocaleString(),
          keyInsights: parsed.keyInsights || ['Assessment completed successfully'],
          recommendedNextSteps: parsed.recommendedNextSteps || ['Begin personalized exercise program'],
        };
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    }

    // Fallback summary
    return {
      totalQuestions: session.questions.length,
      completionTime: new Date(session.updatedAt).toLocaleString(),
      keyInsights: ['Assessment completed successfully', 'Ready to begin personalized recovery plan'],
      recommendedNextSteps: ['Start with gentle exercises', 'Monitor progress regularly', 'Adjust intensity as needed'],
    };
  }

  /**
   * Convert AI questionnaire responses to standard format
   */
  convertToStandardResponses(session: AIQuestionnaireSession): QuestionnaireResponse[] {
    return Object.entries(session.responses).map(([questionId, value]) => ({
      questionId,
      value,
      timestamp: session.updatedAt,
    }));
  }
}

export const aiQuestionnaireService = new AIQuestionnaireService();
