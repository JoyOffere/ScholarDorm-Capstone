-- Step-by-step application script for Rwanda S2 Mathematics courses
-- Run each section separately to avoid conflicts

-- STEP 1: Add missing columns to existing courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50) DEFAULT 'Senior 2',
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_rsl_support BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- STEP 2: Create bridge tables for course sections
CREATE TABLE IF NOT EXISTS course_sections_bridge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Main Section',
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- STEP 3: Create enhanced lessons table
CREATE TABLE IF NOT EXISTS enhanced_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    section_id UUID REFERENCES course_sections_bridge(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}'::JSONB,
    content_type VARCHAR(20) DEFAULT 'mixed',
    content_html TEXT,
    rsl_video_url TEXT,
    estimated_duration_minutes INTEGER DEFAULT 5,
    order_index INTEGER NOT NULL,
    learning_objectives TEXT[],
    key_concepts TEXT[],
    difficulty_tags VARCHAR(20)[] DEFAULT ARRAY['easy'],
    is_preview BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- STEP 4: Create enhanced quiz tables
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

-- STEP 5: Create support tables
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS enhanced_lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES enhanced_lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS rsl_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(20) NOT NULL,
    content_id UUID,
    rsl_video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    duration_seconds INTEGER,
    sign_complexity VARCHAR(20) DEFAULT 'basic',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 6: Create indexes
CREATE INDEX IF NOT EXISTS idx_course_sections_bridge_course ON course_sections_bridge(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_course ON enhanced_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_order ON enhanced_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enhanced_quizzes_course ON enhanced_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_questions_quiz ON enhanced_quiz_questions(quiz_id);

COMMIT;