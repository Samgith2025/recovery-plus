-- Recovery+ Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Questionnaire responses table
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own responses" ON questionnaire_responses
  FOR ALL USING (auth.uid() = user_id);

-- Recovery phases table
CREATE TABLE IF NOT EXISTS recovery_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  weekly_plan JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE recovery_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own phases" ON recovery_phases
  FOR ALL USING (auth.uid() = user_id);

-- Exercises table (public reference data)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT[] NOT NULL DEFAULT '{}',
  sets INTEGER,
  reps INTEGER,
  hold_time INTEGER,
  rest_time INTEGER,
  difficulty INTEGER NOT NULL DEFAULT 1,
  body_parts TEXT[] NOT NULL DEFAULT '{}',
  video_urls TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'strength',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises are publicly readable
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are publicly readable" ON exercises
  FOR SELECT TO authenticated, anon
  USING (TRUE);

-- Exercise sessions table (user's workout history)
CREATE TABLE IF NOT EXISTS exercise_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE exercise_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON exercise_sessions
  FOR ALL USING (auth.uid() = user_id);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  reminder_time TIME,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'en',
  privacy_analytics BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- Weekly plans table
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID NOT NULL REFERENCES recovery_phases(id) ON DELETE CASCADE,
  exercises JSONB NOT NULL DEFAULT '[]',
  week_number INTEGER NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly plans inherit permissions from recovery phases
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access plans from own phases" ON weekly_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recovery_phases 
      WHERE recovery_phases.id = weekly_plans.phase_id 
      AND recovery_phases.user_id = auth.uid()
    )
  );

-- Triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questionnaire_responses_updated_at BEFORE UPDATE ON questionnaire_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recovery_phases_updated_at BEFORE UPDATE ON recovery_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_weekly_plans_updated_at BEFORE UPDATE ON weekly_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample exercises for testing
INSERT INTO exercises (title, description, instructions, sets, reps, difficulty, body_parts, type) VALUES
  ('Cat-Cow Stretch', 'A gentle spinal mobility exercise', ARRAY['Start on hands and knees', 'Arch your back looking up (Cow)', 'Round your spine looking down (Cat)', 'Repeat slowly'], NULL, 10, 1, ARRAY['back', 'core'], 'mobility'),
  ('Wall Push-Up', 'Upper body strengthening against wall', ARRAY['Stand arm''s length from wall', 'Place palms flat against wall', 'Slowly push away and return', 'Keep body straight'], 2, 10, 2, ARRAY['chest', 'arms', 'core'], 'strength'),
  ('Knee to Chest', 'Hip and lower back stretch', ARRAY['Lie on your back', 'Bring one knee to chest', 'Hold gently with both hands', 'Switch legs'], NULL, 5, 1, ARRAY['hips', 'back'], 'mobility'),
  ('Bird Dog', 'Core stability exercise', ARRAY['Start on hands and knees', 'Extend opposite arm and leg', 'Hold for 3 seconds', 'Switch sides'], 2, 8, 3, ARRAY['core', 'back'], 'stability'),
  ('Seated Spinal Twist', 'Gentle spinal rotation', ARRAY['Sit tall in chair', 'Place hand on opposite knee', 'Gently rotate spine', 'Hold and repeat other side'], NULL, 5, 1, ARRAY['back', 'core'], 'mobility')
ON CONFLICT DO NOTHING;