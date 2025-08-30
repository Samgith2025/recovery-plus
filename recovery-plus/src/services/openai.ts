import OpenAI from 'openai';

const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

if (!apiKey) {
  console.warn('Missing OpenAI API key in environment variables');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

// AI Coaching Service
export const aiService = {
  // Generate AI response for recovery coaching
  generateCoachingResponse: async (
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    userContext?: {
      questionnaireData?: Record<string, unknown>;
      currentPhase?: number;
      painLevel?: number;
    }
  ) => {
    try {
      const systemPrompt = `You are a helpful AI recovery coach for an app called Recovery+. 
      
      IMPORTANT GUIDELINES:
      - You are NOT a licensed medical professional, physiotherapist, or doctor
      - Always remind users to consult healthcare professionals for serious concerns
      - Use supportive, encouraging language focused on gradual recovery
      - Avoid medical diagnoses or specific treatment recommendations
      - Focus on general wellness, movement, and recovery support
      - Suggest gentle exercises and movements, not aggressive treatments
      
      Current user context: ${JSON.stringify(userContext || {})}
      
      Keep responses helpful, supportive, and focused on gradual recovery progress.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return {
        success: true,
        message:
          completion.choices[0]?.message?.content ||
          'Sorry, I could not generate a response.',
        usage: completion.usage,
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        message:
          'Sorry, I am having trouble connecting right now. Please try again later.',
        error: error.message,
      };
    }
  },

  // Generate exercise recommendations based on user profile
  generateExerciseRecommendations: async (userProfile: {
    painAreas: string[];
    painLevel: number;
    activityLevel: string;
    limitations?: string[];
  }) => {
    try {
      const prompt = `Based on this user profile, suggest 3-5 gentle exercises or movements that could help with recovery:
      
      Pain areas: ${userProfile.painAreas.join(', ')}
      Current pain level (1-10): ${userProfile.painLevel}
      Activity level: ${userProfile.activityLevel}
      Limitations: ${userProfile.limitations?.join(', ') || 'None specified'}
      
      Provide exercises that are:
      - Safe and gentle for beginners
      - Appropriate for the pain level
      - Focus on mobility and basic strength
      - Include hold times, reps, or duration
      
      Format as a JSON array with title, description, instructions, and safety notes.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.5,
      });

      const response = completion.choices[0]?.message?.content || '[]';

      try {
        const exercises = JSON.parse(response);
        return {
          success: true,
          exercises,
          usage: completion.usage,
        };
      } catch {
        return {
          success: false,
          message: 'Could not parse exercise recommendations',
          error: 'Parse error',
        };
      }
    } catch (error: any) {
      console.error('OpenAI exercise generation error:', error);
      return {
        success: false,
        message: 'Could not generate exercise recommendations',
        error: error.message,
      };
    }
  },

  // Analyze questionnaire responses to determine recovery phase
  analyzeQuestionnaireForPhase: async (
    questionnaireData: Record<string, unknown>
  ) => {
    try {
      const prompt = `Based on this questionnaire response, determine the appropriate recovery phase (1-5) and provide reasoning:
      
      Questionnaire data: ${JSON.stringify(questionnaireData)}
      
      Phase guidelines:
      1 - Initial Assessment: New injury, high pain, limited mobility
      2 - Foundation Building: Reduced pain, basic movement possible
      3 - Progressive Loading: Moderate pain, increasing activity tolerance
      4 - Functional Recovery: Low pain, returning to daily activities
      5 - Performance Optimization: Minimal pain, preparing for full activity
      
      Respond with JSON: {"phase": number, "reasoning": "explanation", "recommendations": ["list", "of", "next", "steps"]}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || '{}';

      try {
        const analysis = JSON.parse(response);
        return {
          success: true,
          analysis,
          usage: completion.usage,
        };
      } catch {
        return {
          success: false,
          message: 'Could not parse phase analysis',
          error: 'Parse error',
        };
      }
    } catch (error: any) {
      console.error('OpenAI phase analysis error:', error);
      return {
        success: false,
        message: 'Could not analyze questionnaire data',
        error: error.message,
      };
    }
  },
};
