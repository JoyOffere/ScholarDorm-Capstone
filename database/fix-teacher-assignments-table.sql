-- Quick fix: Add missing assigned_by column to existing teacher_course_assignments table

-- Add the assigned_by column if it doesn't exist
ALTER TABLE teacher_course_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_teacher_course_assignments_assigned_by ON teacher_course_assignments(assigned_by);

-- Update any existing records to have assigned_by as the first admin user (optional)
UPDATE teacher_course_assignments 
SET assigned_by = (
  SELECT id FROM users WHERE role = 'admin' LIMIT 1
)
WHERE assigned_by IS NULL;