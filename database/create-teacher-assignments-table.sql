-- Create teacher_course_assignments table for the admin teacher assignments feature
-- First, try to create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Removed UNIQUE constraint to allow multiple assignments per teacher-course pair
);

-- Add the assigned_by column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_course_assignments' 
        AND column_name = 'assigned_by'
    ) THEN
        ALTER TABLE teacher_course_assignments 
        ADD COLUMN assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_teacher_id ON teacher_course_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_course_id ON teacher_course_assignments(course_id);

-- Add index for assigned_by column if it exists
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_course_assignments' 
        AND column_name = 'assigned_by'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_assigned_by ON teacher_course_assignments(assigned_by);
    END IF;
END $$;

-- Add RLS policies for teacher_course_assignments
ALTER TABLE teacher_course_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all assignments
CREATE POLICY "Users can view teacher course assignments" ON teacher_course_assignments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert assignments
CREATE POLICY "Admins can create teacher course assignments" ON teacher_course_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Only admins can update assignments
CREATE POLICY "Admins can update teacher course assignments" ON teacher_course_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Only admins can delete assignments
CREATE POLICY "Admins can delete teacher course assignments" ON teacher_course_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );