-- Add course_id column to lessons table
ALTER TABLE lessons ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

-- Populate course_id from course_sections
UPDATE lessons
SET course_id = course_sections.course_id
FROM course_sections
WHERE lessons.section_id = course_sections.id;

-- Make course_id NOT NULL if needed (optional, since sections are required)
-- ALTER TABLE lessons ALTER COLUMN course_id SET NOT NULL;
o