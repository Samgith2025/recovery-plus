import type {
  QuestionnaireConfig,
  MultipleChoiceBuilder,
  SingleChoiceBuilder,
  ScaleBuilder,
  PainScaleBuilder,
  TextBuilder,
  BooleanBuilder,
  BodyAreasBuilder,
  DemographicsBuilder,
} from '../types/questionnaire';

/**
 * RECOVERY+ DISCOVERY QUESTIONNAIRE CONFIGURATION
 *
 * This file contains all questionnaire configurations.
 * You can easily add, edit, or remove questions by modifying the sections below.
 *
 * EDITING GUIDE:
 * 1. To add a question: Add a new object to the questions array in any section
 * 2. To remove a question: Delete the entire question object
 * 3. To modify a question: Edit the properties of the question object
 * 4. To reorder questions: Move the question objects up or down in the array
 * 5. To add a new section: Add a new object to the sections array
 *
 * QUESTION TYPES:
 * - single_choice: User selects one option
 * - multiple_choice: User can select multiple options
 * - scale: Number scale (e.g., 1-10)
 * - pain_scale: Special 0-10 pain scale with emojis
 * - text: Free text input
 * - boolean: Yes/No question
 * - body_areas: Body part selector
 * - demographics: Age, gender, height, weight, etc.
 */

export const DISCOVERY_QUESTIONNAIRE: QuestionnaireConfig = {
  id: 'discovery_v1',
  title: 'Recovery Assessment',
  description:
    'Help us understand your injury and create a personalized recovery plan',
  version: '1.0.0',

  settings: {
    allowBack: true,
    showProgress: true,
    autoSave: true,
    completionMessage:
      "Great! We've created your personalized recovery plan. Let's get started!",
  },

  sections: [
    // SECTION 1: BASIC INFORMATION
    {
      id: 'basic_info',
      title: 'Tell Us About Yourself',
      description:
        'We need some basic information to personalize your recovery plan',
      questions: [
        {
          id: 'demographics',
          type: 'demographics',
          title: 'Personal Information',
          subtitle: 'This helps us create age and body-appropriate exercises',
          helpText: 'All information is private and secure',
          required: true,
          metadata: {
            fields: ['age', 'gender', 'height', 'weight', 'activity_level'],
          },
        } as DemographicsBuilder,

        {
          id: 'fitness_level',
          type: 'single_choice',
          title: 'How would you describe your current fitness level?',
          subtitle: 'Be honest - this helps us start at the right intensity',
          required: true,
          options: [
            {
              label: 'Sedentary',
              value: 'sedentary',
              description: 'Little to no regular exercise',
            },
            {
              label: 'Lightly Active',
              value: 'light',
              description: '1-3 days per week of light exercise',
            },
            {
              label: 'Moderately Active',
              value: 'moderate',
              description: '3-5 days per week of moderate exercise',
            },
            {
              label: 'Very Active',
              value: 'active',
              description: '6-7 days per week of intense exercise',
            },
            {
              label: 'Extremely Active',
              value: 'extreme',
              description: 'Professional athlete or equivalent',
            },
          ],
        } as SingleChoiceBuilder,

        {
          id: 'previous_injuries',
          type: 'boolean',
          title: 'Have you had any previous injuries to this area?',
          subtitle: 'Previous injuries can affect recovery approach',
          required: true,
          trueLabel: "Yes, I've had previous injuries",
          falseLabel: 'No, this is my first injury here',
        } as BooleanBuilder,
      ],
    },

    // SECTION 2: INJURY DETAILS
    {
      id: 'injury_details',
      title: 'About Your Injury',
      description: "Help us understand what happened and how you're feeling",
      questions: [
        {
          id: 'affected_body_areas',
          type: 'body_areas',
          title: 'Which areas of your body are affected?',
          subtitle: 'Select all areas where you feel pain or discomfort',
          helpText: 'Tap on the body diagram to select affected areas',
          required: true,
          maxSelections: 5,
        } as BodyAreasBuilder,

        {
          id: 'injury_type',
          type: 'single_choice',
          title: 'What type of injury or condition do you have?',
          required: true,
          options: [
            {
              label: 'Acute Injury',
              value: 'acute',
              description: 'Recent injury from a specific incident',
            },
            {
              label: 'Chronic Pain',
              value: 'chronic',
              description: 'Ongoing pain lasting more than 3 months',
            },
            {
              label: 'Overuse Injury',
              value: 'overuse',
              description: 'Gradual onset from repetitive activity',
            },
            {
              label: 'Post-Surgery Recovery',
              value: 'post_surgery',
              description: 'Recovering from a surgical procedure',
            },
            {
              label: 'General Stiffness/Mobility',
              value: 'mobility',
              description: 'Stiffness or reduced range of motion',
            },
            {
              label: 'Other/Unsure',
              value: 'other',
              description: 'Not sure or different type',
            },
          ],
        } as SingleChoiceBuilder,

        {
          id: 'injury_duration',
          type: 'single_choice',
          title: 'How long have you been experiencing this issue?',
          required: true,
          options: [
            { label: 'Less than 1 week', value: 'less_1_week' },
            { label: '1-2 weeks', value: '1_2_weeks' },
            { label: '2-4 weeks', value: '2_4_weeks' },
            { label: '1-3 months', value: '1_3_months' },
            { label: '3-6 months', value: '3_6_months' },
            { label: '6+ months', value: '6_plus_months' },
          ],
        } as SingleChoiceBuilder,

        {
          id: 'current_pain_level',
          type: 'pain_scale',
          title: 'What is your current pain level?',
          subtitle: '0 = No pain, 10 = Worst pain imaginable',
          helpText: 'Think about your pain right now, at rest',
          required: true,
        } as PainScaleBuilder,

        {
          id: 'pain_during_activity',
          type: 'pain_scale',
          title: 'What is your pain level during normal daily activities?',
          subtitle: 'Walking, sitting, basic movements',
          required: true,
        } as PainScaleBuilder,
      ],
    },

    // SECTION 3: SYMPTOMS & LIMITATIONS
    {
      id: 'symptoms',
      title: 'Symptoms & Limitations',
      description: 'Let us know how this is affecting your daily life',
      questions: [
        {
          id: 'primary_symptoms',
          type: 'multiple_choice',
          title: 'What symptoms are you experiencing?',
          subtitle: 'Select all that apply',
          required: true,
          maxSelections: 8,
          options: [
            { label: 'Sharp/Stabbing Pain', value: 'sharp_pain' },
            { label: 'Dull/Aching Pain', value: 'dull_pain' },
            { label: 'Burning Sensation', value: 'burning' },
            { label: 'Stiffness', value: 'stiffness' },
            { label: 'Swelling', value: 'swelling' },
            { label: 'Numbness', value: 'numbness' },
            { label: 'Tingling', value: 'tingling' },
            { label: 'Weakness', value: 'weakness' },
            { label: 'Limited Range of Motion', value: 'limited_rom' },
            { label: 'Muscle Spasms', value: 'spasms' },
          ],
        } as MultipleChoiceBuilder,

        {
          id: 'pain_triggers',
          type: 'multiple_choice',
          title: 'What makes your pain worse?',
          subtitle:
            'Select all activities or situations that increase your pain',
          required: true,
          options: [
            { label: 'Sitting for long periods', value: 'prolonged_sitting' },
            { label: 'Standing for long periods', value: 'prolonged_standing' },
            { label: 'Walking', value: 'walking' },
            { label: 'Bending forward', value: 'bending_forward' },
            { label: 'Lifting objects', value: 'lifting' },
            { label: 'Twisting movements', value: 'twisting' },
            { label: 'Getting up from bed/chair', value: 'getting_up' },
            { label: 'Coughing/sneezing', value: 'coughing' },
            { label: 'Cold weather', value: 'cold_weather' },
            { label: 'Stress', value: 'stress' },
            { label: 'Morning stiffness', value: 'morning_stiffness' },
            { label: 'Evening/fatigue', value: 'evening_fatigue' },
          ],
        } as MultipleChoiceBuilder,

        {
          id: 'daily_limitations',
          type: 'multiple_choice',
          title: 'Which daily activities are difficult for you?',
          subtitle: 'Select activities that you avoid or have trouble with',
          required: true,
          options: [
            { label: 'Getting dressed', value: 'dressing' },
            { label: 'Household chores', value: 'chores' },
            { label: 'Work tasks', value: 'work' },
            { label: 'Exercise/sports', value: 'exercise' },
            { label: 'Sleeping', value: 'sleeping' },
            { label: 'Driving', value: 'driving' },
            { label: 'Climbing stairs', value: 'stairs' },
            { label: 'Carrying groceries', value: 'carrying' },
            { label: 'Playing with children/pets', value: 'playing' },
            { label: 'Social activities', value: 'social' },
          ],
        } as MultipleChoiceBuilder,
      ],
    },

    // SECTION 4: GOALS & PREFERENCES
    {
      id: 'goals',
      title: 'Your Recovery Goals',
      description: 'What would you like to achieve through your recovery?',
      questions: [
        {
          id: 'primary_goals',
          type: 'multiple_choice',
          title: 'What are your main recovery goals?',
          subtitle: 'Select your top priorities (up to 5)',
          required: true,
          maxSelections: 5,
          options: [
            { label: 'Reduce pain', value: 'reduce_pain' },
            { label: 'Improve flexibility', value: 'flexibility' },
            { label: 'Increase strength', value: 'strength' },
            { label: 'Better posture', value: 'posture' },
            { label: 'Return to sports', value: 'sports' },
            { label: 'Improve sleep', value: 'sleep' },
            { label: 'Reduce stiffness', value: 'reduce_stiffness' },
            { label: 'Prevent future injury', value: 'prevention' },
            { label: 'Improve daily function', value: 'daily_function' },
            { label: 'Build confidence', value: 'confidence' },
          ],
        } as MultipleChoiceBuilder,

        {
          id: 'time_commitment',
          type: 'single_choice',
          title:
            'How much time can you realistically commit to exercises daily?',
          subtitle:
            'Be realistic - consistency is more important than duration',
          required: true,
          options: [
            { label: '5-10 minutes', value: '5_10_min' },
            { label: '10-15 minutes', value: '10_15_min' },
            { label: '15-30 minutes', value: '15_30_min' },
            { label: '30-45 minutes', value: '30_45_min' },
            { label: '45+ minutes', value: '45_plus_min' },
          ],
        } as SingleChoiceBuilder,

        {
          id: 'preferred_exercise_style',
          type: 'single_choice',
          title: 'What exercise style do you prefer?',
          subtitle: 'This helps us choose the right approach for you',
          required: true,
          options: [
            {
              label: 'Gentle & Gradual',
              value: 'gentle',
              description: 'Slow, careful movements with lots of rest',
            },
            {
              label: 'Structured & Progressive',
              value: 'structured',
              description: 'Clear steps with gradual increases',
            },
            {
              label: 'Varied & Dynamic',
              value: 'varied',
              description: 'Different exercises to keep it interesting',
            },
            {
              label: 'Minimal & Efficient',
              value: 'minimal',
              description: 'Short, focused sessions',
            },
          ],
        } as SingleChoiceBuilder,

        {
          id: 'motivation_level',
          type: 'scale',
          title: 'How motivated are you to do daily exercises?',
          subtitle:
            "Be honest - we'll adapt the program to your motivation level",
          required: true,
          min: 1,
          max: 10,
          minLabel: 'Not motivated',
          maxLabel: 'Very motivated',
        } as ScaleBuilder,
      ],
    },

    // SECTION 5: MEDICAL HISTORY (Optional but recommended)
    {
      id: 'medical_history',
      title: 'Medical History',
      description:
        'Optional information to help us create the safest program for you',
      optional: true,
      questions: [
        {
          id: 'current_treatments',
          type: 'multiple_choice',
          title: 'Are you currently receiving any treatments?',
          subtitle: 'Select all that apply (optional)',
          required: false,
          options: [
            { label: 'Physical therapy', value: 'physical_therapy' },
            { label: 'Chiropractic care', value: 'chiropractic' },
            { label: 'Massage therapy', value: 'massage' },
            { label: 'Acupuncture', value: 'acupuncture' },
            { label: 'Medication for pain', value: 'pain_medication' },
            { label: 'Injections', value: 'injections' },
            { label: 'None of the above', value: 'none' },
          ],
        } as MultipleChoiceBuilder,

        {
          id: 'medical_clearance',
          type: 'boolean',
          title: 'Has a healthcare provider cleared you for exercise?',
          subtitle:
            'If unsure, consult your doctor before starting any exercise program',
          required: false,
          trueLabel: "Yes, I'm cleared for exercise",
          falseLabel: "No or I'm not sure",
        } as BooleanBuilder,

        {
          id: 'additional_notes',
          type: 'text',
          title: "Anything else you'd like us to know?",
          subtitle:
            'Any additional information that might help us create a better program for you',
          helpText: 'Optional: concerns, questions, specific needs, etc.',
          required: false,
          placeholder: 'Share any additional details...',
          multiline: true,
          maxLength: 500,
        } as TextBuilder,
      ],
    },
  ],

  metadata: {
    createdBy: 'Recovery+ Team',
    createdAt: new Date().toISOString(),
    tags: ['discovery', 'assessment', 'intake'],
  },
};

/**
 * ADDING NEW QUESTIONNAIRES:
 *
 * To add a new questionnaire, create a new object following the same pattern:
 *
 * export const MY_NEW_QUESTIONNAIRE: QuestionnaireConfig = {
 *   id: 'my_questionnaire_v1',
 *   title: 'My Questionnaire Title',
 *   // ... rest of configuration
 * };
 *
 * Then add it to the registry below.
 */

// Registry of all available questionnaires
export const QUESTIONNAIRE_REGISTRY = {
  discovery: DISCOVERY_QUESTIONNAIRE,
  // Add new questionnaires here
} as const;

// Default questionnaire for new users
export const DEFAULT_QUESTIONNAIRE_ID = 'discovery' as const;
