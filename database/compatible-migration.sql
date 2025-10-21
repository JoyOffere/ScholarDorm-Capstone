-- Migration script to enhance existing courses table for Rwanda S2 Mathematics
-- This script adds missing columns and tables while preserving existing data

-- Add missing columns to existing courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50) DEFAULT 'Senior 2',
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS has_rsl_support BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Create course sections table (if not exists) to bridge courses and lessons
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

-- Create enhanced lessons table that works with existing structure
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

-- Create enhanced quizzes table (compatible with existing structure)
CREATE TABLE IF NOT EXISTS enhanced_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    quiz_type VARCHAR(20) DEFAULT 'assessment' CHECK (quiz_type IN ('lesson', 'topic', 'assessment', 'practice')),
    time_limit_minutes INTEGER,
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.00,
    randomize_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced quiz questions table
CREATE TABLE IF NOT EXISTS enhanced_quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'calculation', 'word_problem', 'reasoning')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenge')),
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INTEGER NOT NULL,
    topic_tag VARCHAR(100),
    rsl_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, order_index)
);

-- Create course enrollments table using existing user_courses structure
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

-- Create enhanced lesson progress tracking
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

-- Create enhanced quiz attempts table
CREATE TABLE IF NOT EXISTS enhanced_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES enhanced_quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_points DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT false,
    answers JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken_minutes INTEGER,
    feedback TEXT,
    UNIQUE(user_id, quiz_id, attempt_number)
);

-- Create RSL content table
CREATE TABLE IF NOT EXISTS rsl_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('lesson', 'question', 'general')),
    content_id UUID,
    rsl_video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    duration_seconds INTEGER,
    sign_complexity VARCHAR(20) DEFAULT 'basic' CHECK (sign_complexity IN ('basic', 'intermediate', 'advanced')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_color VARCHAR(20) DEFAULT 'blue',
    points_awarded INTEGER DEFAULT 0,
    related_course_id UUID REFERENCES courses(id),
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create learning analytics table
CREATE TABLE IF NOT EXISTS learning_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sections_bridge_course ON course_sections_bridge(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_course ON enhanced_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_section ON enhanced_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_order ON enhanced_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enhanced_lessons_published ON enhanced_lessons(is_published);

CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_questions_quiz ON enhanced_quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_questions_order ON enhanced_quiz_questions(quiz_id, order_index);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_lesson_progress_user ON enhanced_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lesson_progress_lesson ON enhanced_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_lesson_progress_course ON enhanced_lesson_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_user ON enhanced_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_quiz ON enhanced_quiz_attempts(quiz_id);

-- Function to update course lesson count
CREATE OR REPLACE FUNCTION update_course_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET total_lessons = (
        SELECT COUNT(*) 
        FROM enhanced_lessons 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        AND is_published = true
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update lesson count
DROP TRIGGER IF EXISTS trigger_update_lesson_count ON enhanced_lessons;
CREATE TRIGGER trigger_update_lesson_count
    AFTER INSERT OR UPDATE OR DELETE ON enhanced_lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_course_lesson_count();

-- Function to update enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    enrollment_id UUID;
BEGIN
    -- Get the enrollment record
    SELECT ce.id INTO enrollment_id
    FROM course_enrollments ce
    WHERE ce.user_id = NEW.user_id 
    AND ce.course_id = NEW.course_id;
    
    IF enrollment_id IS NOT NULL THEN
        -- Count total lessons in the course
        SELECT COUNT(*) INTO total_lessons
        FROM enhanced_lessons
        WHERE course_id = NEW.course_id AND is_published = true;
        
        -- Count completed lessons for this user
        SELECT COUNT(*) INTO completed_lessons
        FROM enhanced_lesson_progress
        WHERE user_id = NEW.user_id 
        AND course_id = NEW.course_id 
        AND is_completed = true;
        
        -- Update progress percentage
        UPDATE course_enrollments
        SET progress_percentage = CASE 
            WHEN total_lessons > 0 THEN (completed_lessons * 100.0 / total_lessons)
            ELSE 0
        END,
        completion_date = CASE 
            WHEN completed_lessons = total_lessons AND total_lessons > 0 THEN NOW()
            ELSE NULL
        END
        WHERE id = enrollment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update progress
DROP TRIGGER IF EXISTS trigger_update_progress ON enhanced_lesson_progress;
CREATE TRIGGER trigger_update_progress
    AFTER INSERT OR UPDATE ON enhanced_lesson_progress
    FOR EACH ROW
    WHEN (NEW.is_completed = true)
    EXECUTE FUNCTION update_enrollment_progress();

-- Grant permissions for RLS policies
ALTER TABLE course_sections_bridge ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsl_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY "Anyone can view published lessons" ON enhanced_lessons
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage lessons" ON enhanced_lessons
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can view published quizzes" ON enhanced_quizzes
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage quizzes" ON enhanced_quizzes
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can view quiz questions" ON enhanced_quiz_questions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions" ON enhanced_quiz_questions
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can manage their enrollments" ON course_enrollments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON course_enrollments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can manage their progress" ON enhanced_lesson_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON enhanced_lesson_progress
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can manage their quiz attempts" ON enhanced_quiz_attempts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON enhanced_quiz_attempts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Anyone can view RSL content" ON rsl_content
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage RSL content" ON rsl_content
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage achievements" ON achievements
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Analytics policies (restricted access)
CREATE POLICY "Users can view their analytics" ON learning_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage analytics" ON learning_analytics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');