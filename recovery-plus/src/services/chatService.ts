import { aiService } from './openai';
import { Exercise } from '../types';
import { exerciseLogger } from './logger';
import {
  aiExerciseRecommendations,
  UserContext,
} from './aiExerciseRecommendations';
import { supabase } from './supabase';

export interface ChatContext {
  questionnaireData?: Record<string, unknown>;
  currentPhase?: number;
  painLevel?: number;
  recentExercises?: Exercise[];
  exerciseHistory?: Array<{
    exerciseId: string;
    exerciseName: string;
    completedAt: string;
    painLevel?: number;
    difficultyRating?: number;
  }>;
}

export interface ExerciseRecommendation {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  sets?: number;
  reps?: number;
  holdTime?: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  type: 'strength' | 'mobility' | 'isometric' | 'cardio';
  targetMuscles: string[];
  reason: string; // Why this exercise is recommended
  videoSearchTerms?: string[]; // Terms for finding instructional videos
}

export interface ChatResponse {
  message: string;
  exerciseRecommendations?: ExerciseRecommendation[];
  quickReplies?: string[];
  actionType?: 'exercise_suggestion' | 'phase_assessment' | 'general_chat';
}

class ChatService {
  private conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }> = [];

  // Sample exercises database (in a real app, this would come from Supabase)
  private sampleExercises: Exercise[] = [
    {
      id: 'ex-1',
      name: 'Wall Push-ups',
      description: 'Gentle upper body strength exercise perfect for beginners',
      instructions: [
        "Stand arm's length from a wall",
        'Place palms flat against wall at shoulder height',
        'Slowly push body toward wall and back',
        'Keep core engaged throughout movement',
      ],
      sets: 2,
      reps: 8,
      level: 'BEGINNER',
      difficulty: 2,
      type: 'strength',
      targetMuscles: ['chest', 'shoulders', 'triceps'],
      bodyPart: ['upper body'],
      videoUrls: [],
      icon: '💪',
      equipment: [],
      duration: '5 mins',
    },
    {
      id: 'ex-2',
      name: 'Gentle Cat-Cow Stretch',
      description: 'Mobility exercise for spine and lower back relief',
      instructions: [
        'Start on hands and knees',
        'Slowly arch back, lifting head and tailbone (Cow)',
        'Round spine toward ceiling, tucking chin (Cat)',
        'Move slowly and breathe deeply',
      ],
      sets: 1,
      reps: 10,
      level: 'BEGINNER',
      difficulty: 1,
      type: 'mobility',
      targetMuscles: ['lower back', 'core'],
      bodyPart: ['spine', 'lower back'],
      videoUrls: [],
      icon: '🐱',
      equipment: [],
      duration: '3 mins',
    },
    {
      id: 'ex-3',
      name: 'Wall Sit',
      description: 'Isometric exercise for leg strength and endurance',
      instructions: [
        'Stand with back against wall',
        'Slide down until thighs are parallel to floor',
        'Keep knees at 90-degree angle',
        'Hold position and breathe normally',
      ],
      sets: 3,
      holdTime: 20,
      level: 'INTERMEDIATE',
      difficulty: 3,
      type: 'isometric',
      targetMuscles: ['quadriceps', 'glutes'],
      bodyPart: ['lower body'],
      videoUrls: [],
      icon: '🏃',
      equipment: [],
      duration: '4 mins',
    },
  ];

  async generateResponse(
    userMessage: string,
    context: ChatContext = {}
  ): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Create enhanced system prompt with context
      const systemPrompt = this.createSystemPrompt(context);

      // Prepare messages for OpenAI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...this.conversationHistory.slice(-8), // Keep last 8 messages for context
      ];

      exerciseLogger.info('Generating AI response', {
        messageLength: userMessage.length,
        hasContext: Object.keys(context).length > 0,
        conversationLength: this.conversationHistory.length,
      });

      // Get AI response
      const aiResponse = await aiService.generateCoachingResponse(messages, {
        questionnaireData: context.questionnaireData,
        currentPhase: context.currentPhase,
        painLevel: context.painLevel,
      });

      if (!aiResponse.success) {
        exerciseLogger.warn('AI service unavailable, using fallback', {
          error: aiResponse.error,
        });
        return await this.getFallbackResponse(userMessage, context);
      }

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.message,
      });

      // Parse response for exercise recommendations
      const chatResponse = await this.parseAIResponse(
        aiResponse.message,
        context
      );

      exerciseLogger.info('AI response generated successfully', {
        responseLength: aiResponse.message.length,
        hasExerciseRecommendations:
          (chatResponse.exerciseRecommendations?.length || 0) > 0,
        actionType: chatResponse.actionType,
      });

      return chatResponse;
    } catch (error) {
      exerciseLogger.error('Chat service error', { error, userMessage });

      // Fallback to rule-based response
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private createSystemPrompt(context: ChatContext): string {
    const contextInfo = [];

    if (context.currentPhase) {
      contextInfo.push(
        `User is currently in recovery phase ${context.currentPhase}`
      );
    }

    if (context.painLevel) {
      contextInfo.push(`Current pain level: ${context.painLevel}/10`);
    }

    if (context.recentExercises?.length) {
      const exerciseNames = context.recentExercises
        .map(ex => ex.name)
        .join(', ');
      contextInfo.push(`Recent exercises: ${exerciseNames}`);
    }

    return `You are an AI fitness coach for Recovery+, a recovery and rehabilitation app.

IMPORTANT GUIDELINES:
- You are NOT a medical professional. Always remind users to consult healthcare providers for medical concerns.
- Focus on gentle, progressive exercises appropriate for recovery and rehabilitation.
- Use encouraging, supportive language focused on gradual improvement.
- When suggesting exercises, be specific about form, repetitions, and safety.
- If asked about exercises, suggest 1-3 specific exercises with clear instructions.

${contextInfo.length > 0 ? `\nUser Context:\n${contextInfo.join('\n')}` : ''}

Available exercises in the app:
${this.sampleExercises
  .map(ex => `- ${ex.name} (${ex.type}, ${ex.level}): ${ex.description}`)
  .join('\n')}

When recommending exercises, use the format:
**Exercise: [Name]**
- Level: [Level]
- Instructions: [Brief instructions]
- Why: [Why this helps]
- Video: [Highly specific search terms that exactly match the exercise, like "cat cow stretch proper form tutorial beginner" or "wall push up technique demonstration"]

CRITICAL: Always provide precise video search terms that:
1. Include the EXACT exercise name
2. Add technique/form/tutorial keywords
3. Include difficulty level if relevant
4. Be specific enough to find the right exercise video
5. Never use generic terms - be as specific as possible

Keep responses conversational, helpful, and focused on safe recovery practices.`;
  }

  private async parseAIResponse(
    aiMessage: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    const response: ChatResponse = {
      message: aiMessage,
      actionType: 'general_chat',
    };

    // Check if the AI is recommending exercises
    const exerciseMatches = aiMessage.match(/\*\*Exercise: ([^*]+)\*\*/g);

    if (exerciseMatches) {
      response.actionType = 'exercise_suggestion';
      response.exerciseRecommendations = [];

      for (const match of exerciseMatches) {
        const exerciseName = match
          .replace(/\*\*Exercise: ([^*]+)\*\*/, '$1')
          .trim();

        // Extract video search terms from the AI response
        const exerciseSection =
          aiMessage.split(match)[1]?.split('**Exercise:')[0] || '';
        const videoMatch = exerciseSection.match(/- Video: ([^\n]+)/i);
        const videoSearchTerms = videoMatch ? [videoMatch[1].trim()] : [];

        // Find matching exercise from our database
        const exercise = this.sampleExercises.find(
          ex =>
            ex.name.toLowerCase().includes(exerciseName.toLowerCase()) ||
            exerciseName.toLowerCase().includes(ex.name.toLowerCase())
        );

        if (exercise) {
          response.exerciseRecommendations.push({
            id: exercise.id,
            name: exercise.name,
            description: exercise.description,
            instructions: exercise.instructions,
            sets: exercise.sets,
            reps: exercise.reps,
            holdTime: exercise.holdTime,
            level: exercise.level,
            type: exercise.type,
            targetMuscles: exercise.targetMuscles,
            reason: 'Recommended by AI coach based on your profile',
            videoSearchTerms:
              videoSearchTerms.length > 0
                ? videoSearchTerms
                : [exercise.name + ' proper form technique tutorial'],
          });
        } else {
          // Create a new exercise recommendation from AI response
          response.exerciseRecommendations.push({
            id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: exerciseName,
            description: `AI-recommended exercise for your specific needs`,
            instructions: [
              'Follow the video demonstration carefully',
              'Focus on proper form over speed',
              'Stop if you feel pain',
            ],
            sets: 2,
            reps: 10,
            level: 'BEGINNER',
            type: 'mobility',
            targetMuscles: ['core', 'back'],
            reason: 'Recommended by AI coach based on your profile',
            videoSearchTerms:
              videoSearchTerms.length > 0
                ? videoSearchTerms
                : [exerciseName + ' proper form technique tutorial'],
          });
        }
      }

      // Add quick replies for exercise recommendations
      if (response.exerciseRecommendations.length > 0) {
        response.quickReplies = [
          'Show me more exercises',
          'How do I do this correctly?',
          'What if this is too hard?',
          'Can you modify this exercise?',
        ];
      }
    }

    // Check for other action types
    if (
      aiMessage.toLowerCase().includes('phase') ||
      aiMessage.toLowerCase().includes('assessment')
    ) {
      response.actionType = 'phase_assessment';
      response.quickReplies = [
        'Tell me about my current phase',
        'How can I progress?',
        'What exercises should I focus on?',
      ];
    }

    return response;
  }

  private async getFallbackResponse(
    userMessage: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    try {
      // Try to generate a contextual AI response even when main AI fails
      const contextualResponse = await this.generateContextualFallback(
        userMessage,
        context
      );
      if (contextualResponse) {
        return contextualResponse;
      }
    } catch (error) {
      exerciseLogger.warn('Contextual fallback failed, using basic fallback', {
        error,
      });
    }

    // Last resort: Use intelligent rule-based responses
    return this.getIntelligentRuleBasedResponse(userMessage, context);
  }

  /**
   * Generate contextual AI-powered fallback using simplified prompts
   */
  private async generateContextualFallback(
    userMessage: string,
    context: ChatContext
  ): Promise<ChatResponse | null> {
    try {
      // Get user's recent exercise data to provide context
      const userContext = await this.buildUserContext(context);

      // Use a simplified AI call for fallback responses
      const simplifiedPrompt = `You are a recovery coach. User says: "${userMessage}"
      
User context: ${JSON.stringify(userContext, null, 2)}

Respond helpfully and suggest 1-2 relevant exercises if appropriate. Keep response under 150 words.
Be encouraging and safety-focused. If suggesting exercises, use format:
**Exercise: [Name]** - [Brief description and why it helps]`;

      const aiResponse = await aiService.generateCoachingResponse(
        [
          {
            role: 'system',
            content:
              'You are a supportive recovery coach. Be concise, helpful, and safety-focused.',
          },
          { role: 'user', content: simplifiedPrompt },
        ],
        {
          currentPhase: context.currentPhase,
          painLevel: context.painLevel,
        }
      );

      // Parse the response and create appropriate chat response
      return this.parseSimplifiedAIResponse(aiResponse, context);
    } catch (error) {
      exerciseLogger.warn('Simplified AI fallback failed', { error });
      return null;
    }
  }

  /**
   * Build user context from available data
   */
  private async buildUserContext(context: ChatContext): Promise<any> {
    const userContext: any = {
      painLevel: context.painLevel || 'unknown',
      currentPhase: context.currentPhase || 1,
      recentExercises:
        context.recentExercises?.slice(0, 3)?.map(ex => ex.name) || [],
    };

    // Add questionnaire data if available
    if (context.questionnaireData) {
      userContext.painAreas = context.questionnaireData.painAreas || [];
      userContext.goals = context.questionnaireData.goals || [];
    }

    return userContext;
  }

  /**
   * Parse simplified AI response into ChatResponse format
   */
  private parseSimplifiedAIResponse(
    aiResponse: string,
    context: ChatContext
  ): ChatResponse {
    const response: ChatResponse = {
      message: aiResponse,
      actionType: 'general_chat',
    };

    // Check if response includes exercise suggestions
    const exerciseMatches = aiResponse.match(/\*\*Exercise: ([^*]+)\*\*/g);

    if (exerciseMatches && exerciseMatches.length > 0) {
      response.actionType = 'exercise_suggestion';
      response.quickReplies = [
        'Tell me more about this exercise',
        'Show me similar exercises',
        'How often should I do this?',
      ];
    } else {
      // Add contextual quick replies based on user's situation
      response.quickReplies = this.generateContextualQuickReplies(context);
    }

    return response;
  }

  /**
   * Generate quick reply suggestions based on user context
   */
  private generateContextualQuickReplies(context: ChatContext): string[] {
    const replies: string[] = [];

    if (context.painLevel && context.painLevel > 6) {
      replies.push('Help with pain management');
      replies.push('Gentle exercises for today');
    } else {
      replies.push('Suggest new exercises');
      replies.push('Track my progress');
    }

    if (context.currentPhase && context.currentPhase < 3) {
      replies.push('Beginner-friendly options');
    } else {
      replies.push('More challenging exercises');
    }

    replies.push('General recovery tips');

    return replies.slice(0, 4); // Limit to 4 replies
  }

  /**
   * Intelligent rule-based responses as final fallback
   */
  private getIntelligentRuleBasedResponse(
    userMessage: string,
    context: ChatContext
  ): ChatResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Pain-related queries
    if (
      lowerMessage.includes('pain') ||
      lowerMessage.includes('hurt') ||
      lowerMessage.includes('sore')
    ) {
      return {
        message: `I understand you're experiencing discomfort. ${
          context.painLevel && context.painLevel > 7
            ? 'Since your pain level seems high, please consider gentle movements and consult your healthcare provider if pain persists.'
            : "Let's focus on gentle exercises that can help reduce tension and improve mobility."
        } 
          
Remember: Never push through sharp pain, and it's always okay to take rest days when needed.`,
        actionType: 'general_chat',
        quickReplies: [
          'Show me gentle exercises',
          'Pain management tips',
          'When should I rest?',
          'Breathing exercises',
        ],
      };
    }

    // Exercise requests
    if (
      lowerMessage.includes('exercise') ||
      lowerMessage.includes('workout') ||
      lowerMessage.includes('movement')
    ) {
      const phaseMessage = context.currentPhase
        ? `Based on your current recovery phase (${context.currentPhase}), `
        : '';

      return {
        message: `${phaseMessage}I can recommend personalized exercises that match your current needs and abilities. Each recommendation is tailored to support your recovery journey safely and effectively.`,
        actionType: 'exercise_suggestion',
        quickReplies: [
          'Get exercise recommendations',
          'Upper body exercises',
          'Lower body exercises',
          'Mobility and stretching',
        ],
      };
    }

    // Progress and motivation
    if (
      lowerMessage.includes('progress') ||
      lowerMessage.includes('improve') ||
      lowerMessage.includes('better')
    ) {
      return {
        message: `Progress in recovery isn't always linear, and that's completely normal! ${
          context.exerciseHistory && context.exerciseHistory.length > 0
            ? "I can see you've been consistent with your exercises - that's fantastic! "
            : ''
        }Small, consistent steps lead to lasting improvements. Celebrate every movement forward, no matter how small.`,
        actionType: 'general_chat',
        quickReplies: [
          'View my progress',
          'Set new goals',
          'Motivational tips',
          "Track today's session",
        ],
      };
    }

    // General support - most encouraging fallback
    return {
      message: `I'm here to support your recovery journey every step of the way! Whether you need exercise recommendations, form guidance, or just someone to remind you how far you've come - I've got you covered. 

What feels most important to focus on today?`,
      actionType: 'general_chat',
      quickReplies: [
        'Get personalized exercises',
        'Check my recovery progress',
        'Ask about pain management',
        'Learn proper form tips',
      ],
    };
  }

  /**
   * Save chat message to Supabase for persistence
   */
  async saveChatMessage(
    userId: string,
    message: string,
    isUser: boolean = true
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: userId,
        content: message,
        is_user: isUser,
      });

      if (error) {
        exerciseLogger.warn('Failed to save chat message', { error });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      exerciseLogger.warn('Error saving chat message', { error });
      return { success: false, error: 'Failed to save message' };
    }
  }

  /**
   * Load chat history from Supabase
   */
  async loadChatHistory(
    userId: string,
    limit: number = 50
  ): Promise<{
    success: boolean;
    messages?: Array<{ content: string; isUser: boolean; createdAt: string }>;
    error?: string;
  }> {
    if (!supabase) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('content, is_user, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        exerciseLogger.warn('Failed to load chat history', { error });
        return { success: false, error: error.message };
      }

      const messages = (data || []).map(msg => ({
        content: msg.content,
        isUser: msg.is_user,
        createdAt: msg.created_at,
      }));

      return { success: true, messages };
    } catch (error) {
      exerciseLogger.warn('Error loading chat history', { error });
      return { success: false, error: 'Failed to load history' };
    }
  }

  /**
   * Enhanced generateResponse with database integration
   */
  async generateResponseWithPersistence(
    userMessage: string,
    userId: string,
    context: ChatContext
  ): Promise<ChatResponse> {
    // Save user message to database
    await this.saveChatMessage(userId, userMessage, true);

    // Generate AI response
    const response = await this.generateResponse(userMessage, context);

    // Save AI response to database
    await this.saveChatMessage(userId, response.message, false);

    return response;
  }

  /**
   * Get enhanced user context from database
   */
  async getEnhancedUserContext(userId: string): Promise<ChatContext> {
    const context: ChatContext = {};

    if (!supabase) {
      return context;
    }

    try {
      // Get user's questionnaire data
      const { data: questionnaireData } = await supabase
        .from('questionnaire_responses')
        .select('responses, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaireData) {
        context.questionnaireData = questionnaireData.responses;
      }

      // Get user's recent exercise history
      const { data: exerciseHistory } = await supabase
        .from('exercise_sessions')
        .select(
          `
          exercise_id,
          completed,
          pain_level,
          difficulty_rating,
          completed_at,
          exercises(title)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (exerciseHistory) {
        context.exerciseHistory = exerciseHistory.map(session => ({
          exerciseId: session.exercise_id,
          exerciseName: (session.exercises as any)?.title || 'Unknown Exercise',
          completedAt: session.completed_at || session.created_at,
          painLevel: session.pain_level,
          difficultyRating: session.difficulty_rating,
        }));

        // Calculate average pain level from recent sessions
        const recentPainLevels = exerciseHistory
          .filter(s => s.pain_level !== null)
          .map(s => s.pain_level);

        if (recentPainLevels.length > 0) {
          context.painLevel = Math.round(
            recentPainLevels.reduce((sum, level) => sum + level, 0) /
              recentPainLevels.length
          );
        }
      }

      // Get current recovery phase
      const { data: currentPhase } = await supabase
        .from('recovery_phases')
        .select('phase')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (currentPhase) {
        context.currentPhase = currentPhase.phase;
      }
    } catch (error) {
      exerciseLogger.warn('Failed to load enhanced user context', { error });
    }

    return context;
  }

  clearHistory(): void {
    this.conversationHistory = [];
    exerciseLogger.info('Chat history cleared');
  }

  getConversationLength(): number {
    return this.conversationHistory.length;
  }
}

export const chatService = new ChatService();
