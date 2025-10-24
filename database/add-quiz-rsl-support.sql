-- Add RSL video support at the quiz level
-- This allows each quiz to have its own RSL video that shows before questions

-- Add RSL video URL field to enhanced_quizzes table
ALTER TABLE enhanced_quizzes 
ADD COLUMN IF NOT EXISTS rsl_video_url TEXT,
ADD COLUMN IF NOT EXISTS rsl_description TEXT,
ADD COLUMN IF NOT EXISTS rsl_enabled BOOLEAN DEFAULT true;

-- Add comments to document the new fields
COMMENT ON COLUMN enhanced_quizzes.rsl_video_url IS 'URL to the RSL (Rwandan Sign Language) video for this quiz, shown before questions';
COMMENT ON COLUMN enhanced_quizzes.rsl_description IS 'Description of what the RSL video covers for this quiz';
COMMENT ON COLUMN enhanced_quizzes.rsl_enabled IS 'Whether RSL video should be shown for this quiz';

-- Add sample RSL video data for existing quizzes based on the provided question data
-- These are quiz-level RSL videos that introduce the entire quiz topic

-- Pythagoras Theorem Quiz RSL
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u',
    rsl_description = 'Introduction to Pythagoras theorem concepts in Rwandan Sign Language',
    rsl_enabled = true
WHERE title ILIKE '%pythagoras%' OR title ILIKE '%theorem%';

-- Statistics Quiz RSL  
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM',
    rsl_description = 'Introduction to statistics: mean, median, and mode in Rwandan Sign Language',
    rsl_enabled = true
WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%' OR title ILIKE '%mode%';

-- Simultaneous Equations Quiz RSL
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn',
    rsl_description = 'Introduction to simultaneous linear equations in Rwandan Sign Language',
    rsl_enabled = true
WHERE title ILIKE '%simultaneous%' OR title ILIKE '%linear equations%';

-- Thales Theorem Quiz RSL
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI',
    rsl_description = 'Introduction to Thales theorem and similar triangles in Rwandan Sign Language',
    rsl_enabled = true
WHERE title ILIKE '%thales%' OR title ILIKE '%similar%';

-- Indices and Surds Quiz RSL
UPDATE enhanced_quizzes 
SET 
    rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS',
    rsl_description = 'Introduction to indices and surds in Rwandan Sign Language',
    rsl_enabled = true
WHERE title ILIKE '%indices%' OR title ILIKE '%surds%';

-- Create an index for better performance when querying RSL-enabled quizzes
CREATE INDEX IF NOT EXISTS idx_enhanced_quizzes_rsl_enabled ON enhanced_quizzes(rsl_enabled) WHERE rsl_enabled = true;

-- Update any remaining quizzes that might not have been caught by the patterns above
UPDATE enhanced_quizzes 
SET rsl_enabled = true
WHERE rsl_video_url IS NOT NULL AND rsl_enabled IS NULL;

-- Add RSL videos for individual questions based on subject and order

-- Pythagoras Theorem Questions RSL Videos (in order)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 1;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/Plq7nrFE2i0?si=UU0XCQ286xslFrV0'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 2;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/wZaq-YxLDag?si=bPvR1wTCuXMjmrc6'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 3;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 4;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 5;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/KJz_hacF2s8?si=IoGCyu0NrSUka-l-'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%pythagoras%')
AND order_index = 6;

-- Statistics Questions RSL Videos (in order)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 1;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/_wuiEQ8f25Y?si=it_vPmIn3nYF7Y6o'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 2;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/-BTRIemDidk?si=pzw-GhINbm577WAZ'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 3;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/EkDPupyxrEM?si=kDH2esLiNfH0xPDv'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 4;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/l4kJbEtOAZs?si=ikEEUkQzMr_hs6tA'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 5;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/Cp_SmwJrETo?si=adBlaEpcf5E1TAg6'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 6;

-- Simultaneous Equations Questions RSL Videos (in order)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 1;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/2Htd1Eojt-Q?si=t4f82PEB6L7kDXaU'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 2;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/JIaUA5TsL-U?si=x1OjONQKmJDwBedd'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 3;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/_oYmopR6hZQ?si=BXTLXYHfaZnqzuIA'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 4;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/CAeynUBkLJs?si=KUwA-NMcY8p4HGCg'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 5;

-- Thales Theorem Questions RSL Videos (in order)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 1;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/gjzwbZnJuBU?si=r7jZKSuTbObK2ADS'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 2;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/H56ogGAgGX0?si=he8L1tdkoKWjIXrD'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 3;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/NdIz-r-hs34?si=b0yHCloGDMvmGhw9'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 4;

-- Verification query to check the updates
SELECT 
    q.title as quiz_title,
    q.rsl_video_url as quiz_rsl_video, 
    q.rsl_description, 
    q.rsl_enabled,
    qq.order_index,
    qq.question_text,
    qq.rsl_video_url as question_rsl_video
FROM enhanced_quizzes q 
LEFT JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
WHERE q.rsl_video_url IS NOT NULL OR qq.rsl_video_url IS NOT NULL
ORDER BY q.title, qq.order_index;