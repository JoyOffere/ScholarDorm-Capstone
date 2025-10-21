-- Fix Quiz Tables Migration
-- This script creates the enhanced_quizzes and enhanced_lessons tables that the application expects

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's create enhanced_lessons table if it doesn't exist
CREATE TABLE IF NOT EXISTS enhanced_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    lesson_type VARCHAR(20) DEFAULT 'lesson',
    duration_minutes INTEGER,
    order_index INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT true,
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    prerequisite_lesson_id UUID REFERENCES enhanced_lessons(id),
    video_url TEXT,
    rsl_video_url TEXT,
    resource_links JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- Create enhanced_quizzes table
CREATE TABLE IF NOT EXISTS enhanced_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES enhanced_lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    quiz_type VARCHAR(20) DEFAULT 'assessment',
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    randomize_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced_quiz_questions table
CREATE TABLE IF NOT EXISTS enhanced_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'mcq',
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'easy',
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INTEGER NOT NULL,
    topic_tag VARCHAR(100),
    rsl_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, order_index)
);

-- Create enhanced_quiz_attempts table
CREATE TABLE IF NOT EXISTS enhanced_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL,
    time_spent_minutes INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    feedback_provided BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_course ON enhanced_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_published ON enhanced_lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_enhanced_quizzes_course ON enhanced_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quizzes_lesson ON enhanced_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quizzes_published ON enhanced_quizzes(is_published);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_questions_quiz ON enhanced_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_user ON enhanced_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_quiz ON enhanced_quiz_attempts(quiz_id);

-- Enable Row Level Security (RLS)
ALTER TABLE enhanced_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enhanced_lessons
CREATE POLICY "Anyone can view published lessons" ON enhanced_lessons
FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can do anything with lessons" ON enhanced_lessons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
-- Since the old tables have been deleted, we'll just ensure the enhanced tables are properly set up
-- No data migration needed as we're starting fresh with enhanced tables only

-- Add some sample data if tables are empty (only if courses exist)
DO $$
BEGIN
    -- Only create sample data if we have courses and no quizzes yet
    IF EXISTS (SELECT 1 FROM courses LIMIT 1) AND NOT EXISTS (SELECT 1 FROM enhanced_quizzes LIMIT 1) THEN
        -- Create sample lesson for the first course
        INSERT INTO enhanced_lessons (course_id, title, description, content, order_index, is_published)
        SELECT 
            c.id as course_id,
            'Introduction to ' || c.title,
            'An introductory lesson for ' || c.title,
            'This lesson covers the basics of ' || c.title || '.',
            1,
            true
        FROM courses c
        ORDER BY c.created_at
        LIMIT 1;

        -- Create sample quiz for the first course
        INSERT INTO enhanced_quizzes (course_id, title, description, quiz_type, time_limit_minutes, max_attempts, passing_score, is_published)
        SELECT 
            c.id as course_id,
            'Sample Quiz for ' || c.title,
            'This is a sample quiz to test the quiz functionality',
            'assessment',
            30,
            3,
            70.00,
            true
        FROM courses c
        ORDER BY c.created_at
        LIMIT 1;

        -- Add sample quiz questions for the new quiz
        INSERT INTO enhanced_quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, order_index)
        SELECT 
            eq.id as quiz_id,
            'What is 2 + 2?',
            'mcq',
            '["2", "3", "4", "5"]'::JSONB,
            '4',
            'Basic addition: 2 + 2 = 4',
            1
        FROM enhanced_quizzes eq
        WHERE NOT EXISTS (SELECT 1 FROM enhanced_quiz_questions WHERE quiz_id = eq.id)
        LIMIT 1;

        INSERT INTO enhanced_quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, order_index)
        SELECT 
            eq.id as quiz_id,
            'Is the sky blue?',
            'mcq',
            '["Yes", "No", "Sometimes", "Maybe"]'::JSONB,
            'Yes',
            'The sky appears blue due to light scattering.',
            2
        FROM enhanced_quizzes eq
        WHERE NOT EXISTS (SELECT 1 FROM enhanced_quiz_questions WHERE quiz_id = eq.id AND order_index = 2)
        LIMIT 1;
        
        RAISE NOTICE 'Sample data created successfully';
    ELSE
        RAISE NOTICE 'Sample data not created - either no courses exist or quizzes already exist';
    END IF;
END $$;

