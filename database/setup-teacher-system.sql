-- Teacher Role Database Setup Script
-- Run this script to set up all teacher-related database functionality

-- First, run the main teacher migration
\i database/teacher-role-migration.sql

-- Then, run the teacher utilities
\i database/teacher-utilities.sql

-- Create storage bucket for teacher content (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'teacher-content',
  'teacher-content',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for teacher content
CREATE POLICY "Teachers can upload their own content" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'teacher-content' AND
  auth.jwt() ->> 'role' = 'teacher' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can view their own content" ON storage.objects
FOR SELECT USING (
  bucket_id = 'teacher-content' AND
  (
    auth.jwt() ->> 'role' = 'teacher' AND (storage.foldername(name))[1] = auth.uid()::text
    OR auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() ->> 'role' = 'student' -- Students can view published content
  )
);

CREATE POLICY "Teachers can update their own content" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'teacher-content' AND
  auth.jwt() ->> 'role' = 'teacher' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Teachers can delete their own content" ON storage.objects
FOR DELETE USING (
  bucket_id = 'teacher-content' AND
  auth.jwt() ->> 'role' = 'teacher' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can do anything with teacher content
CREATE POLICY "Admins can manage all teacher content" ON storage.objects
FOR ALL USING (
  bucket_id = 'teacher-content' AND
  auth.jwt() ->> 'role' = 'admin'
);

-- Create some sample assignments for testing (optional)
DO $$
DECLARE
  teacher_id UUID;
  student_id UUID;
  math_course_id UUID;
BEGIN
  -- Get teacher ID
  SELECT id INTO teacher_id FROM users WHERE email = 'teacher@scholardorm.com' LIMIT 1;
  
  -- Get a student ID (create one if doesn't exist)
  SELECT id INTO student_id FROM users WHERE role = 'student' LIMIT 1;
  
  IF student_id IS NULL THEN
    INSERT INTO users (email, full_name, role, status, email_verified)
    VALUES ('student@scholardorm.com', 'Sample Student', 'student', 'active', TRUE)
    RETURNING id INTO student_id;
  END IF;
  
  -- Get math course ID
  SELECT id INTO math_course_id FROM courses WHERE title = 'Introduction to Mathematics' LIMIT 1;
  
  -- Create assignment if teacher and course exist
  IF teacher_id IS NOT NULL AND math_course_id IS NOT NULL THEN
    INSERT INTO teacher_student_assignments (teacher_id, student_id, course_id, assigned_by)
    VALUES (teacher_id, student_id, math_course_id, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1))
    ON CONFLICT (teacher_id, student_id, course_id) DO NOTHING;
    
    -- Enroll student in the course
    INSERT INTO user_courses (user_id, course_id, progress_percentage)
    VALUES (student_id, math_course_id, 45)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;
END $$;

-- Insert some sample RSL content for testing
DO $$
DECLARE
  teacher_id UUID;
BEGIN
  SELECT id INTO teacher_id FROM users WHERE email = 'teacher@scholardorm.com' LIMIT 1;
  
  IF teacher_id IS NOT NULL THEN
    INSERT INTO rsl_content (
      teacher_id, title, description, video_url, category, difficulty_level,
      sign_description, instructor_name, status
    )
    VALUES 
    (
      teacher_id,
      'Numbers 1-10 in RSL',
      'Learn to sign numbers 1 through 10 in Rwanda Sign Language',
      '/rsl_videos/numbers-1-10.mp4',
      'numbers',
      'beginner',
      'Clear demonstration of hand positions and movements for each number',
      'Sample Teacher',
      'published'
    ),
    (
      teacher_id,
      'Basic Addition Signs',
      'Mathematical addition operations using Rwanda Sign Language',
      '/rsl_videos/addition-basic.mp4',
      'mathematics',
      'intermediate',
      'Step-by-step demonstration of addition signs with visual examples',
      'Sample Teacher',
      'draft'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Create some sample analytics data
DO $$
DECLARE
  teacher_id UUID;
BEGIN
  SELECT id INTO teacher_id FROM users WHERE email = 'teacher@scholardorm.com' LIMIT 1;
  
  IF teacher_id IS NOT NULL THEN
    INSERT INTO teacher_analytics (teacher_id, metric_type, metric_name, metric_value, metadata)
    VALUES 
    (teacher_id, 'student_progress', 'daily_average_progress', 75.5, '{"date": "2024-01-16", "course_count": 2}'::jsonb),
    (teacher_id, 'engagement', 'daily_active_students', 15, '{"date": "2024-01-16", "total_students": 25}'::jsonb),
    (teacher_id, 'content_usage', 'video_views', 45, '{"content_type": "rsl_video", "date": "2024-01-16"}'::jsonb)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verify the setup
SELECT 
  'Teacher Setup Complete' as status,
  COUNT(*) as teacher_count
FROM users 
WHERE role = 'teacher';

SELECT 
  'Teacher Tables Created' as status,
  COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_name LIKE 'teacher_%' 
  AND table_schema = 'public';

SELECT 
  'Teacher Functions Created' as status,
  COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_name LIKE '%teacher%' 
  AND routine_schema = 'public';

-- Show sample data
SELECT 
  'Sample Teacher Assignments' as info,
  t.full_name as teacher,
  s.full_name as student,
  c.title as course
FROM teacher_student_assignments tsa
JOIN users t ON tsa.teacher_id = t.id
JOIN users s ON tsa.student_id = s.id
JOIN courses c ON tsa.course_id = c.id
WHERE tsa.is_active = true;

COMMIT;