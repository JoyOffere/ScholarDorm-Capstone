-- SAFE MIGRATION SCRIPT
-- Run this to apply changes gradually without breaking existing functionality

-- Step 1: Add new columns to existing courses table (all optional)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS grade_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS has_rsl_support BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prerequisites TEXT[],
ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- Step 2: Create new tables (won't affect existing data)
-- Only run the enhanced-course-schema.sql if you want the full system
-- Otherwise, existing functionality continues to work as-is

-- Step 3: Populate sample data (optional)
-- Only run the seed files when you're ready for the enhanced course system

-- ROLLBACK PLAN (if needed)
-- To revert new columns: ALTER TABLE courses DROP COLUMN IF EXISTS grade_level;
-- New tables can be dropped: DROP TABLE IF EXISTS lessons CASCADE;