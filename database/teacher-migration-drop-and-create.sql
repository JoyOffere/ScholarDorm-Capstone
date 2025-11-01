-- ULTRA SAFE Teacher Database Migration
-- This version ensures columns exist before adding foreign keys

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS teacher_gradebook CASCADE;
DROP TABLE IF EXISTS teacher_messages CASCADE;
DROP TABLE IF EXISTS teacher_analytics CASCADE;
DROP TABLE IF EXISTS rsl_content CASCADE;
DROP TABLE IF EXISTS teacher_content CASCADE;
DROP TABLE IF EXISTS teacher_course_assignments CASCADE;
DROP TABLE IF EXISTS teacher_student_assignments CASCADE;

-- 1. Teacher-Student Assignments Table
CREATE TABLE teacher_student_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Teacher Course Assignments Table
CREATE TABLE teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{"can_edit": true, "can_manage_students": true, "can_create_quizzes": true, "can_view_analytics": true}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teacher Content Library Table
CREATE TABLE teacher_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'document', 'image', 'audio', 'rsl_video', 'presentation', 'worksheet')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  category TEXT,
  subject TEXT,
  grade_level TEXT,
  language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RSL Content Management Table
CREATE TABLE rsl_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT NOT NULL CHECK (category IN ('numbers', 'letters', 'words', 'phrases', 'mathematics', 'general', 'conversational')),
  difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags JSONB DEFAULT '[]'::JSONB,
  sign_description TEXT,
  related_concepts JSONB DEFAULT '[]'::JSONB,
  transcript TEXT,
  instructor_name TEXT,
  course_id UUID,
  lesson_id UUID,
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Teacher Analytics Data Table
CREATE TABLE teacher_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('student_progress', 'course_completion', 'quiz_performance', 'engagement', 'content_usage')),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB DEFAULT '{}'::JSONB,
  date_recorded DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Teacher Messages/Communications Table
CREATE TABLE teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'general' CHECK (message_type IN ('general', 'feedback', 'encouragement', 'concern', 'assignment')),
  is_read BOOLEAN DEFAULT FALSE,
  parent_message_id UUID,
  attachments JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 7. Teacher Gradebook Table
CREATE TABLE teacher_gradebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL,
  course_id UUID NOT NULL,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('quiz', 'homework', 'project', 'exam', 'participation')),
  assignment_id UUID,
  assignment_name TEXT NOT NULL,
  points_earned NUMERIC,
  points_possible NUMERIC NOT NULL,
  percentage NUMERIC GENERATED ALWAYS AS (CASE WHEN points_possible > 0 THEN (points_earned / points_possible) * 100 ELSE 0 END) STORED,
  grade_letter TEXT,
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  late_submission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Add columns to existing tables
ALTER TABLE enhanced_quizzes ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE enhanced_quizzes ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE enhanced_quizzes ADD COLUMN IF NOT EXISTS auto_grade BOOLEAN DEFAULT TRUE;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_limit INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_open BOOLEAN DEFAULT TRUE;

ALTER TABLE enhanced_quiz_attempts ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;
ALTER TABLE enhanced_quiz_attempts ADD COLUMN IF NOT EXISTS teacher_grade NUMERIC;

-- 9. Add foreign key constraints (tables are fresh, so columns definitely exist)
-- Teacher-Student Assignments
ALTER TABLE teacher_student_assignments 
ADD CONSTRAINT fk_teacher_student_assignments_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_student_assignments 
ADD CONSTRAINT fk_teacher_student_assignments_student 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_student_assignments 
ADD CONSTRAINT fk_teacher_student_assignments_course 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Teacher Course Assignments
ALTER TABLE teacher_course_assignments 
ADD CONSTRAINT fk_teacher_course_assignments_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_course_assignments 
ADD CONSTRAINT fk_teacher_course_assignments_course 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Teacher Content
ALTER TABLE teacher_content 
ADD CONSTRAINT fk_teacher_content_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

-- RSL Content
ALTER TABLE rsl_content 
ADD CONSTRAINT fk_rsl_content_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE rsl_content 
ADD CONSTRAINT fk_rsl_content_course 
FOREIGN KEY (course_id) REFERENCES courses(id);

ALTER TABLE rsl_content 
ADD CONSTRAINT fk_rsl_content_lesson 
FOREIGN KEY (lesson_id) REFERENCES lessons(id);

-- Teacher Analytics
ALTER TABLE teacher_analytics 
ADD CONSTRAINT fk_teacher_analytics_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

-- Teacher Messages
ALTER TABLE teacher_messages 
ADD CONSTRAINT fk_teacher_messages_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_messages 
ADD CONSTRAINT fk_teacher_messages_student 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_messages 
ADD CONSTRAINT fk_teacher_messages_parent 
FOREIGN KEY (parent_message_id) REFERENCES teacher_messages(id);

-- Teacher Gradebook
ALTER TABLE teacher_gradebook 
ADD CONSTRAINT fk_teacher_gradebook_teacher 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_gradebook 
ADD CONSTRAINT fk_teacher_gradebook_student 
FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE teacher_gradebook 
ADD CONSTRAINT fk_teacher_gradebook_course 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Enhanced Quizzes
ALTER TABLE enhanced_quizzes 
ADD CONSTRAINT fk_enhanced_quizzes_created_by 
FOREIGN KEY (created_by) REFERENCES users(id);

-- 10. Add unique constraints
ALTER TABLE teacher_student_assignments 
ADD CONSTRAINT uk_teacher_student_course 
UNIQUE(teacher_id, student_id, course_id);

ALTER TABLE teacher_course_assignments 
ADD CONSTRAINT uk_teacher_course 
UNIQUE(teacher_id, course_id);

-- 11. Create indexes
CREATE INDEX idx_teacher_student_assignments_teacher ON teacher_student_assignments(teacher_id);
CREATE INDEX idx_teacher_student_assignments_student ON teacher_student_assignments(student_id);
CREATE INDEX idx_teacher_course_assignments_teacher ON teacher_course_assignments(teacher_id);
CREATE INDEX idx_teacher_course_assignments_course ON teacher_course_assignments(course_id);
CREATE INDEX idx_teacher_content_teacher ON teacher_content(teacher_id);
CREATE INDEX idx_teacher_content_status ON teacher_content(status);
CREATE INDEX idx_rsl_content_teacher ON rsl_content(teacher_id);
CREATE INDEX idx_rsl_content_category ON rsl_content(category);
CREATE INDEX idx_teacher_analytics_teacher ON teacher_analytics(teacher_id);
CREATE INDEX idx_teacher_analytics_date ON teacher_analytics(date_recorded);
CREATE INDEX idx_teacher_messages_teacher ON teacher_messages(teacher_id);
CREATE INDEX idx_teacher_messages_student ON teacher_messages(student_id);
CREATE INDEX idx_teacher_gradebook_teacher ON teacher_gradebook(teacher_id);
CREATE INDEX idx_teacher_gradebook_student ON teacher_gradebook(student_id);
CREATE INDEX idx_teacher_gradebook_course ON teacher_gradebook(course_id);