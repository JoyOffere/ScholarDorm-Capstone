-- Teacher Database Utilities
-- Additional utility functions and views for teacher functionality

-- 1. Create views for easier data access

-- Teacher Dashboard Summary View
CREATE OR REPLACE VIEW teacher_dashboard_summary AS
SELECT 
  u.id as teacher_id,
  u.full_name as teacher_name,
  u.email as teacher_email,
  
  -- Course statistics
  COUNT(DISTINCT tca.course_id) as assigned_courses,
  COUNT(DISTINCT CASE WHEN tca.is_active = true THEN tca.course_id END) as active_courses,
  
  -- Student statistics  
  COUNT(DISTINCT tsa.student_id) as total_students,
  COUNT(DISTINCT CASE WHEN tsa.is_active = true THEN tsa.student_id END) as active_students,
  
  -- Content statistics
  COUNT(DISTINCT tc.id) as created_content,
  COUNT(DISTINCT CASE WHEN tc.status = 'published' THEN tc.id END) as published_content,
  
  -- RSL content statistics
  COUNT(DISTINCT rsl.id) as rsl_videos,
  COUNT(DISTINCT CASE WHEN rsl.status = 'published' THEN rsl.id END) as published_rsl_videos,
  
  -- Quiz statistics
  COUNT(DISTINCT q.id) as created_quizzes,
  
  -- Recent activity
  MAX(GREATEST(
    tca.updated_at,
    tsa.updated_at,
    tc.updated_at,
    rsl.updated_at
  )) as last_activity

FROM users u
LEFT JOIN teacher_course_assignments tca ON u.id = tca.teacher_id
LEFT JOIN teacher_student_assignments tsa ON u.id = tsa.teacher_id
LEFT JOIN teacher_content tc ON u.id = tc.teacher_id
LEFT JOIN rsl_content rsl ON u.id = rsl.teacher_id
LEFT JOIN enhanced_quizzes q ON u.id = q.created_by
WHERE u.role = 'teacher'
GROUP BY u.id, u.full_name, u.email;

-- Student Progress Summary View for Teachers
CREATE OR REPLACE VIEW teacher_student_progress_view AS
SELECT 
  tsa.teacher_id,
  tsa.student_id,
  u.full_name as student_name,
  u.email as student_email,
  u.avatar_url as student_avatar,
  c.id as course_id,
  c.title as course_title,
  
  -- Progress metrics
  uc.progress_percentage,
  uc.completed as course_completed,
  uc.last_accessed,
  uc.enrolled_at,
  
  -- Quiz performance
  AVG(qa.percentage) as average_quiz_score,
  COUNT(qa.id) as quiz_attempts,
  COUNT(CASE WHEN qa.is_passed = true THEN 1 END) as passed_quizzes,
  
  -- Activity metrics
  u.streak_count,
  u.last_login,
  
  -- Time spent (from progress tracking)
  COALESCE(SUM(up.time_spent_seconds), 0) as total_time_spent_seconds

FROM teacher_student_assignments tsa
JOIN users u ON tsa.student_id = u.id
JOIN courses c ON tsa.course_id = c.id
LEFT JOIN user_courses uc ON u.id = uc.user_id AND c.id = uc.course_id
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN lessons l ON up.lesson_id = l.id AND l.course_id = c.id
LEFT JOIN enhanced_quiz_attempts qa ON u.id = qa.user_id
LEFT JOIN enhanced_quizzes q ON qa.quiz_id = q.id AND q.lesson_id = l.id
WHERE tsa.is_active = true
  AND u.role = 'student'
GROUP BY 
  tsa.teacher_id, tsa.student_id, u.full_name, u.email, u.avatar_url,
  c.id, c.title, uc.progress_percentage, uc.completed, uc.last_accessed, 
  uc.enrolled_at, u.streak_count, u.last_login;

-- Course Analytics View for Teachers
CREATE OR REPLACE VIEW teacher_course_analytics AS
SELECT 
  tca.teacher_id,
  c.id as course_id,
  c.title as course_title,
  c.description as course_description,
  c.image_url as course_image,
  c.difficulty_level,
  c.subject,
  
  -- Enrollment statistics
  COUNT(DISTINCT tsa.student_id) as enrolled_students,
  COUNT(DISTINCT CASE WHEN uc.completed = true THEN tsa.student_id END) as completed_students,
  
  -- Progress statistics
  COALESCE(AVG(uc.progress_percentage), 0) as average_progress,
  COALESCE(AVG(CASE WHEN uc.completed = true THEN 100.0 ELSE uc.progress_percentage END), 0) as weighted_progress,
  
  -- Completion rate
  CASE 
    WHEN COUNT(DISTINCT tsa.student_id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN uc.completed = true THEN tsa.student_id END) * 100.0 / COUNT(DISTINCT tsa.student_id))
    ELSE 0 
  END as completion_rate,
  
  -- Quiz performance
  COALESCE(AVG(qa.percentage), 0) as average_quiz_score,
  COUNT(DISTINCT qa.id) as total_quiz_attempts,
  
  -- Engagement metrics
  COUNT(DISTINCT up.id) as total_lesson_interactions,
  COALESCE(AVG(up.time_spent_seconds), 0) as average_time_per_lesson,
  
  -- Content statistics
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT q.id) as total_quizzes,
  
  -- Recent activity
  MAX(uc.last_accessed) as last_student_activity,
  MAX(tsa.updated_at) as last_assignment_update

FROM teacher_course_assignments tca
JOIN courses c ON tca.course_id = c.id
LEFT JOIN teacher_student_assignments tsa ON tca.course_id = tsa.course_id AND tca.teacher_id = tsa.teacher_id
LEFT JOIN user_courses uc ON tsa.student_id = uc.user_id AND c.id = uc.course_id
LEFT JOIN lessons l ON c.id = l.course_id
LEFT JOIN user_progress up ON tsa.student_id = up.user_id AND l.id = up.lesson_id
LEFT JOIN enhanced_quizzes q ON l.id = q.lesson_id
LEFT JOIN enhanced_quiz_attempts qa ON tsa.student_id = qa.user_id AND q.id = qa.quiz_id
WHERE tca.is_active = true
GROUP BY 
  tca.teacher_id, c.id, c.title, c.description, c.image_url, 
  c.difficulty_level, c.subject;

-- 2. Create helper functions for common teacher operations

-- Function to assign students to a teacher for a specific course
CREATE OR REPLACE FUNCTION assign_students_to_teacher(
  teacher_uuid UUID,
  student_uuids UUID[],
  course_uuid UUID,
  assigned_by_uuid UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  student_uuid UUID;
  assignments_count INTEGER := 0;
BEGIN
  -- Verify teacher role
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = teacher_uuid AND role = 'teacher') THEN
    RAISE EXCEPTION 'User % is not a teacher', teacher_uuid;
  END IF;
  
  -- Verify course exists
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = course_uuid) THEN
    RAISE EXCEPTION 'Course % does not exist', course_uuid;
  END IF;
  
  -- Verify teacher is assigned to the course
  IF NOT EXISTS (SELECT 1 FROM teacher_course_assignments WHERE teacher_id = teacher_uuid AND course_id = course_uuid AND is_active = true) THEN
    RAISE EXCEPTION 'Teacher % is not assigned to course %', teacher_uuid, course_uuid;
  END IF;
  
  -- Assign each student
  FOREACH student_uuid IN ARRAY student_uuids
  LOOP
    -- Verify student role
    IF EXISTS (SELECT 1 FROM users WHERE id = student_uuid AND role = 'student') THEN
      -- Insert assignment (ON CONFLICT to handle duplicates)
      INSERT INTO teacher_student_assignments (teacher_id, student_id, course_id, assigned_by)
      VALUES (teacher_uuid, student_uuid, course_uuid, assigned_by_uuid)
      ON CONFLICT (teacher_id, student_id, course_id) 
      DO UPDATE SET 
        is_active = true,
        updated_at = NOW(),
        assigned_by = COALESCE(assigned_by_uuid, teacher_student_assignments.assigned_by);
      
      assignments_count := assignments_count + 1;
    END IF;
  END LOOP;
  
  RETURN assignments_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher's student performance summary
CREATE OR REPLACE FUNCTION get_teacher_student_summary(
  teacher_uuid UUID,
  course_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  courses_count INTEGER,
  average_progress NUMERIC,
  quiz_average NUMERIC,
  last_activity TIMESTAMP WITH TIME ZONE,
  streak_count INTEGER,
  total_time_spent INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tspv.student_id,
    tspv.student_name,
    tspv.student_email,
    COUNT(DISTINCT tspv.course_id)::INTEGER as courses_count,
    AVG(tspv.progress_percentage) as average_progress,
    AVG(tspv.average_quiz_score) as quiz_average,
    MAX(tspv.last_accessed) as last_activity,
    MAX(tspv.streak_count)::INTEGER as streak_count,
    SUM(tspv.total_time_spent_seconds)::INTEGER as total_time_spent
  FROM teacher_student_progress_view tspv
  WHERE tspv.teacher_id = teacher_uuid
    AND (course_uuid IS NULL OR tspv.course_id = course_uuid)
  GROUP BY tspv.student_id, tspv.student_name, tspv.student_email
  ORDER BY tspv.student_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create RSL content entry
CREATE OR REPLACE FUNCTION create_rsl_content(
  teacher_uuid UUID,
  content_title TEXT,
  content_description TEXT,
  video_url TEXT,
  content_category TEXT,
  difficulty TEXT DEFAULT 'beginner',
  sign_desc TEXT DEFAULT NULL,
  instructor TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  content_id UUID;
BEGIN
  -- Verify teacher role
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = teacher_uuid AND role = 'teacher') THEN
    RAISE EXCEPTION 'User % is not a teacher', teacher_uuid;
  END IF;
  
  -- Insert RSL content
  INSERT INTO rsl_content (
    teacher_id, title, description, video_url, category, 
    difficulty_level, sign_description, instructor_name
  )
  VALUES (
    teacher_uuid, content_title, content_description, video_url, 
    content_category, difficulty, sign_desc, instructor
  )
  RETURNING id INTO content_id;
  
  RETURN content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record teacher analytics
CREATE OR REPLACE FUNCTION record_teacher_metric(
  teacher_uuid UUID,
  metric_type_val TEXT,
  metric_name_val TEXT,
  metric_value_val NUMERIC,
  metadata_val JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  analytics_id UUID;
BEGIN
  -- Verify teacher role
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = teacher_uuid AND role = 'teacher') THEN
    RAISE EXCEPTION 'User % is not a teacher', teacher_uuid;
  END IF;
  
  -- Insert analytics record
  INSERT INTO teacher_analytics (
    teacher_id, metric_type, metric_name, metric_value, metadata
  )
  VALUES (
    teacher_uuid, metric_type_val, metric_name_val, metric_value_val, metadata_val
  )
  RETURNING id INTO analytics_id;
  
  RETURN analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get teacher performance dashboard data
CREATE OR REPLACE FUNCTION get_teacher_dashboard_data(teacher_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verify teacher role
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = teacher_uuid AND role = 'teacher') THEN
    RAISE EXCEPTION 'User % is not a teacher', teacher_uuid;
  END IF;
  
  SELECT jsonb_build_object(
    'teacher_info', (
      SELECT jsonb_build_object(
        'id', id,
        'name', full_name,
        'email', email,
        'avatar_url', avatar_url
      )
      FROM users WHERE id = teacher_uuid
    ),
    'summary', (
      SELECT jsonb_build_object(
        'assigned_courses', assigned_courses,
        'active_students', active_students,
        'created_content', created_content,
        'rsl_videos', rsl_videos,
        'last_activity', last_activity
      )
      FROM teacher_dashboard_summary WHERE teacher_id = teacher_uuid
    ),
    'recent_student_activity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'student_id', student_id,
          'student_name', student_name,
          'course_title', course_title,
          'progress', progress_percentage,
          'last_accessed', last_accessed
        )
      )
      FROM (
        SELECT * FROM teacher_student_progress_view 
        WHERE teacher_id = teacher_uuid 
        ORDER BY last_accessed DESC NULLS LAST 
        LIMIT 10
      ) recent_activity
    ),
    'course_performance', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'course_id', course_id,
          'course_title', course_title,
          'enrolled_students', enrolled_students,
          'average_progress', average_progress,
          'completion_rate', completion_rate
        )
      )
      FROM teacher_course_analytics 
      WHERE teacher_id = teacher_uuid
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create data export functions for teachers

-- Function to export student grades for a course
CREATE OR REPLACE FUNCTION export_student_grades(
  teacher_uuid UUID,
  course_uuid UUID
)
RETURNS TABLE (
  student_name TEXT,
  student_email TEXT,
  assignment_name TEXT,
  assignment_type TEXT,
  points_earned NUMERIC,
  points_possible NUMERIC,
  percentage NUMERIC,
  grade_letter TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- Verify teacher has access to this course
  IF NOT EXISTS (
    SELECT 1 FROM teacher_course_assignments 
    WHERE teacher_id = teacher_uuid AND course_id = course_uuid AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Teacher % does not have access to course %', teacher_uuid, course_uuid;
  END IF;
  
  RETURN QUERY
  SELECT 
    u.full_name,
    u.email,
    tg.assignment_name,
    tg.assignment_type,
    tg.points_earned,
    tg.points_possible,
    tg.percentage,
    tg.grade_letter,
    tg.submitted_at,
    tg.graded_at
  FROM teacher_gradebook tg
  JOIN users u ON tg.student_id = u.id
  WHERE tg.teacher_id = teacher_uuid 
    AND tg.course_id = course_uuid
  ORDER BY u.full_name, tg.assignment_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create maintenance functions

-- Function to cleanup old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_teacher_analytics(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM teacher_analytics 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update content view counts
CREATE OR REPLACE FUNCTION increment_content_view_count(content_id UUID, content_type TEXT)
RETURNS VOID AS $$
BEGIN
  IF content_type = 'teacher_content' THEN
    UPDATE teacher_content SET view_count = view_count + 1 WHERE id = content_id;
  ELSIF content_type = 'rsl_content' THEN
    UPDATE rsl_content SET view_count = view_count + 1 WHERE id = content_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create indexes for the views
CREATE INDEX IF NOT EXISTS idx_teacher_dashboard_summary_teacher_id ON users(id) WHERE role = 'teacher';
CREATE INDEX IF NOT EXISTS idx_teacher_student_progress_teacher_student ON teacher_student_assignments(teacher_id, student_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_teacher_course_analytics_teacher_course ON teacher_course_assignments(teacher_id, course_id) WHERE is_active = true;

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

-- Add comments for documentation
COMMENT ON VIEW teacher_dashboard_summary IS 'Provides summarized statistics for teacher dashboards';
COMMENT ON VIEW teacher_student_progress_view IS 'Detailed view of student progress for teachers';
COMMENT ON VIEW teacher_course_analytics IS 'Analytics data for courses assigned to teachers';
COMMENT ON FUNCTION assign_students_to_teacher IS 'Assigns multiple students to a teacher for a specific course';
COMMENT ON FUNCTION get_teacher_student_summary IS 'Returns summarized student performance data for a teacher';
COMMENT ON FUNCTION create_rsl_content IS 'Creates a new RSL content entry for a teacher';
COMMENT ON FUNCTION record_teacher_metric IS 'Records analytics metrics for teacher performance tracking';
COMMENT ON FUNCTION get_teacher_dashboard_data IS 'Returns complete dashboard data for a teacher in JSON format';
COMMENT ON FUNCTION export_student_grades IS 'Exports student grades for a specific course';
COMMENT ON FUNCTION cleanup_old_teacher_analytics IS 'Removes old analytics data to maintain database performance';
COMMENT ON FUNCTION increment_content_view_count IS 'Increments view count for teacher or RSL content';
COMMENT ON FUNCTION get_teacher_recent_quiz_attempts IS 'Returns recent quiz attempts for students in teacher courses';