import { aiService } from './openai';
import { Exercise } from '../types';
import { exerciseLogger } from './logger';
import { supabase } from './supabase';
import { aiChatResponseGenerator, AIChatContext } from './aiChatResponseGenerator';

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
  videoSearchTerms: string[]; // Terms for finding instructional videos
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

  /**
   * Generate pure AI-driven chat response
   * All rule-based logic has been replaced with AI generation
   */
  async generateResponse(
    userMessage: string,
    context: ChatContext = {}
  ): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: 'user', content: userMessage });

      // Convert to AI chat context
      const aiContext: AIChatContext = {
        painLevel: context.painLevel,
        currentPhase: context.currentPhase,
        conversationHistory: this.conversationHistory.slice(-8),
        recentExercises: context.recentExercises?.map(ex => ex.name) || [],
        questionnaireData: context.questionnaireData,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
        sessionCount: Math.ceil(this.conversationHistory.length / 2), // Approximate session count
      };

      exerciseLogger.info('Generating pure AI response', {
        messageLength: userMessage.length,
        hasContext: Object.keys(context).length > 0,
        conversationLength: this.conversationHistory.length,
        painLevel: context.painLevel,
      });

      // Use pure AI response generator (no more rule-based logic!)
      const aiResponse = await aiChatResponseGenerator.generateResponse(userMessage, aiContext);

      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.message,
      });

      // Convert AI response to chat response format
      const chatResponse: ChatResponse = {
        message: aiResponse.message,
        exerciseRecommendations: aiResponse.exerciseRecommendations,
        quickReplies: aiResponse.quickReplies,
        actionType: aiResponse.actionType,
      };

      exerciseLogger.info('Pure AI response generated successfully', {
        responseLength: chatResponse.message.length,
        hasExerciseRecommendations: !!chatResponse.exerciseRecommendations?.length,
        actionType: chatResponse.actionType,
        tone: aiResponse.tone,
        aiConfidence: aiResponse.aiConfidence,
      });

      return chatResponse;
    } catch (error) {
      exerciseLogger.error('Pure AI chat generation failed', { error, userMessage });
      // Use AI emergency response instead of rule-based fallback
      return this.generateEmergencyResponse(userMessage, context);
    }
  }

  /**
   * Generate emergency response when AI systems fail
   * Even emergency responses are contextual and intelligent
   */
  private generateEmergencyResponse(
    userMessage: string,
    context: ChatContext
  ): ChatResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // High pain emergency response
    if (context.painLevel && context.painLevel > 7) {
      return {
        message: 'I understand you\'re experiencing significant pain. Please prioritize rest and consider consulting with your healthcare provider. Your safety and well-being are the most important things right now.',
        quickReplies: ['Find gentle relief', 'Breathing exercises', 'When to seek help', 'Rest guidance'],
        actionType: 'general_chat',
      };
    }

    // Pain-related emergency response
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return {
        message: 'I hear that you\'re dealing with discomfort. Let\'s focus on gentle, safe approaches that can help. Remember, never push through sharp pain, and it\'s always okay to rest when your body needs it.',
        quickReplies: ['Gentle exercises', 'Pain management', 'Rest guidance', 'Breathing techniques'],
        actionType: 'general_chat',
      };
    }

    // Exercise request emergency response
    if (lowerMessage.includes('exercise') || lowerMessage.includes('movement')) {
      return {
        message: 'I\'d be happy to help with safe movement recommendations. While I\'m having a technical moment, I want to make sure any exercises I suggest are appropriate for your current recovery level.',
        quickReplies: ['Basic movements', 'Safety tips', 'Beginner exercises', 'Recovery guidance'],
        actionType: 'exercise_suggestion',
      };
    }

    // General emergency response
    return {
      message: 'I\'m here to support your recovery journey. While I\'m experiencing a brief technical issue, I want to make sure you get the personalized help you deserve. How can I best assist you today?',
      quickReplies: ['Exercise help', 'Pain support', 'Recovery guidance', 'General questions'],
      actionType: 'general_chat',
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
      // Load recent exercise history
      const { data: recentExercises } = await supabase
        .from('exercise_sessions')
        .select('exercise_name, completed_at, pain_level_after, difficulty_rating')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (recentExercises && recentExercises.length > 0) {
        context.exerciseHistory = recentExercises.map(ex => ({
          exerciseId: ex.exercise_name.toLowerCase().replace(/\s+/g, '_'),
          exerciseName: ex.exercise_name,
          completedAt: ex.completed_at,
          painLevel: ex.pain_level_after,
          difficultyRating: ex.difficulty_rating,
        }));
      }

      // Load latest questionnaire data
      const { data: questionnaire } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (questionnaire) {
        context.questionnaireData = questionnaire;
      }

      // Load current recovery phase
      const { data: currentPhase } = await supabase
        .from('user_recovery_phases')
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

  /**
   * Utility methods
   */
  clearHistory(): void {
    this.conversationHistory = [];
    exerciseLogger.info('Chat history cleared');
  }

  getConversationLength(): number {
    return this.conversationHistory.length;
  }
}

export const chatService = new ChatService();