-- Minimal test to check if users table foreign key works
-- Run this first to test the basic relationship

CREATE TABLE IF NOT EXISTS test_teacher_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Now add the foreign key constraint separately
ALTER TABLE test_teacher_table 
ADD CONSTRAINT fk_teacher_user 
FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE;