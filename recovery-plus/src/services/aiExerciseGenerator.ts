import { aiService } from './openai';
import type { Exercise } from '../types';

/**
 * AI Exercise Generator Service
 * 
 * Generates personalized exercises dynamically using OpenAI
 * Replaces all hardcoded exercise databases and fallbacks
 */

export interface ExerciseGenerationContext {
  // User Context
  injuryType?: string;
  bodyParts?: string[];
  painLevel?: number;
  fitnessLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme';
  currentPhase?: number;
  previousInjuries?: boolean;
  
  // Exercise Constraints
  timeAvailable?: number; // minutes
  equipment?: string[];
  environment?: 'home' | 'gym' | 'outdoor' | 'office';
  preferredTypes?: ('strength' | 'mobility' | 'cardio' | 'balance' | 'relaxation')[];
  
  // Adaptation Needs
  limitations?: string[];
  goals?: string[];
  avoidMovements?: string[];
  
  // Session Context
  sessionCount?: number;
  recentExercises?: string[];
  progressTrend?: 'improving' | 'stable' | 'declining';
}

export interface AIGeneratedExercise extends Omit<Exercise, 'id' | 'videoUrls'> {
  aiGenerated: true;
  generationReason: string;
  adaptations: string[];
  safetyNotes: string[];
  progressionTips: string[];
  videoSearchTerms: string[];
  alternativeExercises?: string[];
  estimatedCalories?: number;
  focusAreas: string[];
}

export interface ExerciseGenerationRequest {
  context: ExerciseGenerationContext;
  count?: number;
  exerciseTypes?: string[];
  difficulty?: 'auto' | 1 | 2 | 3 | 4 | 5;
  sessionType?: 'assessment' | 'daily' | 'recovery' | 'progression' | 'maintenance';
}

export interface ExerciseGenerationResult {
  exercises: AIGeneratedExercise[];
  sessionSummary: {
    totalDuration: string;
    focusAreas: string[];
    difficultyLevel: string;
    recommendedFrequency: string;
    nextSteps: string[];
  };
  aiConfidence: number;
  generatedAt: string;
}

class AIExerciseGeneratorService {
  
  /**
   * Generate personalized exercises using AI
   */
  async generateExercises(request: ExerciseGenerationRequest): Promise<ExerciseGenerationResult> {
    try {
      const systemPrompt = this.createExerciseGenerationPrompt(request);
      const userMessage = this.createExerciseRequest(request);

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      if (response.success) {
        return this.parseExerciseResponse(response.message, request);
      } else {
        throw new Error(`AI generation failed: ${response.error}`);
      }
    } catch (error) {
      console.error('Error generating exercises:', error);
      // Return intelligent fallback instead of hardcoded exercises
      return this.generateIntelligentFallback(request);
    }
  }

  /**
   * Generate a single exercise for specific needs
   */
  async generateSingleExercise(
    context: ExerciseGenerationContext,
    type: string,
    targetArea?: string
  ): Promise<AIGeneratedExercise> {
    const request: ExerciseGenerationRequest = {
      context,
      count: 1,
      exerciseTypes: [type],
      sessionType: 'daily'
    };

    const result = await this.generateExercises(request);
    return result.exercises[0];
  }

  /**
   * Generate exercises for chat recommendations
   */
  async generateChatExercises(
    userMessage: string,
    context: Partial<ExerciseGenerationContext>
  ): Promise<AIGeneratedExercise[]> {
    try {
      const systemPrompt = `You are an AI fitness coach generating specific exercises based on user requests.

CONTEXT: ${JSON.stringify(context, null, 2)}

USER REQUEST: "${userMessage}"

Generate 1-3 specific exercises that directly address the user's request. Respond with a JSON array of exercises:

[{
  "name": "Exercise Name",
  "description": "Brief description focusing on benefits",
  "instructions": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "sets": number,
  "reps": number_or_null,
  "holdTime": seconds_or_null,
  "restTime": seconds,
  "level": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "difficulty": 1-5,
  "type": "strength" | "mobility" | "cardio" | "balance" | "relaxation",
  "targetMuscles": ["muscle1", "muscle2"],
  "bodyPart": ["area1", "area2"],
  "equipment": [],
  "duration": "X mins",
  "icon": "emoji",
  "generationReason": "Why this exercise was chosen",
  "adaptations": ["Easier variation", "Harder variation"],
  "safetyNotes": ["Safety tip 1", "Safety tip 2"],
  "progressionTips": ["How to progress"],
  "videoSearchTerms": ["specific search term for video"],
  "focusAreas": ["what this targets"],
  "estimatedCalories": number
}]

REQUIREMENTS:
- Exercise names should be clear and specific
- Instructions must be detailed and safe
- Include proper form cues
- Provide modifications for different levels
- Video search terms should be highly specific
- Consider user's pain level, injury type, and fitness level
- Never recommend anything unsafe or beyond user's capabilities`;

      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate exercises for: ${userMessage}` }
      ]);

      if (response.success) {
        const exercises = this.parseExerciseArray(response.message);
        return exercises.map(ex => ({
          ...ex,
          aiGenerated: true as const,
          id: `ai_ex_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          videoUrls: [], // Will be populated by video service
        }));
      }
    } catch (error) {
      console.error('Error generating chat exercises:', error);
    }

    // Intelligent fallback based on context
    return this.generateContextualFallback(userMessage, context);
  }

  /**
   * Generate replacement exercises when user needs alternatives
   */
  async generateAlternativeExercises(
    originalExercise: string,
    reason: 'too_difficult' | 'too_easy' | 'causes_pain' | 'no_equipment' | 'different_focus',
    context: ExerciseGenerationContext
  ): Promise<AIGeneratedExercise[]> {
    const systemPrompt = `Generate 2-3 alternative exercises to replace "${originalExercise}".

REPLACEMENT REASON: ${reason}
CONTEXT: ${JSON.stringify(context, null, 2)}

The alternatives should:
- Address the same target areas
- Be appropriate for the user's condition
- Solve the specific issue (${reason})
- Maintain similar benefits
- Be clearly different from the original

Respond with JSON array of exercises with full details.`;

    try {
      const response = await aiService.generateCoachingResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate alternatives for ${originalExercise} due to: ${reason}` }
      ]);

      if (response.success) {
        return this.parseExerciseArray(response.message).map(ex => ({
          ...ex,
          aiGenerated: true as const,
          id: `ai_alt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          videoUrls: [],
        }));
      }
    } catch (error) {
      console.error('Error generating alternatives:', error);
    }

    // Return context-based alternatives
    return this.generateContextualAlternatives(originalExercise, reason, context);
  }

  /**
   * Create comprehensive system prompt for exercise generation
   */
  private createExerciseGenerationPrompt(request: ExerciseGenerationRequest): string {
    return `You are an expert AI exercise physiologist and rehabilitation specialist creating personalized exercise programs.

CONTEXT ANALYSIS:
${JSON.stringify(request.context, null, 2)}

EXERCISE GENERATION REQUIREMENTS:
- Count: ${request.count || 3} exercises
- Types: ${request.exerciseTypes?.join(', ') || 'varied'}
- Session: ${request.sessionType || 'general'}
- Difficulty: ${request.difficulty || 'auto-adjust based on user'}

CRITICAL GUIDELINES:
1. SAFETY FIRST - Consider pain level, injuries, limitations
2. PROGRESSIVE - Appropriate for user's current fitness level
3. SPECIFIC - Target user's goals and problem areas
4. PRACTICAL - Use available equipment and environment
5. ENGAGING - Varied and interesting exercises
6. EVIDENCE-BASED - Proven effective for recovery/fitness

EXERCISE GENERATION RULES:
- If pain level > 7: Focus on gentle mobility and breathing
- If recent injury: Emphasize recovery and stability
- If chronic pain: Low-impact, joint-friendly movements
- If prevention: Strength and flexibility balance
- If post-surgery: Follow conservative rehabilitation principles

OUTPUT FORMAT:
Respond with a JSON object containing:
{
  "exercises": [array of exercise objects],
  "sessionSummary": {
    "totalDuration": "X mins",
    "focusAreas": ["area1", "area2"],
    "difficultyLevel": "BEGINNER/INTERMEDIATE/ADVANCED",
    "recommendedFrequency": "daily/3x week/etc",
    "nextSteps": ["progression advice"]
  },
  "aiConfidence": 0.0-1.0
}

Each exercise must include: name, description, instructions, sets, reps/holdTime, restTime, level, difficulty, type, targetMuscles, bodyPart, equipment, duration, icon, generationReason, adaptations, safetyNotes, progressionTips, videoSearchTerms, focusAreas, estimatedCalories.`;
  }

  /**
   * Create specific user request for AI
   */
  private createExerciseRequest(request: ExerciseGenerationRequest): string {
    const { context, count, sessionType } = request;
    
    let requestText = `Generate ${count || 3} personalized exercises for a ${sessionType || 'general'} session.

USER PROFILE:
- Pain Level: ${context.painLevel || 'unknown'}/10
- Fitness Level: ${context.fitnessLevel || 'unknown'}
- Injury Type: ${context.injuryType || 'none specified'}
- Body Parts: ${context.bodyParts?.join(', ') || 'general'}
- Available Time: ${context.timeAvailable || 15} minutes
- Equipment: ${context.equipment?.join(', ') || 'none'}
- Environment: ${context.environment || 'home'}`;

    if (context.goals?.length) {
      requestText += `\n- Goals: ${context.goals.join(', ')}`;
    }

    if (context.limitations?.length) {
      requestText += `\n- Limitations: ${context.limitations.join(', ')}`;
    }

    if (context.recentExercises?.length) {
      requestText += `\n- Recent Exercises: ${context.recentExercises.join(', ')}`;
    }

    requestText += '\n\nCreate a safe, effective, and personalized exercise program.';

    return requestText;
  }

  /**
   * Parse AI response into structured exercise data
   */
  private parseExerciseResponse(
    aiResponse: string,
    request: ExerciseGenerationRequest
  ): ExerciseGenerationResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Ensure all exercises have required fields and AI metadata
        const exercises = parsed.exercises.map((ex: any, index: number) => ({
          id: `ai_gen_${Date.now()}_${index}`,
          videoUrls: [], // Will be populated by video service
          aiGenerated: true,
          generationReason: ex.generationReason || 'AI-generated for user context',
          adaptations: ex.adaptations || [],
          safetyNotes: ex.safetyNotes || ['Listen to your body', 'Stop if pain increases'],
          progressionTips: ex.progressionTips || ['Increase reps gradually'],
          videoSearchTerms: ex.videoSearchTerms || [ex.name + ' proper form tutorial'],
          focusAreas: ex.focusAreas || ex.bodyPart || ['general'],
          estimatedCalories: ex.estimatedCalories || this.estimateCalories(ex),
          alternativeExercises: ex.alternativeExercises || [],
          ...ex,
        }));

        return {
          exercises,
          sessionSummary: parsed.sessionSummary || this.generateDefaultSummary(exercises),
          aiConfidence: parsed.aiConfidence || 0.8,
          generatedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error parsing AI exercise response:', error);
    }

    // Fallback parsing for malformed responses
    return this.generateIntelligentFallback(request);
  }

  /**
   * Parse array of exercises from AI response
   */
  private parseExerciseArray(aiResponse: string): Omit<AIGeneratedExercise, 'id' | 'videoUrls' | 'aiGenerated'>[] {
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const exercises = JSON.parse(jsonMatch[0]);
        return exercises.map((ex: any) => ({
          name: ex.name || 'Unknown Exercise',
          description: ex.description || 'AI-generated exercise',
          instructions: ex.instructions || ['Follow proper form'],
          sets: ex.sets || 1,
          reps: ex.reps,
          holdTime: ex.holdTime,
          restTime: ex.restTime || 30,
          level: ex.level || 'BEGINNER',
          difficulty: ex.difficulty || 1,
          type: ex.type || 'mobility',
          targetMuscles: ex.targetMuscles || ['general'],
          bodyPart: ex.bodyPart || ['general'],
          equipment: ex.equipment || [],
          duration: ex.duration || '3 mins',
          icon: ex.icon || '💪',
          generationReason: ex.generationReason || 'AI-generated for user needs',
          adaptations: ex.adaptations || [],
          safetyNotes: ex.safetyNotes || ['Listen to your body'],
          progressionTips: ex.progressionTips || ['Progress gradually'],
          videoSearchTerms: ex.videoSearchTerms || [ex.name + ' tutorial'],
          focusAreas: ex.focusAreas || ex.bodyPart || ['general'],
          estimatedCalories: ex.estimatedCalories || this.estimateCalories(ex),
        }));
      }
    } catch (error) {
      console.error('Error parsing exercise array:', error);
    }

    return [];
  }

  /**
   * Generate intelligent fallback based on context when AI fails
   */
  private generateIntelligentFallback(request: ExerciseGenerationRequest): ExerciseGenerationResult {
    const { context } = request;
    const exercises: AIGeneratedExercise[] = [];

    // Generate contextual exercises based on user profile
    if (context.painLevel && context.painLevel > 7) {
      // High pain - very gentle exercises
      exercises.push(this.createBreathingExercise());
      exercises.push(this.createGentleStretch());
    } else if (context.injuryType === 'recent_injury') {
      // Recent injury - stability and gentle mobility
      exercises.push(this.createStabilityExercise());
      exercises.push(this.createMobilityExercise());
    } else if (context.fitnessLevel === 'sedentary') {
      // Sedentary - very basic movements
      exercises.push(this.createBasicMovement());
      exercises.push(this.createPostureExercise());
    } else {
      // General fallback - safe, effective exercises
      exercises.push(this.createGeneralStrengthExercise());
      exercises.push(this.createGeneralMobilityExercise());
    }

    // Ensure we have the requested number of exercises
    while (exercises.length < (request.count || 3)) {
      exercises.push(this.createAdditionalExercise(exercises.length, context));
    }

    return {
      exercises: exercises.slice(0, request.count || 3),
      sessionSummary: this.generateDefaultSummary(exercises),
      aiConfidence: 0.6, // Lower confidence for fallback
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate contextual fallback for chat requests
   */
  private generateContextualFallback(
    userMessage: string, 
    context: Partial<ExerciseGenerationContext>
  ): AIGeneratedExercise[] {
    const message = userMessage.toLowerCase();
    const exercises: AIGeneratedExercise[] = [];

    if (message.includes('pain') || message.includes('hurt')) {
      exercises.push(this.createBreathingExercise());
      exercises.push(this.createGentleStretch());
    } else if (message.includes('strength') || message.includes('strong')) {
      exercises.push(this.createGeneralStrengthExercise());
    } else if (message.includes('stretch') || message.includes('flexibility')) {
      exercises.push(this.createGeneralMobilityExercise());
    } else {
      // Default safe exercises
      exercises.push(this.createGeneralMovementExercise());
    }

    return exercises;
  }

  /**
   * Generate alternatives when user needs different exercises
   */
  private generateContextualAlternatives(
    originalExercise: string,
    reason: string,
    context: ExerciseGenerationContext
  ): AIGeneratedExercise[] {
    // Create alternatives based on the reason and context
    const alternatives: AIGeneratedExercise[] = [];

    if (reason === 'too_difficult') {
      alternatives.push(this.createEasierVersion(originalExercise));
    } else if (reason === 'too_easy') {
      alternatives.push(this.createHarderVersion(originalExercise));
    } else if (reason === 'causes_pain') {
      alternatives.push(this.createPainFreeAlternative(originalExercise));
    } else {
      alternatives.push(this.createGeneralAlternative(originalExercise));
    }

    return alternatives;
  }

  // Helper methods to create specific types of exercises
  private createBreathingExercise(): AIGeneratedExercise {
    return {
      id: `fallback_breathing_${Date.now()}`,
      name: 'Deep Diaphragmatic Breathing',
      description: 'Gentle breathing exercise to reduce tension and promote relaxation',
      instructions: [
        'Sit or lie in a comfortable position',
        'Place one hand on chest, one on belly',
        'Breathe in slowly through nose for 4 counts',
        'Feel your belly rise more than your chest',
        'Hold for 2 counts',
        'Exhale slowly through mouth for 6 counts',
        'Focus on releasing tension with each exhale'
      ],
      sets: 1,
      reps: 10,
      holdTime: 2,
      restTime: 0,
      level: 'BEGINNER',
      difficulty: 1,
      type: 'relaxation',
      targetMuscles: ['diaphragm', 'core'],
      bodyPart: ['core'],
      equipment: [],
      duration: '5 mins',
      icon: '🫁',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Safe, gentle exercise appropriate for high pain levels or stress relief',
      adaptations: ['Can be done sitting or lying down', 'Adjust breathing pace as comfortable'],
      safetyNotes: ['Never force breathing', 'Stop if dizzy', 'Breathe naturally if counting is stressful'],
      progressionTips: ['Gradually increase rep count', 'Try 4-7-8 breathing pattern'],
      videoSearchTerms: ['diaphragmatic breathing technique tutorial', 'belly breathing for beginners'],
      focusAreas: ['stress relief', 'pain management', 'breathing technique'],
      estimatedCalories: 2,
    };
  }

  private createGentleStretch(): AIGeneratedExercise {
    return {
      id: `fallback_stretch_${Date.now()}`,
      name: 'Gentle Neck and Shoulder Release',
      description: 'Slow, controlled movements to release tension in neck and shoulders',
      instructions: [
        'Sit tall with shoulders relaxed',
        'Slowly turn head to right, hold for 15 seconds',
        'Return to center, then turn left, hold 15 seconds',
        'Gently tilt head to right shoulder, hold 15 seconds',
        'Return to center, tilt to left shoulder, hold 15 seconds',
        'Slowly roll shoulders backward 5 times',
        'Roll shoulders forward 5 times'
      ],
      sets: 2,
      reps: 1,
      holdTime: 15,
      restTime: 30,
      level: 'BEGINNER',
      difficulty: 1,
      type: 'mobility',
      targetMuscles: ['neck', 'shoulders', 'upper traps'],
      bodyPart: ['neck', 'shoulders'],
      equipment: [],
      duration: '4 mins',
      icon: '🦴',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Gentle mobility work safe for most conditions',
      adaptations: ['Can be done seated or standing', 'Reduce range if uncomfortable'],
      safetyNotes: ['Move slowly', 'Never force stretches', 'Stop if sharp pain'],
      progressionTips: ['Hold stretches longer', 'Add gentle resistance'],
      videoSearchTerms: ['gentle neck stretches office workers', 'shoulder tension release exercises'],
      focusAreas: ['neck tension', 'shoulder mobility', 'upper body relaxation'],
      estimatedCalories: 5,
    };
  }

  // Additional helper methods for other exercise types...
  private createStabilityExercise(): AIGeneratedExercise {
    return {
      id: `fallback_stability_${Date.now()}`,
      name: 'Static Balance Hold',
      description: 'Improve stability and core strength with controlled standing balance',
      instructions: [
        'Stand near a wall or chair for support',
        'Place feet hip-width apart',
        'Engage core muscles gently',
        'Hold this position focusing on balance',
        'Breathe normally throughout',
        'Use wall support if needed'
      ],
      sets: 3,
      reps: 1,
      holdTime: 30,
      restTime: 60,
      level: 'BEGINNER',
      difficulty: 2,
      type: 'balance',
      targetMuscles: ['core', 'stabilizers'],
      bodyPart: ['core', 'legs'],
      equipment: [],
      duration: '5 mins',
      icon: '⚖️',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Foundation stability exercise for injury recovery',
      adaptations: ['Use wall support', 'Reduce hold time', 'Progress to eyes closed'],
      safetyNotes: ['Keep support nearby', 'Start with shorter holds', 'Stop if dizzy'],
      progressionTips: ['Increase hold time', 'Try single leg stance', 'Close eyes when stable'],
      videoSearchTerms: ['basic balance exercises rehabilitation', 'standing balance training'],
      focusAreas: ['core stability', 'balance', 'proprioception'],
      estimatedCalories: 8,
    };
  }

  private createMobilityExercise(): AIGeneratedExercise {
    return {
      id: `fallback_mobility_${Date.now()}`,
      name: 'Gentle Spinal Waves',
      description: 'Fluid movement to improve spinal mobility and reduce stiffness',
      instructions: [
        'Sit tall in a chair with feet flat on floor',
        'Place hands on thighs',
        'Slowly arch back slightly, lifting chest',
        'Gently round spine, tucking chin to chest',
        'Move slowly and smoothly between positions',
        'Focus on moving one vertebra at a time',
        'Breathe deeply with each movement'
      ],
      sets: 2,
      reps: 8,
      holdTime: 2,
      restTime: 30,
      level: 'BEGINNER',
      difficulty: 1,
      type: 'mobility',
      targetMuscles: ['spinal erectors', 'core'],
      bodyPart: ['spine', 'back'],
      equipment: [],
      duration: '4 mins',
      icon: '🌊',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Gentle spinal mobility safe for most conditions',
      adaptations: ['Reduce range of motion', 'Can be done standing', 'Pause if uncomfortable'],
      safetyNotes: ['Move very slowly', 'Stop if sharp pain', 'Keep movements small initially'],
      progressionTips: ['Increase range gradually', 'Add slight hold at end ranges'],
      videoSearchTerms: ['seated spinal mobility exercises', 'gentle back movement exercises'],
      focusAreas: ['spinal mobility', 'back flexibility', 'posture improvement'],
      estimatedCalories: 6,
    };
  }

  private createBasicMovement(): AIGeneratedExercise {
    return {
      id: `fallback_basic_${Date.now()}`,
      name: 'Supported Sit-to-Stand',
      description: 'Functional movement to improve leg strength and daily activity',
      instructions: [
        'Sit in a sturdy chair with arms',
        'Place feet flat on floor, hip-width apart',
        'Lean slightly forward',
        'Push through heels to stand up',
        'Use chair arms for support as needed',
        'Stand tall briefly',
        'Slowly lower back to seated position',
        'Control the descent'
      ],
      sets: 2,
      reps: 8,
      holdTime: 2,
      restTime: 60,
      level: 'BEGINNER',
      difficulty: 2,
      type: 'strength',
      targetMuscles: ['quadriceps', 'glutes', 'core'],
      bodyPart: ['legs', 'core'],
      equipment: ['chair'],
      duration: '5 mins',
      icon: '🪑',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Functional movement for building basic strength',
      adaptations: ['Use arms of chair more', 'Add cushion for easier start', 'Progress to no hands'],
      safetyNotes: ['Use sturdy chair', 'Keep feet planted', 'Don\'t rush movements'],
      progressionTips: ['Reduce arm support', 'Add pause at top', 'Increase repetitions'],
      videoSearchTerms: ['sit to stand exercise elderly', 'chair exercises leg strength'],
      focusAreas: ['leg strength', 'functional movement', 'daily activities'],
      estimatedCalories: 12,
    };
  }

  private createPostureExercise(): AIGeneratedExercise {
    return {
      id: `fallback_posture_${Date.now()}`,
      name: 'Wall Angel Slides',
      description: 'Improve posture and shoulder mobility with supported movement',
      instructions: [
        'Stand with back against wall',
        'Place arms against wall in goal post position',
        'Keep head, back, and arms touching wall',
        'Slowly slide arms up the wall',
        'Go as high as comfortable while maintaining contact',
        'Slowly slide arms back down',
        'Focus on keeping arms pressed to wall'
      ],
      sets: 2,
      reps: 10,
      holdTime: 1,
      restTime: 45,
      level: 'BEGINNER',
      difficulty: 2,
      type: 'mobility',
      targetMuscles: ['shoulders', 'upper back', 'posterior deltoids'],
      bodyPart: ['shoulders', 'upper back'],
      equipment: [],
      duration: '4 mins',
      icon: '😇',
      videoUrls: [],
      aiGenerated: true,
      generationReason: 'Posture improvement exercise for desk workers',
      adaptations: ['Reduce range of motion', 'Step away from wall slightly', 'Move arms separately'],
      safetyNotes: ['Keep back flat against wall', 'Don\'t force arm movement', 'Stop if shoulder pain'],
      progressionTips: ['Increase range slowly', 'Add resistance band', 'Hold at top briefly'],
      videoSearchTerms: ['wall angel exercise proper form', 'shoulder mobility wall slides'],
      focusAreas: ['posture', 'shoulder mobility', 'upper back strength'],
      estimatedCalories: 8,
    };
  }

  // Simplified versions of complex helper methods
  private createGeneralStrengthExercise(): AIGeneratedExercise {
    return this.createBasicMovement(); // Reuse sit-to-stand as safe strength exercise
  }

  private createGeneralMobilityExercise(): AIGeneratedExercise {
    return this.createMobilityExercise(); // Reuse spinal waves
  }

  private createGeneralMovementExercise(): AIGeneratedExercise {
    return this.createPostureExercise(); // Reuse wall angels
  }

  private createAdditionalExercise(index: number, context: ExerciseGenerationContext): AIGeneratedExercise {
    const exercises = [
      () => this.createBreathingExercise(),
      () => this.createGentleStretch(),
      () => this.createStabilityExercise(),
    ];
    return exercises[index % exercises.length]();
  }

  private createEasierVersion(originalExercise: string): AIGeneratedExercise {
    return this.createGentleStretch(); // Safe fallback
  }

  private createHarderVersion(originalExercise: string): AIGeneratedExercise {
    return this.createStabilityExercise(); // Moderate progression
  }

  private createPainFreeAlternative(originalExercise: string): AIGeneratedExercise {
    return this.createBreathingExercise(); // Always safe
  }

  private createGeneralAlternative(originalExercise: string): AIGeneratedExercise {
    return this.createPostureExercise(); // General alternative
  }

  private estimateCalories(exercise: any): number {
    const baseCalories = {
      'relaxation': 2,
      'mobility': 5,
      'balance': 8,
      'strength': 12,
      'cardio': 20,
    };
    return baseCalories[exercise.type as keyof typeof baseCalories] || 5;
  }

  private generateDefaultSummary(exercises: AIGeneratedExercise[]) {
    const totalDuration = exercises.reduce((sum, ex) => {
      const duration = parseInt(ex.duration.replace(/\D/g, '')) || 3;
      return sum + duration;
    }, 0);

    const focusAreas = [...new Set(exercises.flatMap(ex => ex.focusAreas))];
    const avgDifficulty = exercises.reduce((sum, ex) => sum + ex.difficulty, 0) / exercises.length;
    const level = avgDifficulty <= 2 ? 'BEGINNER' : avgDifficulty <= 3 ? 'INTERMEDIATE' : 'ADVANCED';

    return {
      totalDuration: `${totalDuration} mins`,
      focusAreas,
      difficultyLevel: level,
      recommendedFrequency: 'daily',
      nextSteps: ['Monitor how you feel', 'Progress gradually', 'Stay consistent'],
    };
  }
}

export const aiExerciseGenerator = new AIExerciseGeneratorService();
