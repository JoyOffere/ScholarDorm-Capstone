-- Update teacher utilities with the new function
-- Run this after the main teacher-utilities.sql to add the quiz function

-- Function to get recent quiz attempts for a teacher
CREATE OR REPLACE FUNCTION get_teacher_recent_quiz_attempts(teacher_uuid UUID)
RETURNS TABLE (
  id UUID,
  student_name TEXT,
  quiz_title TEXT,
  course_title TEXT,
  percentage NUMERIC,
  is_passed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qa.id,
    u.full_name as student_name,
    eq.title as quiz_title,
    c.title as course_title,
    qa.percentage,
    qa.is_passed,
    qa.completed_at
  FROM enhanced_quiz_attempts qa
  JOIN users u ON qa.user_id = u.id
  JOIN enhanced_quizzes eq ON qa.quiz_id = eq.id
  JOIN lessons l ON eq.lesson_id = l.id
  JOIN courses c ON l.course_id = c.id
  JOIN teacher_course_assignments tca ON c.id = tca.course_id
  WHERE tca.teacher_id = teacher_uuid
    AND tca.is_active = true
    AND qa.completed_at IS NOT NULL
  ORDER BY qa.completed_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_teacher_recent_quiz_attempts IS 'Returns recent quiz attempts for students in teacher courses';