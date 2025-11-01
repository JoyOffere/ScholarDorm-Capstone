-- Remove unique constraint to allow teachers to have multiple assignments to the same course

-- Step 1: Find the constraint name
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'teacher_course_assignments' 
AND constraint_type = 'UNIQUE';

-- Step 2: Drop the constraint using common PostgreSQL naming patterns
-- Try the most common constraint name pattern first:
ALTER TABLE teacher_course_assignments DROP CONSTRAINT IF EXISTS teacher_course_assignments_teacher_id_course_id_key;

-- Alternative: Try common constraint name patterns
ALTER TABLE teacher_course_assignments DROP CONSTRAINT IF EXISTS teacher_course_assignments_teacher_id_key;
ALTER TABLE teacher_course_assignments DROP CONSTRAINT IF EXISTS teacher_course_assignments_pkey1;

-- Automated approach: Drop all unique constraints on this table
DO $$ 
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'teacher_course_assignments' 
        AND constraint_type = 'UNIQUE'
    LOOP
        EXECUTE 'ALTER TABLE teacher_course_assignments DROP CONSTRAINT ' || constraint_record.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;