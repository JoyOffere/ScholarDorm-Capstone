-- Add missing RSL video URLs for questions that don't have them yet
-- This script fills in the gaps from the previous migration

-- Add missing RSL videos for Indices and Surds questions
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 1 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/Plq7nrFE2i0?si=UU0XCQ286xslFrV0'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 2 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/wZaq-YxLDag?si=bPvR1wTCuXMjmrc6'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 3 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 4 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 5 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/KJz_hacF2s8?si=IoGCyu0NrSUka-l-'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 6 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 7 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/_wuiEQ8f25Y?si=it_vPmIn3nYF7Y6o'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 8 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/-BTRIemDidk?si=pzw-GhINbm577WAZ'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 9 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/EkDPupyxrEM?si=kDH2esLiNfH0xPDv'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%indices%' OR title ILIKE '%surds%')
AND order_index = 10 AND rsl_video_url IS NULL;

-- Add missing RSL videos for remaining Simultaneous Equations questions (6-8)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/2Htd1Eojt-Q?si=t4f82PEB6L7kDXaU'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 6 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/JIaUA5TsL-U?si=x1OjONQKmJDwBedd'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 7 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/_oYmopR6hZQ?si=BXTLXYHfaZnqzuIA'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%simultaneous%')
AND order_index = 8 AND rsl_video_url IS NULL;

-- Add missing RSL videos for remaining Statistics questions (7-8)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/l4kJbEtOAZs?si=ikEEUkQzMr_hs6tA'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 7 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/Cp_SmwJrETo?si=adBlaEpcf5E1TAg6'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%')
AND order_index = 8 AND rsl_video_url IS NULL;

-- Add missing RSL videos for remaining Thales Theorem questions (5-8)
UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 5 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/gjzwbZnJuBU?si=r7jZKSuTbObK2ADS'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 6 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/H56ogGAgGX0?si=he8L1tdkoKWjIXrD'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 7 AND rsl_video_url IS NULL;

UPDATE enhanced_quiz_questions 
SET rsl_video_url = 'https://youtu.be/NdIz-r-hs34?si=b0yHCloGDMvmGhw9'
WHERE quiz_id IN (SELECT id FROM enhanced_quizzes WHERE title ILIKE '%thales%')
AND order_index = 8 AND rsl_video_url IS NULL;

-- Verification: Show all quiz questions with their RSL videos
SELECT 
    q.title as quiz_title,
    qq.order_index,
    qq.question_text,
    CASE 
        WHEN qq.rsl_video_url IS NOT NULL THEN 'HAS RSL VIDEO'
        ELSE 'MISSING RSL VIDEO'
    END as rsl_status,
    qq.rsl_video_url
FROM enhanced_quizzes q 
LEFT JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
WHERE q.rsl_enabled = true
ORDER BY q.title, qq.order_index;

-- Summary: Count questions with and without RSL videos by quiz
SELECT 
    q.title as quiz_title,
    COUNT(qq.id) as total_questions,
    COUNT(qq.rsl_video_url) as questions_with_rsl,
    COUNT(qq.id) - COUNT(qq.rsl_video_url) as questions_missing_rsl
FROM enhanced_quizzes q 
LEFT JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
WHERE q.rsl_enabled = true
GROUP BY q.id, q.title
ORDER BY q.title;