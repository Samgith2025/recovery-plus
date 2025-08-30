import { aiService } from './openai';
import { Exercise } from '../types';
import { exerciseLogger } from './logger';

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
        return this.getFallbackResponse(userMessage, context);
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

  private getFallbackResponse(
    userMessage: string,
    context: ChatContext
  ): ChatResponse {
    const lowerMessage = userMessage.toLowerCase();

    // Exercise-specific fallbacks
    if (lowerMessage.includes('chest') || lowerMessage.includes('push')) {
      return {
        message:
          "For chest strengthening, I'd recommend starting with **Wall Push-ups**. They're gentle and perfect for building foundation strength safely.",
        exerciseRecommendations: [
          {
            id: 'ex-1',
            name: 'Wall Push-ups',
            description:
              'Gentle upper body strength exercise perfect for beginners',
            instructions: this.sampleExercises[0].instructions,
            sets: 2,
            reps: 8,
            level: 'BEGINNER',
            type: 'strength',
            targetMuscles: ['chest', 'shoulders', 'triceps'],
            reason: 'Great starting exercise for upper body strength',
          },
        ],
        actionType: 'exercise_suggestion',
        quickReplies: [
          'How do I do wall push-ups?',
          'Show me more chest exercises',
        ],
      };
    }

    if (lowerMessage.includes('back') || lowerMessage.includes('spine')) {
      return {
        message:
          'For back mobility and relief, the **Gentle Cat-Cow Stretch** is excellent. It helps with spine flexibility and can reduce tension.',
        exerciseRecommendations: [
          {
            id: 'ex-2',
            name: 'Gentle Cat-Cow Stretch',
            description: 'Mobility exercise for spine and lower back relief',
            instructions: this.sampleExercises[1].instructions,
            sets: 1,
            reps: 10,
            level: 'BEGINNER',
            type: 'mobility',
            targetMuscles: ['lower back', 'core'],
            reason: 'Excellent for spine mobility and back tension relief',
          },
        ],
        actionType: 'exercise_suggestion',
        quickReplies: [
          'How often should I do this?',
          'What if my back still hurts?',
        ],
      };
    }

    // General fallback
    return {
      message:
        "I'm here to help with your recovery journey! I can suggest exercises, answer questions about form, or help you understand your recovery phase. What would you like to work on today?",
      actionType: 'general_chat',
      quickReplies: [
        'Suggest exercises for me',
        'Help with current exercises',
        'Explain my recovery phase',
        'I have pain questions',
      ],
    };
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
