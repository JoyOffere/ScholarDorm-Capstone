-- Migration: Add Enhanced Time Tracking to Quiz Attempts
-- This migration adds comprehensive time tracking fields to support detailed analytics

-- Add time tracking columns to enhanced_quiz_attempts table
ALTER TABLE enhanced_quiz_attempts 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER,
ADD COLUMN IF NOT EXISTS question_time_tracking JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_points DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT FALSE;

-- Also update the main quiz_attempts table if it exists (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        ALTER TABLE quiz_attempts 
        ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER,
        ADD COLUMN IF NOT EXISTS question_time_tracking JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
    END IF;
END $$;

-- Create indexes for better performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_time_spent ON enhanced_quiz_attempts(time_spent_seconds);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_attempt_number ON enhanced_quiz_attempts(attempt_number);

-- Create indexes for quiz_attempts table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_time_spent ON quiz_attempts(time_spent_seconds);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_attempt_number ON quiz_attempts(attempt_number);
    END IF;
END $$;

-- Update any existing records to have attempt_number if they don't have it
UPDATE enhanced_quiz_attempts 
SET attempt_number = 1 
WHERE attempt_number IS NULL;

-- Update quiz_attempts table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        UPDATE quiz_attempts 
        SET attempt_number = 1 
        WHERE attempt_number IS NULL;
    END IF;
END $$;

-- Add comments to document the new fields
COMMENT ON COLUMN enhanced_quiz_attempts.time_spent_seconds IS 'Precise time tracking in seconds for the entire quiz attempt';
COMMENT ON COLUMN enhanced_quiz_attempts.question_time_tracking IS 'JSON object tracking time spent on each question: {"question_id": time_in_milliseconds}';
COMMENT ON COLUMN enhanced_quiz_attempts.attempt_number IS 'Sequential attempt number for this user and quiz combination';
COMMENT ON COLUMN enhanced_quiz_attempts.total_points IS 'Total possible points for this quiz attempt';
COMMENT ON COLUMN enhanced_quiz_attempts.is_passed IS 'Whether this attempt passed the quiz requirements';

-- Create a view for easy time analytics
CREATE OR REPLACE VIEW quiz_time_analytics AS
SELECT 
    qa.id,
    qa.user_id,
    qa.quiz_id,
    qa.attempt_number,
    qa.score,
    qa.percentage,
    qa.is_passed,
    qa.time_taken_minutes,
    qa.time_spent_seconds,
    qa.started_at,
    qa.completed_at,
    qa.question_time_tracking,
    EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at)) / 60 AS calculated_duration_minutes,
    u.full_name AS student_name,
    u.email AS student_email,
    q.title AS quiz_title,
    q.passing_score,
    c.title AS course_title,
    c.id AS course_id
FROM enhanced_quiz_attempts qa
JOIN users u ON qa.user_id = u.id
JOIN enhanced_quizzes q ON qa.quiz_id = q.id
LEFT JOIN courses c ON q.course_id = c.id
WHERE qa.completed_at IS NOT NULL;

COMMENT ON VIEW quiz_time_analytics IS 'Comprehensive view for quiz time tracking analytics';

-- Drop existing functions first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_quiz_question_time_stats(UUID);

-- Function to get average time spent per question for a quiz
CREATE OR REPLACE FUNCTION get_quiz_question_time_stats(quiz_uuid UUID)
RETURNS TABLE (
    question_id TEXT,
    avg_time_seconds NUMERIC,
    min_time_seconds INTEGER,
    max_time_seconds INTEGER,
    attempt_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH question_times AS (
        SELECT 
            jsonb_object_keys(question_time_tracking) as question_id,
            (jsonb_each_text(question_time_tracking)).value::INTEGER / 1000 as time_seconds
        FROM enhanced_quiz_attempts 
        WHERE quiz_id = quiz_uuid 
        AND question_time_tracking IS NOT NULL 
        AND jsonb_typeof(question_time_tracking) = 'object'
    )
    SELECT 
        qt.question_id,
        ROUND(AVG(qt.time_seconds), 2) as avg_time_seconds,
        MIN(qt.time_seconds) as min_time_seconds,
        MAX(qt.time_seconds) as max_time_seconds,
        COUNT(*) as attempt_count
    FROM question_times qt
    GROUP BY qt.question_id
    ORDER BY avg_time_seconds DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_quiz_question_time_stats IS 'Returns time statistics per question for a specific quiz';

-- Drop existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_student_time_summary(UUID);

-- Function to get student time tracking summary
CREATE OR REPLACE FUNCTION get_student_time_summary(student_uuid UUID)
RETURNS TABLE (
    total_quiz_attempts BIGINT,
    total_time_spent_minutes INTEGER,
    average_time_per_attempt NUMERIC,
    fastest_completion_minutes INTEGER,
    slowest_completion_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_quiz_attempts,
        COALESCE(SUM(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as total_time_spent_minutes,
        COALESCE(ROUND(AVG(CEIL(time_spent_seconds::NUMERIC / 60)), 2), 0) as average_time_per_attempt,
        COALESCE(MIN(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as fastest_completion_minutes,
        COALESCE(MAX(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as slowest_completion_minutes
    FROM enhanced_quiz_attempts 
    WHERE user_id = student_uuid 
    AND completed_at IS NOT NULL
    AND time_spent_seconds IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_time_summary IS 'Returns comprehensive time tracking summary for a student';

-- Drop existing function first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_course_time_analytics(UUID);

-- Function to get teacher course time analytics
CREATE OR REPLACE FUNCTION get_course_time_analytics(course_uuid UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    total_attempts BIGINT,
    avg_score NUMERIC,
    total_time_minutes INTEGER,
    avg_time_per_attempt NUMERIC,
    last_attempt TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qa.user_id as student_id,
        u.full_name as student_name,
        COUNT(*) as total_attempts,
        ROUND(AVG(qa.percentage), 2) as avg_score,
        COALESCE(SUM(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as total_time_minutes,
        COALESCE(ROUND(AVG(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 2), 0) as avg_time_per_attempt,
        MAX(qa.completed_at) as last_attempt
    FROM enhanced_quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    JOIN enhanced_quizzes q ON qa.quiz_id = q.id
    WHERE q.course_id = course_uuid
    AND qa.completed_at IS NOT NULL
    GROUP BY qa.user_id, u.full_name
    ORDER BY total_time_minutes DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_course_time_analytics IS 'Returns time analytics for all students in a course';