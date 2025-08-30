# Questionnaire System - Easy Editing Guide

## How to Add/Edit Questions

### 1. Open the Configuration File
Edit: `src/config/questionnaires.ts`

### 2. Add a New Question
Simply add a new object to any section's `questions` array:

```typescript
// Add this to any section in questionnaires.ts
{
  id: 'my_new_question',
  type: 'single_choice',
  title: 'How often do you exercise?',
  subtitle: 'Think about your average week',
  required: true,
  options: [
    { label: 'Never', value: 'never' },
    { label: '1-2 times', value: '1_2_times' },
    { label: '3-4 times', value: '3_4_times' },
    { label: '5+ times', value: '5_plus_times' }
  ]
} as SingleChoiceBuilder,
```

### 3. Question Types Available

#### Single Choice (Radio Button)
```typescript
{
  id: 'favorite_color',
  type: 'single_choice',
  title: 'What is your favorite color?',
  required: true,
  options: [
    { label: 'Red', value: 'red' },
    { label: 'Blue', value: 'blue' },
    { label: 'Green', value: 'green' }
  ]
} as SingleChoiceBuilder,
```

#### Multiple Choice (Checkboxes)
```typescript
{
  id: 'symptoms',
  type: 'multiple_choice',
  title: 'What symptoms do you have?',
  subtitle: 'Select all that apply',
  required: true,
  maxSelections: 3,
  options: [
    { label: 'Pain', value: 'pain' },
    { label: 'Stiffness', value: 'stiffness' },
    { label: 'Swelling', value: 'swelling' }
  ]
} as MultipleChoiceBuilder,
```

#### Scale (1-10 Rating)
```typescript
{
  id: 'satisfaction',
  type: 'scale',
  title: 'Rate your satisfaction',
  required: true,
  min: 1,
  max: 10,
  minLabel: 'Very Poor',
  maxLabel: 'Excellent'
} as ScaleBuilder,
```

#### Pain Scale (Special 0-10 with Emojis)
```typescript
{
  id: 'current_pain',
  type: 'pain_scale',
  title: 'Current pain level?',
  required: true
} as PainScaleBuilder,
```

#### Text Input
```typescript
{
  id: 'additional_info',
  type: 'text',
  title: 'Any additional information?',
  required: false,
  placeholder: 'Tell us more...',
  multiline: true,
  maxLength: 500
} as TextBuilder,
```

#### Yes/No Question
```typescript
{
  id: 'had_surgery',
  type: 'boolean',
  title: 'Have you had surgery?',
  required: true,
  trueLabel: 'Yes, I have',
  falseLabel: 'No, I have not'
} as BooleanBuilder,
```

#### Body Areas Selection
```typescript
{
  id: 'pain_areas',
  type: 'body_areas',
  title: 'Where does it hurt?',
  subtitle: 'Select affected areas',
  required: true,
  maxSelections: 5
} as BodyAreasBuilder,
```

### 4. Adding a New Section

```typescript
// Add to the sections array
{
  id: 'my_new_section',
  title: 'New Section Title',
  description: 'Description of this section',
  questions: [
    // Your questions here
  ]
}
```

### 5. Conditional Questions (Advanced)

Show/hide questions based on previous answers:

```typescript
{
  id: 'surgery_details',
  type: 'text',
  title: 'Tell us about your surgery',
  required: true,
  conditionalLogic: [{
    dependsOn: 'had_surgery',
    condition: 'equals',
    value: true,
    action: 'show'
  }]
} as TextBuilder,
```

### 6. Validation Rules

```typescript
{
  id: 'email',
  type: 'text',
  title: 'Your email address',
  required: true,
  validation: [
    {
      type: 'email',
      message: 'Please enter a valid email address'
    },
    {
      type: 'min_length',
      value: 5,
      message: 'Email must be at least 5 characters'
    }
  ]
} as TextBuilder,
```

## Using the Questionnaire

```typescript
import { QuestionnaireManager } from '../components/questionnaire/QuestionnaireManager';
import { DISCOVERY_QUESTIONNAIRE } from '../config/questionnaires';

// In your screen component
<QuestionnaireManager
  config={DISCOVERY_QUESTIONNAIRE}
  onComplete={(responses) => {
    // Handle completion
    console.log('Questionnaire completed:', responses);
  }}
  onSave={(responses) => {
    // Auto-save progress
    console.log('Progress saved:', responses);
  }}
  onExit={() => {
    // Handle exit
    navigation.goBack();
  }}
/>
```

## Quick Editing Tips

### To Change Question Order
- Cut and paste the question object to a new position in the array

### To Remove a Question  
- Delete the entire question object (including the comma)

### To Make a Question Optional
- Set `required: false` or remove the `required` property

### To Change Question Text
- Edit the `title`, `subtitle`, or `helpText` properties

### To Add More Options
- Add new objects to the `options` array

### To Limit Selections
- Add `maxSelections: X` to multiple choice questions

That's it! The system automatically handles all the UI rendering, validation, progress tracking, and data collection based on your configuration.