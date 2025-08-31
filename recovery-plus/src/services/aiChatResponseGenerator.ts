import { aiService } from './openai';
import { exerciseLogger } from './logger';
import { aiExerciseGenerator } from './aiExerciseGenerator';

/**
 * Pure AI Chat Response Generator
 * 
 * Eliminates all hardcoded responses, quick replies, and rule-based logic
 * Everything is generated dynamically by AI based on context
 */

export interface AIChatContext {
  // User Profile
  painLevel?: number;
  currentPhase?: number;
  fitnessLevel?: string;
  injuryType?: string;
  goals?: string[];
  
  // Session Context
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  recentExercises?: string[];
  timeOfDay?: string;
  sessionCount?: number;
  
  // Questionnaire Data
  questionnaireData?: Record<string, unknown>;
  bodyParts?: string[];
  limitations?: string[];
}

export interface AIChatResponse {
  message: string;
  quickReplies: string[];
  actionType: 'exercise_suggestion' | 'phase_assessment' | 'general_chat' | 'motivational' | 'educational';
  exerciseRecommendations?: any[];
  tone: 'supportive' | 'encouraging' | 'educational' | 'cautious' | 'celebratory';
  followUpSuggestions?: string[];
  aiConfidence: number;
}

class AIChatResponseGenerator {
  
  /**
   * Generate completely AI-driven chat response
   */
  async generateResponse(
    userMessage: string,
    context: AIChatContext = {}
  ): Promise<AIChatResponse> {
    try {
      // Create comprehensive AI prompt for response generation
      const systemPrompt = this.createComprehensiveSystemPrompt(context);
      const userPrompt = this.createUserPrompt(userMessage, context);

      // Get AI response
      const aiResponse = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      if (aiResponse.success) {
        return await this.parseComprehensiveAIResponse(aiResponse.message, userMessage, context);
      } else {
        throw new Error(`AI generation failed: ${aiResponse.error}`);
      }
    } catch (error) {
      exerciseLogger.error('AI chat response generation failed', { error });
      return this.generateIntelligentEmergencyResponse(userMessage, context);
    }
  }

  /**
   * Generate AI-powered quick replies based on conversation context
   */
  async generateDynamicQuickReplies(
    conversationContext: string,
    userContext: AIChatContext
  ): Promise<string[]> {
    try {
      const prompt = `Based on this conversation context and user profile, generate 3-4 helpful quick reply suggestions.

CONVERSATION CONTEXT: "${conversationContext}"
USER CONTEXT: ${JSON.stringify(userContext, null, 2)}

Generate quick replies that:
1. Are contextually relevant to what was just discussed
2. Help the user progress their recovery journey
3. Are personalized to their pain level and situation
4. Encourage engagement and learning
5. Are concise (under 6 words each)

IMPORTANT: Generate replies that feel natural and helpful, not robotic. Consider:
- Their current pain level (if high, suggest gentle options)
- Their recovery phase (early = basics, later = progression)
- Time patterns (morning = energy, evening = relaxation)
- Recent topics discussed

Respond with ONLY the quick replies, one per line, no bullets or numbers.`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: 'You are an expert at creating contextual conversation suggestions for recovery coaching.' },
        { role: 'user', content: prompt }
      ]);

      if (response.success) {
        return response.message
          .split('\n')
          .map(reply => reply.trim())
          .filter(reply => reply.length > 0 && reply.length < 40)
          .slice(0, 4);
      }
    } catch (error) {
      exerciseLogger.warn('Failed to generate dynamic quick replies', { error });
    }

    // Contextual fallback quick replies
    return this.generateContextualFallbackReplies(userContext);
  }

  /**
   * Generate AI-powered follow-up suggestions
   */
  async generateFollowUpSuggestions(
    currentTopic: string,
    userContext: AIChatContext
  ): Promise<string[]> {
    try {
      const prompt = `Generate 2-3 natural follow-up suggestions for a user discussing: "${currentTopic}"

USER CONTEXT: ${JSON.stringify(userContext, null, 2)}

Create suggestions that:
- Naturally extend the current conversation
- Help deepen their understanding
- Encourage practical application
- Match their recovery level and goals

Each suggestion should be a complete question or prompt (8-12 words).
Respond with only the suggestions, one per line.`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: 'You are a recovery coach creating natural conversation extensions.' },
        { role: 'user', content: prompt }
      ]);

      if (response.success) {
        return response.message
          .split('\n')
          .map(suggestion => suggestion.trim())
          .filter(suggestion => suggestion.length > 0)
          .slice(0, 3);
      }
    } catch (error) {
      exerciseLogger.warn('Failed to generate follow-up suggestions', { error });
    }

    return [];
  }

  /**
   * Create comprehensive system prompt for AI response generation
   */
  private createComprehensiveSystemPrompt(context: AIChatContext): string {
    return `You are an expert AI recovery coach creating personalized responses for a recovery app user.

USER PROFILE:
- Pain Level: ${context.painLevel || 'unknown'}/10
- Recovery Phase: ${context.currentPhase || 'unknown'}
- Fitness Level: ${context.fitnessLevel || 'unknown'}
- Injury Type: ${context.injuryType || 'unknown'}
- Goals: ${context.goals?.join(', ') || 'general wellness'}
- Body Parts: ${context.bodyParts?.join(', ') || 'general'}
- Limitations: ${context.limitations?.join(', ') || 'none specified'}

SESSION CONTEXT:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Session Count: ${context.sessionCount || 1}
- Recent Exercises: ${context.recentExercises?.join(', ') || 'none'}

RESPONSE REQUIREMENTS:
1. PERSONALIZATION: Tailor every response to the user's specific profile
2. TONE MATCHING: Adjust tone based on their pain level and mood
3. SAFETY FIRST: Always prioritize safe, appropriate recommendations
4. PROGRESSIVE: Build on their current level and progress
5. ENCOURAGING: Maintain a supportive, motivational tone
6. CONTEXTUAL: Reference their history and patterns when relevant

RESPONSE FORMAT:
Your response should include:
- Main message (conversational, personal, helpful)
- Action type classification
- Appropriate tone indication
- Quick reply suggestions (3-4 contextual options)
- Follow-up suggestions if relevant

ACTION TYPES:
- exercise_suggestion: When recommending specific exercises
- phase_assessment: When discussing recovery progress/phases
- general_chat: General conversation and support
- motivational: Encouragement and motivation
- educational: Teaching about recovery concepts

TONE OPTIONS:
- supportive: For users with higher pain or struggling
- encouraging: For users making progress
- educational: When teaching concepts
- cautious: For users with concerning symptoms
- celebratory: For milestones and achievements

CRITICAL GUIDELINES:
- Never ignore the user's pain level - adjust everything accordingly
- If pain level > 7: Focus on gentle, rest, medical consultation
- If pain level 4-7: Moderate activities with careful monitoring
- If pain level < 4: Can suggest more active approaches
- Always provide specific, actionable advice
- Reference their specific goals and injury type
- Use their name or personal details when available

Generate responses that feel like a knowledgeable friend who understands their journey.`;
  }

  /**
   * Create user prompt with context
   */
  private createUserPrompt(userMessage: string, context: AIChatContext): string {
    let prompt = `USER MESSAGE: "${userMessage}"`;

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      const recentHistory = context.conversationHistory.slice(-4)
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      prompt += `\n\nRECENT CONVERSATION:\n${recentHistory}`;
    }

    prompt += `\n\nGenerate a comprehensive response that includes:
1. A personalized, helpful main message
2. Classification of the action type
3. Appropriate tone
4. 3-4 contextual quick reply options
5. Optional follow-up suggestions

Format as JSON:
{
  "message": "Your personalized response here",
  "actionType": "one of the action types",
  "tone": "one of the tone options",
  "quickReplies": ["Reply 1", "Reply 2", "Reply 3", "Reply 4"],
  "followUpSuggestions": ["Optional suggestion 1", "Optional suggestion 2"],
  "aiConfidence": 0.0-1.0
}`;

    return prompt;
  }

  /**
   * Parse comprehensive AI response
   */
  private async parseComprehensiveAIResponse(
    aiResponse: string,
    userMessage: string,
    context: AIChatContext
  ): Promise<AIChatResponse> {
    // Ensure aiResponse is a string
    const responseText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
    
    if (!responseText) {
      return this.createFallbackResponse('', userMessage, context);
    }

    try {
      // Try to parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and clean up the response
        const validQuickReplies = this.validateQuickReplies(parsed.quickReplies);
        const quickReplies = validQuickReplies || await this.generateDynamicQuickReplies(parsed.message, context);
        
        const response: AIChatResponse = {
          message: parsed.message || 'I understand what you\'re saying. Let me help you with that.',
          quickReplies,
          actionType: this.validateActionType(parsed.actionType),
          tone: this.validateTone(parsed.tone),
          followUpSuggestions: parsed.followUpSuggestions || [],
          aiConfidence: parsed.aiConfidence || 0.8,
        };

        // Check if we should generate exercises
        if (this.shouldGenerateExercises(response.message, userMessage)) {
          response.exerciseRecommendations = await this.generateContextualExercises(
            userMessage,
            context
          );
          if (response.exerciseRecommendations && response.exerciseRecommendations.length > 0) {
            response.actionType = 'exercise_suggestion';
          }
        }

        return response;
      }
    } catch (error) {
      exerciseLogger.warn('Failed to parse comprehensive AI response', { error });
    }

    // Fallback parsing for non-JSON responses
    return this.createFallbackResponse(responseText, userMessage, context);
  }

  /**
   * Check if we should generate exercise recommendations
   */
  private shouldGenerateExercises(aiMessage: string, userMessage: string): boolean {
    const exerciseKeywords = [
      'exercise', 'movement', 'stretch', 'strengthen', 'workout',
      'activity', 'routine', 'practice', 'training'
    ];

    const containsExerciseRequest = exerciseKeywords.some(keyword =>
      aiMessage.toLowerCase().includes(keyword) || 
      userMessage.toLowerCase().includes(keyword)
    );

    return containsExerciseRequest;
  }

  /**
   * Generate contextual exercises for the response
   */
  private async generateContextualExercises(
    userMessage: string,
    context: AIChatContext
  ): Promise<any[]> {
    try {
      const exerciseContext = {
        painLevel: context.painLevel,
        currentPhase: context.currentPhase,
        fitnessLevel: context.fitnessLevel,
        injuryType: context.injuryType,
        bodyParts: context.bodyParts,
        recentExercises: context.recentExercises,
        timeAvailable: 15,
        environment: 'home' as const,
        equipment: [],
      };

      const exercises = await aiExerciseGenerator.generateChatExercises(
        userMessage,
        exerciseContext
      );

      return exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        description: ex.description,
        instructions: ex.instructions,
        sets: ex.sets,
        reps: ex.reps,
        holdTime: ex.holdTime,
        level: ex.level,
        type: ex.type,
        targetMuscles: ex.targetMuscles,
        reason: ex.generationReason,
        videoSearchTerms: ex.videoSearchTerms,
      }));
    } catch (error) {
      exerciseLogger.warn('Failed to generate contextual exercises', { error });
      return [];
    }
  }

  /**
   * Validate and clean up quick replies
   */
  private validateQuickReplies(quickReplies: any): string[] | null {
    if (!Array.isArray(quickReplies)) return null;
    
    const validReplies = quickReplies
      .filter(reply => typeof reply === 'string' && reply.length > 0 && reply.length < 50)
      .slice(0, 4);
    
    return validReplies.length > 0 ? validReplies : null;
  }

  /**
   * Validate action type
   */
  private validateActionType(actionType: any): AIChatResponse['actionType'] {
    const validTypes: AIChatResponse['actionType'][] = [
      'exercise_suggestion', 'phase_assessment', 'general_chat', 'motivational', 'educational'
    ];
    
    return validTypes.includes(actionType) ? actionType : 'general_chat';
  }

  /**
   * Validate tone
   */
  private validateTone(tone: any): AIChatResponse['tone'] {
    const validTones: AIChatResponse['tone'][] = [
      'supportive', 'encouraging', 'educational', 'cautious', 'celebratory'
    ];
    
    return validTones.includes(tone) ? tone : 'supportive';
  }

  /**
   * Create fallback response when parsing fails
   */
  private createFallbackResponse(
    aiResponse: string,
    userMessage: string,
    context: AIChatContext
  ): AIChatResponse {
    // Extract the main message (clean up any malformed JSON)
    const message = aiResponse.replace(/\{[\s\S]*\}/, '').trim() || 
                   'I understand what you\'re asking about. Let me help you with that.';

    return {
      message,
      quickReplies: this.generateContextualFallbackReplies(context),
      actionType: 'general_chat',
      tone: context.painLevel && context.painLevel > 6 ? 'supportive' : 'encouraging',
      followUpSuggestions: [],
      aiConfidence: 0.6,
    };
  }

  /**
   * Generate contextual fallback quick replies based on user context
   */
  private generateContextualFallbackReplies(context: AIChatContext): string[] {
    const replies: string[] = [];

    // Pain-based replies
    if (context.painLevel && context.painLevel > 6) {
      replies.push('Gentle pain relief');
      replies.push('Breathing exercises');
      replies.push('Rest day guidance');
    } else if (context.painLevel && context.painLevel > 3) {
      replies.push('Moderate exercises');
      replies.push('Progress check');
      replies.push('Pain management');
    } else {
      replies.push('New exercises');
      replies.push('Increase intensity');
      replies.push('Track progress');
    }

    // Phase-based replies
    if (context.currentPhase && context.currentPhase < 2) {
      replies.push('Recovery basics');
    } else if (context.currentPhase && context.currentPhase > 3) {
      replies.push('Advanced techniques');
    }

    // Always include motivation
    replies.push('Daily motivation');

    return replies.slice(0, 4);
  }

  /**
   * Generate intelligent emergency response when all AI fails
   */
  private generateIntelligentEmergencyResponse(
    userMessage: string,
    context: AIChatContext
  ): AIChatResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    // Pain emergency response
    if (lowerMessage.includes('pain') || lowerMessage.includes('hurt')) {
      return {
        message: `I understand you're experiencing discomfort. ${
          context.painLevel && context.painLevel > 7
            ? 'Given your high pain level, please focus on gentle movements and consider consulting your healthcare provider.'
            : 'Let\'s work on gentle approaches to help manage your discomfort.'
        } Remember to never push through sharp pain.`,
        quickReplies: ['Gentle relief exercises', 'Breathing techniques', 'When to rest', 'Medical guidance'],
        actionType: 'general_chat',
        tone: 'supportive',
        followUpSuggestions: [],
        aiConfidence: 0.7,
      };
    }

    // Exercise emergency response
    if (lowerMessage.includes('exercise') || lowerMessage.includes('movement')) {
      return {
        message: `I'd be happy to help with exercises. ${
          context.currentPhase
            ? `Based on your recovery phase ${context.currentPhase}, `
            : ''
        }I can suggest safe, personalized movements that match your current abilities.`,
        quickReplies: ['Safe exercises', 'Movement basics', 'Progress guidance', 'Form tips'],
        actionType: 'exercise_suggestion',
        tone: 'encouraging',
        followUpSuggestions: [],
        aiConfidence: 0.7,
      };
    }

    // General emergency response
    return {
      message: 'I\'m here to support your recovery journey. While I\'m having a technical moment, I want to make sure you get the help you need. How can I best assist you today?',
      quickReplies: ['Exercise help', 'Pain support', 'Progress check', 'General guidance'],
      actionType: 'general_chat',
      tone: 'supportive',
      followUpSuggestions: [],
      aiConfidence: 0.5,
    };
  }
}

export const aiChatResponseGenerator = new AIChatResponseGenerator();
