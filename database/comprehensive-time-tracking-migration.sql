-- Migration: Add Enhanced Time Tracking to Quiz Systems
-- This migration ensures enhanced_quiz_attempts table supports comprehensive time tracking

-- Add missing time tracking columns to enhanced_quiz_attempts if they don't exist
ALTER TABLE enhanced_quiz_attempts 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER,
ADD COLUMN IF NOT EXISTS question_time_tracking JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_points DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT FALSE;

-- Also add to the original quiz_attempts table if it exists
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
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_user_id ON enhanced_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_quiz_id ON enhanced_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_time_spent ON enhanced_quiz_attempts(time_spent_seconds);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_attempt_number ON enhanced_quiz_attempts(attempt_number);
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_completed_at ON enhanced_quiz_attempts(completed_at);

-- Create indexes for quiz_attempts table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_attempts') THEN
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_time_spent ON quiz_attempts(time_spent_seconds);
    END IF;
END $$;

-- Update any existing records to have attempt_number if they don't have it
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

-- Enable Row Level Security if not already enabled
ALTER TABLE enhanced_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enhanced_quiz_attempts
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON enhanced_quiz_attempts;
CREATE POLICY "Users can view their own quiz attempts" ON enhanced_quiz_attempts
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own quiz attempts" ON enhanced_quiz_attempts;
CREATE POLICY "Users can create their own quiz attempts" ON enhanced_quiz_attempts
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view student quiz attempts" ON enhanced_quiz_attempts;
CREATE POLICY "Teachers can view student quiz attempts" ON enhanced_quiz_attempts
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM teacher_course_assignments tca
        JOIN enhanced_quizzes q ON q.course_id = tca.course_id
        WHERE tca.teacher_id = auth.uid()
        AND q.id = enhanced_quiz_attempts.quiz_id
        AND tca.is_active = true
    )
);

DROP POLICY IF EXISTS "Admins can do anything" ON enhanced_quiz_attempts;
CREATE POLICY "Admins can do anything" ON enhanced_quiz_attempts
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Create a comprehensive view for quiz time analytics
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

COMMENT ON VIEW quiz_time_analytics IS 'Comprehensive view for quiz time tracking analytics including student and course information';

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
        AND completed_at IS NOT NULL
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

-- Function to get student time tracking summary
CREATE OR REPLACE FUNCTION get_student_time_summary(student_uuid UUID)
RETURNS TABLE (
    total_quiz_attempts BIGINT,
    total_time_spent_minutes INTEGER,
    average_time_per_attempt NUMERIC,
    fastest_completion_minutes INTEGER,
    slowest_completion_minutes INTEGER,
    total_passed_attempts BIGINT,
    average_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_quiz_attempts,
        COALESCE(SUM(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as total_time_spent_minutes,
        COALESCE(ROUND(AVG(CEIL(time_spent_seconds::NUMERIC / 60)), 2), 0) as average_time_per_attempt,
        COALESCE(MIN(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as fastest_completion_minutes,
        COALESCE(MAX(CEIL(time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as slowest_completion_minutes,
        COUNT(*) FILTER (WHERE is_passed = true) as total_passed_attempts,
        COALESCE(ROUND(AVG(percentage), 2), 0) as average_score
    FROM enhanced_quiz_attempts 
    WHERE user_id = student_uuid 
    AND completed_at IS NOT NULL
    AND time_spent_seconds IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_student_time_summary IS 'Returns comprehensive time tracking summary for a student';

-- Function to get teacher course time analytics
CREATE OR REPLACE FUNCTION get_course_time_analytics(course_uuid UUID)
RETURNS TABLE (
    student_id UUID,
    student_name TEXT,
    student_email TEXT,
    total_attempts BIGINT,
    passed_attempts BIGINT,
    avg_score NUMERIC,
    best_score NUMERIC,
    total_time_minutes INTEGER,
    avg_time_per_attempt NUMERIC,
    fastest_attempt_minutes INTEGER,
    last_attempt TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qa.user_id as student_id,
        u.full_name as student_name,
        u.email as student_email,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE qa.is_passed = true) as passed_attempts,
        COALESCE(ROUND(AVG(qa.percentage), 2), 0) as avg_score,
        COALESCE(MAX(qa.percentage), 0) as best_score,
        COALESCE(SUM(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as total_time_minutes,
        COALESCE(ROUND(AVG(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 2), 0) as avg_time_per_attempt,
        COALESCE(MIN(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 0)::INTEGER as fastest_attempt_minutes,
        MAX(qa.completed_at) as last_attempt
    FROM enhanced_quiz_attempts qa
    JOIN users u ON qa.user_id = u.id
    JOIN enhanced_quizzes q ON qa.quiz_id = q.id
    WHERE q.course_id = course_uuid
    AND qa.completed_at IS NOT NULL
    GROUP BY qa.user_id, u.full_name, u.email
    ORDER BY total_time_minutes DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_course_time_analytics IS 'Returns time analytics for all students in a course';

-- Function to get quiz difficulty analysis based on time spent
CREATE OR REPLACE FUNCTION get_quiz_difficulty_analysis(quiz_uuid UUID)
RETURNS TABLE (
    quiz_id UUID,
    quiz_title TEXT,
    total_attempts BIGINT,
    avg_time_minutes NUMERIC,
    avg_score NUMERIC,
    pass_rate NUMERIC,
    difficulty_rating TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH quiz_stats AS (
        SELECT 
            qa.quiz_id,
            q.title,
            COUNT(*) as total_attempts,
            ROUND(AVG(CEIL(qa.time_spent_seconds::NUMERIC / 60)), 2) as avg_time_minutes,
            ROUND(AVG(qa.percentage), 2) as avg_score,
            ROUND((COUNT(*) FILTER (WHERE qa.is_passed = true))::NUMERIC / COUNT(*) * 100, 2) as pass_rate
        FROM enhanced_quiz_attempts qa
        JOIN enhanced_quizzes q ON qa.quiz_id = q.id
        WHERE qa.quiz_id = quiz_uuid
        AND qa.completed_at IS NOT NULL
        GROUP BY qa.quiz_id, q.title
    )
    SELECT 
        qs.quiz_id,
        qs.title as quiz_title,
        qs.total_attempts,
        qs.avg_time_minutes,
        qs.avg_score,
        qs.pass_rate,
        CASE 
            WHEN qs.avg_time_minutes > 30 OR qs.pass_rate < 60 THEN 'Hard'
            WHEN qs.avg_time_minutes > 15 OR qs.pass_rate < 80 THEN 'Medium'
            ELSE 'Easy'
        END as difficulty_rating
    FROM quiz_stats qs;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_quiz_difficulty_analysis IS 'Analyzes quiz difficulty based on time spent and pass rates';

-- Create indexes for the new functions
CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_course_lookup ON enhanced_quiz_attempts(quiz_id) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enhanced_quiz_attempts_user_completion ON enhanced_quiz_attempts(user_id, completed_at) 
WHERE completed_at IS NOT NULL;

-- Grant necessary permissions
GRANT SELECT ON quiz_time_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_question_time_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_time_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_course_time_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_difficulty_analysis TO authenticated;