-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Users Table - Enhanced with more fields
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  department TEXT,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin', 'teacher')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  email_verified BOOLEAN DEFAULT FALSE,
  accessibility_preferences JSONB DEFAULT '{"high_contrast": false, "large_text": false, "show_rsl": true}'::JSONB
);
-- User Authentication Table - For tracking authentication methods
CREATE TABLE IF NOT EXISTS user_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  auth_provider TEXT NOT NULL DEFAULT 'email',
  auth_provider_id TEXT,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, auth_provider)
);
-- Activities Table (for tracking streaks and user actions)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::JSONB
);
-- Badges Table - Enhanced with badge types and levels
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint
  description TEXT,
  image_url TEXT,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('streak', 'achievement', 'course', 'special')),
  level INTEGER DEFAULT 1,
  criteria JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Badges Table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 100,
  metadata JSONB DEFAULT '{}'::JSONB,
  UNIQUE(user_id, badge_id)
);
-- Courses Table - Enhanced with more fields
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint
  description TEXT,
  image_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  subject TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  prerequisites JSONB DEFAULT '[]'::JSONB,
  learning_objectives JSONB DEFAULT '[]'::JSONB,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);
-- Course Categories Table
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Course to Category Mapping
CREATE TABLE IF NOT EXISTS course_category_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES course_categories(id) ON DELETE CASCADE,
  UNIQUE(course_id, category_id)
);
-- Course Sections Table
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Lessons Table - Enhanced with more fields
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL,
  rsl_video_url TEXT,
  estimated_duration_minutes INTEGER DEFAULT 10,
  order_index INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Lesson Resources Table
CREATE TABLE IF NOT EXISTS lesson_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('document', 'video', 'audio', 'link', 'other')),
  resource_url TEXT NOT NULL,
  is_downloadable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Progress Table - Enhanced with more detailed tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_position_seconds INTEGER DEFAULT 0,
  completion_date TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, lesson_id)
);
-- Notifications Table - Enhanced with more fields
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('streak_reminder', 'badge_earned', 'course_recommendation', 'announcement', 'system')),
  urgency TEXT DEFAULT 'low' CHECK (urgency IN ('low', 'medium', 'high')),
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);
-- Audit Logs Table - Enhanced for better tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Settings Table - Enhanced with more preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  notification_preferences JSONB DEFAULT '{"streak_reminders": true, "badge_notifications": true, "course_recommendations": true, "system_updates": true}'::JSONB,
  accessibility_settings JSONB DEFAULT '{"high_contrast": false, "large_text": false, "show_rsl": true, "screen_reader_optimized": false}'::JSONB,
  learning_preferences JSONB DEFAULT '{"preferred_subjects": [], "learning_pace": "normal", "content_format": "mixed"}'::JSONB,
  display_settings JSONB DEFAULT '{"theme": "light", "dashboard_layout": "default"}'::JSONB,
  language_preference TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Courses Table (for enrollment) - Enhanced with more tracking
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_url TEXT,
  favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  UNIQUE(user_id, course_id)
);
-- Quizzes Table - Enhanced with more quiz options
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  time_limit_minutes INTEGER,
  passing_score INTEGER NOT NULL,
  max_attempts INTEGER DEFAULT NULL,
  randomize_questions BOOLEAN DEFAULT FALSE,
  show_answers BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Quiz Questions Table - Enhanced with more question types
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'matching', 'short_answer', 'essay')),
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Quiz Attempts Table - Enhanced with more tracking
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentage FLOAT NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL,
  time_spent_seconds INTEGER,
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES users(id)
);
-- Games Table - Enhanced with more game options
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint
  description TEXT,
  image_url TEXT,
  game_type TEXT NOT NULL,
  subject TEXT,
  difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  instructions TEXT,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- User Games Table (for unlocked games) - Enhanced with more tracking
CREATE TABLE IF NOT EXISTS user_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  high_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  times_played INTEGER DEFAULT 0,
  total_time_played_seconds INTEGER DEFAULT 0,
  achievements JSONB DEFAULT '[]'::JSONB,
  last_played TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, game_id)
);
-- Posts Table (for announcements, updates, etc.) - Enhanced with more options
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL UNIQUE, -- Added UNIQUE constraint
  content TEXT NOT NULL,
  summary TEXT,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT FALSE,
  publish_date TIMESTAMP WITH TIME ZONE,
  post_type TEXT NOT NULL CHECK (post_type IN ('announcement', 'update', 'motivational', 'news', 'blog')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'admins', 'teachers')),
  featured_image_url TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  likes_count INTEGER DEFAULT 0,
  comments_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'content', 'general')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  admin_response TEXT,
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);
-- Create Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
-- Policy for users to access only their own data
CREATE POLICY "Users can view and edit their own data" ON users
  FOR ALL USING (auth.uid() = id);
-- Policy for activities
CREATE POLICY "Users can view and create their own activities" ON activities
  FOR ALL USING (auth.uid() = user_id);
-- Policy for user badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);
-- Policy for user progress
CREATE POLICY "Users can view and update their own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);
-- Policy for notifications
CREATE POLICY "Users can view and update their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
-- Policy for audit logs (only admins can see all, users can see their own)
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);
-- Policy for user settings
CREATE POLICY "Users can view and update their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
-- Policy for user courses
CREATE POLICY "Users can view and update their own enrollments" ON user_courses
  FOR ALL USING (auth.uid() = user_id);
-- Policy for quiz attempts
CREATE POLICY "Users can view and create their own quiz attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);
-- Policy for user games
CREATE POLICY "Users can view and update their own games" ON user_games
  FOR ALL USING (auth.uid() = user_id);
-- Policy for comments
CREATE POLICY "Users can manage their own comments" ON comments
  FOR ALL USING (auth.uid() = user_id);
-- Policy for feedback
CREATE POLICY "Users can view and create their own feedback" ON feedback
  FOR ALL USING (auth.uid() = user_id);
-- Policy for certificates
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = user_id);
-- Admins can view all data
CREATE POLICY "Admins can do anything" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON activities
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON badges
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON user_badges
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON course_categories
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON course_sections
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON lessons
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON lesson_resources
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON user_progress
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON audit_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON user_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON user_courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON quizzes
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON quiz_questions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON quiz_attempts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON games
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON user_games
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON posts
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON comments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON feedback
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can do anything" ON certificates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
-- Public courses and lessons can be viewed by anyone
CREATE POLICY "Anyone can view courses" ON courses
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view course categories" ON course_categories
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view published lessons" ON lessons
  FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);
CREATE POLICY "Anyone can view quizzes" ON quizzes
  FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published posts" ON posts
  FOR SELECT USING (is_published = true);
-- Create function to update user streaks
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_activity TIMESTAMP;
    current_streak INT;
BEGIN
    -- Get the timestamp of the user's last activity
    SELECT MAX(created_at) INTO last_activity
    FROM public.activities
    WHERE user_id = NEW.user_id AND created_at < CURRENT_DATE;
    -- Get the user's current streak
    SELECT streak_count INTO current_streak
    FROM public.users
    WHERE id = NEW.user_id;
    -- If this is the first activity of the day and the last activity was yesterday, increment streak
    IF NOT EXISTS (
        SELECT 1 FROM public.activities 
        WHERE user_id = NEW.user_id 
        AND created_at::date = CURRENT_DATE
        AND id != NEW.id
    ) THEN
        IF last_activity IS NULL OR last_activity::date = (CURRENT_DATE - INTERVAL '1 day')::date THEN
            -- Increment streak
            UPDATE public.users
            SET 
                streak_count = streak_count + 1,
                longest_streak = GREATEST(streak_count + 1, longest_streak)
            WHERE id = NEW.user_id;
            -- Check if badge should be awarded
            IF (current_streak + 1) IN (3, 7, 14, 30) THEN
                -- Logic to award streak badge
                INSERT INTO public.notifications (
                    user_id, 
                    title, 
                    message, 
                    type, 
                    urgency
                )
                VALUES (
                    NEW.user_id,
                    'New Streak Achievement!',
                    'Congratulations! You''ve maintained a learning streak for ' || (current_streak + 1) || ' days.',
                    'badge_earned',
                    'medium'
                );
            END IF;
        ELSIF last_activity::date < (CURRENT_DATE - INTERVAL '1 day')::date THEN
            -- Reset streak if more than a day has passed
            UPDATE public.users
            SET streak_count = 1
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger for streak updates
CREATE TRIGGER update_streak_trigger
AFTER INSERT ON public.activities
FOR EACH ROW
EXECUTE FUNCTION update_user_streak();
-- Create admin user (required for course and post insertions)
INSERT INTO users (email, full_name, role, status, email_verified)
VALUES ('admin@scholardorm.com', 'Admin User', 'admin', 'active', TRUE)
ON CONFLICT (email) DO NOTHING;
-- Insert default course categories
INSERT INTO course_categories (name, description, icon)
VALUES 
('Mathematics', 'Math courses covering arithmetic, algebra, geometry, and more', 'calculator'),
('Science', 'Science courses covering physics, chemistry, biology, and more', 'flask'),
('Language', 'Language courses for learning and improving communication skills', 'message-circle'),
('History', 'History courses exploring past events and civilizations', 'book'),
('Technology', 'Technology courses teaching computer and digital skills', 'laptop'),
('Arts', 'Arts courses exploring creativity and expression', 'palette'),
('Life Skills', 'Practical skills for everyday life and personal development', 'compass')
ON CONFLICT (name) DO NOTHING;
-- Insert demo badges
INSERT INTO badges (name, description, image_url, badge_type, level, criteria)
VALUES 
('3-Day Streak', 'Maintained a learning streak for 3 days', 'https://ui-avatars.com/api/?name=3D&background=FF9800&color=fff', 'streak', 1, '{"streak_count": 3}'),
('7-Day Streak', 'Maintained a learning streak for 7 days', 'https://ui-avatars.com/api/?name=7D&background=FF5722&color=fff', 'streak', 2, '{"streak_count": 7}'),
('14-Day Streak', 'Maintained a learning streak for 14 days', 'https://ui-avatars.com/api/?name=14D&background=E91E63&color=fff', 'streak', 3, '{"streak_count": 14}'),
('30-Day Streak', 'Maintained a learning streak for 30 days', 'https://ui-avatars.com/api/?name=30D&background=9C27B0&color=fff', 'streak', 4, '{"streak_count": 30}'),
('First Course', 'Completed your first course', 'https://ui-avatars.com/api/?name=1C&background=4CAF50&color=fff', 'achievement', 1, '{"courses_completed": 1}'),
('Math Whiz', 'Completed all mathematics courses', 'https://ui-avatars.com/api/?name=MW&background=2196F3&color=fff', 'course', 3, '{"category": "Mathematics", "all_completed": true}'),
('Science Explorer', 'Completed all science courses', 'https://ui-avatars.com/api/?name=SE&background=3F51B5&color=fff', 'course', 3, '{"category": "Science", "all_completed": true}'),
('Perfect Quiz', 'Scored 100% on a quiz', 'https://ui-avatars.com/api/?name=PQ&background=00BCD4&color=fff', 'achievement', 2, '{"quiz_score": 100}'),
('Dedicated Learner', 'Spent over 10 hours learning', 'https://ui-avatars.com/api/?name=DL&background=009688&color=fff', 'achievement', 2, '{"time_spent_hours": 10}'),
('Feedback Champion', 'Provided valuable feedback on 5 courses', 'https://ui-avatars.com/api/?name=FC&background=8BC34A&color=fff', 'achievement', 1, '{"feedback_count": 5}')
ON CONFLICT (name) DO NOTHING;
-- Insert default courses
INSERT INTO courses (title, description, image_url, difficulty_level, subject, duration_minutes, is_active, created_by)
VALUES 
('Introduction to Mathematics', 'Learn basic mathematical concepts and operations', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1470&auto=format&fit=crop', 'beginner', 'Mathematics', 120, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1)),
('Basic Science Concepts', 'Explore fundamental principles of science', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1470&auto=format&fit=crop', 'beginner', 'Science', 180, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1)),
('Rwandan History', 'Learn about the rich history and culture of Rwanda', 'https://images.unsplash.com/photo-1580881997974-303dd4864902?q=80&w=1470&auto=format&fit=crop', 'intermediate', 'History', 240, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1)),
('English Language Basics', 'Develop essential English language skills', 'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?q=80&w=1635&auto=format&fit=crop', 'beginner', 'Language', 150, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1)),
('Advanced Mathematics', 'Explore complex mathematical concepts and problem-solving', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=1470&auto=format&fit=crop', 'advanced', 'Mathematics', 300, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1)),
('Computer Skills', 'Learn essential computer skills for the digital age', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1470&auto=format&fit=crop', 'intermediate', 'Technology', 210, true, (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1))
ON CONFLICT (title) DO NOTHING;
-- Map courses to categories
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'Introduction to Mathematics' AND cat.name = 'Mathematics'
ON CONFLICT (course_id, category_id) DO NOTHING;
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'Basic Science Concepts' AND cat.name = 'Science'
ON CONFLICT (course_id, category_id) DO NOTHING;
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'Rwandan History' AND cat.name = 'History'
ON CONFLICT (course_id, category_id) DO NOTHING;
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'English Language Basics' AND cat.name = 'Language'
ON CONFLICT (course_id, category_id) DO NOTHING;
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'Advanced Mathematics' AND cat.name = 'Mathematics'
ON CONFLICT (course_id, category_id) DO NOTHING;
INSERT INTO course_category_mapping (course_id, category_id)
SELECT c.id, cat.id
FROM courses c, course_categories cat
WHERE c.title = 'Computer Skills' AND cat.name = 'Technology'
ON CONFLICT (course_id, category_id) DO NOTHING;
-- Insert default posts
INSERT INTO posts (title, content, summary, author_id, is_published, publish_date, post_type, target_audience)
VALUES 
('Welcome to ScholarDorm!', 'We are excited to have you join our learning community. ScholarDorm is designed to provide accessible education for all students.', 'Welcome message for new users', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), true, NOW(), 'announcement', 'all'),
('New Science Course Available', 'We have just launched a new science course exploring fundamental concepts. Enroll now to start learning!', 'Announcement of new course', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), true, NOW(), 'update', 'students'),
('Maintenance Scheduled', 'The platform will be down for maintenance on Saturday from 2 AM to 4 AM. We apologize for any inconvenience.', 'System maintenance notice', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), true, NOW(), 'announcement', 'all'),
('Keep Your Streak Going!', 'Did you know that maintaining a learning streak helps improve retention? Login daily to build your streak!', 'Motivation for daily learning', (SELECT id FROM users WHERE email = 'admin@scholardorm.com' LIMIT 1), true, NOW(), 'motivational', 'students')
ON CONFLICT (title) DO NOTHING;
-- Insert default games
INSERT INTO games (title, description, image_url, game_type, subject, difficulty_level, config)
VALUES 
('Math Challenge', 'Test your math skills with this fun game!', 'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?q=80&w=1470&auto=format&fit=crop', 'quiz', 'Mathematics', 'medium', '{"time_limit": 60, "questions_count": 10, "difficulty": "medium"}'),
('Memory Match', 'Improve your memory by matching pairs of cards', 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=1470&auto=format&fit=crop', 'memory', 'Cognitive', 'easy', '{"pairs": 8, "themes": ["animals", "numbers", "shapes"]}'),
('Word Scramble', 'Unscramble words to improve your language skills', 'https://images.unsplash.com/photo-1605106702734-205df224ecce?q=80&w=1470&auto=format&fit=crop', 'word', 'Language', 'medium', '{"difficulty": "medium", "categories": ["animals", "countries", "food"]}')
ON CONFLICT (title) DO NOTHING;