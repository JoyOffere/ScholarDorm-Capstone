-- Add missing RSL columns to enhanced_quizzes table if they don't exist
-- This script is safe to run multiple times

-- Add RSL columns to enhanced_quizzes
ALTER TABLE enhanced_quizzes 
ADD COLUMN IF NOT EXISTS rsl_video_url TEXT,
ADD COLUMN IF NOT EXISTS rsl_description TEXT,
ADD COLUMN IF NOT EXISTS rsl_enabled BOOLEAN DEFAULT true;

-- Add updated_at to enhanced_quiz_questions if it doesn't exist
ALTER TABLE enhanced_quiz_questions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to auto-update updated_at for enhanced_quiz_questions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_enhanced_quiz_questions_updated_at ON enhanced_quiz_questions;
CREATE TRIGGER update_enhanced_quiz_questions_updated_at 
    BEFORE UPDATE ON enhanced_quiz_questions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample RSL data to enhanced_quizzes if they don't have it
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u',
    rsl_description = CONCAT('RSL interpretation for quiz: ', title),
    rsl_enabled = true
WHERE rsl_video_url IS NULL AND is_published = true;

-- Add sample RSL videos to quiz questions if they don't have them
UPDATE enhanced_quiz_questions 
SET rsl_video_url = CASE 
    WHEN question_type = 'mcq' THEN 'https://youtu.be/Plq7nrFE2i0?si=UU0XCQ286xslFrV0'
    WHEN question_type = 'calculation' THEN 'https://youtu.be/wZaq-YxLDag?si=bPvR1wTCuXMjmrc6'
    WHEN question_type = 'word_problem' THEN 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
    ELSE 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
END
WHERE rsl_video_url IS NULL 
AND quiz_id IN (SELECT id FROM enhanced_quizzes WHERE is_published = true)
AND RANDOM() < 0.3; -- Only add to 30% of questions to simulate realistic RSL coverage

-- Verify the changes
SELECT 
    'enhanced_quizzes' as table_name,
    COUNT(*) as total_quizzes,
    COUNT(CASE WHEN rsl_video_url IS NOT NULL THEN 1 END) as with_rsl_video,
    COUNT(CASE WHEN rsl_enabled = true THEN 1 END) as rsl_enabled_count
FROM enhanced_quizzes
WHERE is_published = true

UNION ALL

SELECT 
    'enhanced_quiz_questions' as table_name,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN rsl_video_url IS NOT NULL THEN 1 END) as with_rsl_video,
    NULL as rsl_enabled_count
FROM enhanced_quiz_questions;