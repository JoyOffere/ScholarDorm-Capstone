-- Enhanced database schema for comprehensive course system with Rwanda S2 Mathematics
-- Based on TODO.md requirements

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS quiz_attempts CASCADE;
-- DROP TABLE IF EXISTS quiz_questions CASCADE;
-- DROP TABLE IF EXISTS quizzes CASCADE;
-- DROP TABLE IF EXISTS lesson_progress CASCADE;
-- DROP TABLE IF EXISTS lessons CASCADE;
-- DROP TABLE IF EXISTS course_enrollments CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;

-- Enhanced courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) DEFAULT 'Senior 2', -- S2, S3, S4, etc.
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    image_url TEXT,
    total_lessons INTEGER DEFAULT 0,
    estimated_duration_hours DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    prerequisites TEXT[], -- Array of prerequisite topic names
    learning_objectives TEXT[], -- Array of learning objectives
    language VARCHAR(10) DEFAULT 'en', -- 'en', 'rw', 'fr'
    has_rsl_support BOOLEAN DEFAULT true, -- Rwandan Sign Language support
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) DEFAULT 'mixed' CHECK (content_type IN ('video', 'text', 'interactive', 'quiz', 'mixed')),
    content_html TEXT, -- Rich HTML content
    content_url TEXT, -- Video or external resource URL
    rsl_video_url TEXT, -- RSL interpretation video URL
    duration_minutes INTEGER DEFAULT 5, -- Target: 5-minute lessons
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN DEFAULT false, -- Can be accessed without enrollment
    learning_objectives TEXT[], -- Specific objectives for this lesson
    key_concepts TEXT[], -- Important concepts covered
    difficulty_tags VARCHAR(20)[] DEFAULT ARRAY['easy'], -- ['easy', 'moderate', 'challenge']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, order_index)
);

-- Enhanced quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NULL, -- NULL for course-level quizzes
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type VARCHAR(20) DEFAULT 'lesson' CHECK (quiz_type IN ('lesson', 'topic', 'assessment', 'practice')),
    time_limit_minutes INTEGER, -- NULL for untimed quizzes
    max_attempts INTEGER DEFAULT 3,
    passing_score DECIMAL(5,2) DEFAULT 70.00, -- Percentage
    randomize_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'calculation', 'word_problem', 'reasoning')),
    options JSONB, -- For MCQ: {"A": "option1", "B": "option2", ...}
    correct_answer TEXT NOT NULL,
    explanation TEXT, -- Explanation of the correct answer
    difficulty_level VARCHAR(20) DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'moderate', 'challenge')),
    points DECIMAL(5,2) DEFAULT 1.00,
    order_index INTEGER NOT NULL,
    topic_tag VARCHAR(100), -- e.g., "pythagoras_theorem", "statistics_mean"
    rsl_video_url TEXT, -- RSL interpretation for the question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(quiz_id, order_index)
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    completion_date TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT, -- Student's personal notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    total_points DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_points > 0 THEN (score / total_points) * 100 
            ELSE 0 
        END
    ) STORED,
    is_passed BOOLEAN GENERATED ALWAYS AS (
        CASE 
            WHEN total_points > 0 THEN (score / total_points) * 100 >= (
                SELECT passing_score FROM quizzes WHERE id = quiz_id
            )
            ELSE false 
        END
    ) STORED,
    answers JSONB, -- Student's answers: {"question_id": "answer"}
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    time_taken_minutes INTEGER,
    feedback TEXT, -- Generated feedback based on performance
    UNIQUE(user_id, quiz_id, attempt_number)
);

-- Student achievements and badges
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'course_completion', 'quiz_master', 'streak_keeper', etc.
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon_url TEXT,
    badge_color VARCHAR(20) DEFAULT 'blue',
    points_awarded INTEGER DEFAULT 0,
    related_course_id UUID REFERENCES courses(id),
    earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- RSL (Rwandan Sign Language) support table
CREATE TABLE IF NOT EXISTS rsl_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('lesson', 'question', 'general')),
    content_id UUID, -- lesson_id, question_id, etc.
    rsl_video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    duration_seconds INTEGER,
    sign_complexity VARCHAR(20) DEFAULT 'basic' CHECK (sign_complexity IN ('basic', 'intermediate', 'advanced')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning analytics
CREATE TABLE IF NOT EXISTS learning_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'lesson_start', 'lesson_complete', 'quiz_attempt', etc.
    event_data JSONB, -- Additional event-specific data
    session_id VARCHAR(255), -- To group related events
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_subject ON courses(subject);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);

CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_active ON lessons(is_active);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty_level);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON course_enrollments(is_active);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course ON lesson_progress(course_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

CREATE INDEX IF NOT EXISTS idx_rsl_content_type ON rsl_content(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_course ON learning_analytics(course_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON learning_analytics(timestamp);

-- Function to update course lesson count
CREATE OR REPLACE FUNCTION update_course_lesson_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE courses 
    SET total_lessons = (
        SELECT COUNT(*) 
        FROM lessons 
        WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
        AND is_active = true
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.course_id, OLD.course_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update lesson count
DROP TRIGGER IF EXISTS trigger_update_lesson_count ON lessons;
CREATE TRIGGER trigger_update_lesson_count
    AFTER INSERT OR UPDATE OR DELETE ON lessons
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
        FROM lessons
        WHERE course_id = NEW.course_id AND is_active = true;
        
        -- Count completed lessons for this user
        SELECT COUNT(*) INTO completed_lessons
        FROM lesson_progress
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
DROP TRIGGER IF EXISTS trigger_update_progress ON lesson_progress;
CREATE TRIGGER trigger_update_progress
    AFTER INSERT OR UPDATE ON lesson_progress
    FOR EACH ROW
    WHEN (NEW.is_completed = true)
    EXECUTE FUNCTION update_enrollment_progress();