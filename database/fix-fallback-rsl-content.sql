-- Fix fallback RSL content to use real video links instead of placeholders
-- This script updates any sample or fallback RSL content with actual video URLs

-- Update any existing rsl_content entries that might have placeholder URLs
UPDATE rsl_content 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE rsl_video_url LIKE '%example%' 
OR rsl_video_url LIKE '%placeholder%'
OR rsl_video_url LIKE '%sample%'
OR rsl_video_url LIKE '%test%';

-- Update lesson-level RSL videos based on lesson content and subject matter
-- Pythagoras Theorem lessons - Different RSL videos for each lesson based on their specific content

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE title ILIKE '%Introduction to Right-Angled Triangles%' OR title ILIKE '%right angle%';

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/Plq7nrFE2i0?si=UU0XCQ286xslFrV0'
WHERE title ILIKE '%Understanding the Hypotenuse%' OR title ILIKE '%hypotenuse%';

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/wZaq-YxLDag?si=bPvR1wTCuXMjmrc6'
WHERE title ILIKE '%Pythagoras Theorem Formula%' OR title ILIKE '%formula%';

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
WHERE title ILIKE '%Calculating Missing Sides%' OR title ILIKE '%calculation%' OR title ILIKE '%missing sides%';

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
WHERE title ILIKE '%Real-World Applications%' OR title ILIKE '%practical%' OR title ILIKE '%applications%';

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/KJz_hacF2s8?si=IoGCyu0NrSUka-l-'
WHERE title ILIKE '%Challenge Problems%' OR title ILIKE '%review%' OR title ILIKE '%challenge%';

-- Statistics lessons - Update based on subject
UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%'
) AND order_index = 1;

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/_wuiEQ8f25Y?si=it_vPmIn3nYF7Y6o'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%'
) AND order_index = 2;

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/-BTRIemDidk?si=pzw-GhINbm577WAZ'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%' OR title ILIKE '%median%'
) AND order_index = 3;

-- Simultaneous Equations lessons
UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%simultaneous%' OR title ILIKE '%equations%'
) AND order_index = 1;

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/2Htd1Eojt-Q?si=t4f82PEB6L7kDXaU'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%simultaneous%' OR title ILIKE '%equations%'
) AND order_index = 2;

-- Thales Theorem lessons
UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%thales%' OR title ILIKE '%similar%'
) AND order_index = 1;

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/gjzwbZnJuBU?si=r7jZKSuTbObK2ADS'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%thales%' OR title ILIKE '%similar%'
) AND order_index = 2;

-- Indices and Surds lessons
UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%indices%' OR title ILIKE '%surds%'
) AND order_index = 1;

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
WHERE course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%indices%' OR title ILIKE '%surds%'
) AND order_index = 2;

-- Clean up any remaining placeholder or broken URLs in rsl_content table
DELETE FROM rsl_content 
WHERE rsl_video_url LIKE 'https://example.com%' 
OR rsl_video_url = '' 
OR rsl_video_url IS NULL;

-- Add proper RSL content entries for lessons based on their specific content
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
SELECT 
    'lesson',
    l.id,
    CASE 
        -- Pythagoras lessons - specific videos for each lesson
        WHEN l.title ILIKE '%Introduction to Right-Angled Triangles%' THEN 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
        WHEN l.title ILIKE '%Understanding the Hypotenuse%' THEN 'https://youtu.be/Plq7nrFE2i0?si=UU0XCQ286xslFrV0'
        WHEN l.title ILIKE '%Pythagoras Theorem Formula%' THEN 'https://youtu.be/wZaq-YxLDag?si=bPvR1wTCuXMjmrc6'
        WHEN l.title ILIKE '%Calculating Missing Sides%' THEN 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
        WHEN l.title ILIKE '%Real-World Applications%' THEN 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
        WHEN l.title ILIKE '%Challenge Problems%' THEN 'https://youtu.be/KJz_hacF2s8?si=IoGCyu0NrSUka-l-'
        
        -- Statistics lessons by order
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 1 THEN 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 2 THEN 'https://youtu.be/_wuiEQ8f25Y?si=it_vPmIn3nYF7Y6o'
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 3 THEN 'https://youtu.be/-BTRIemDidk?si=pzw-GhINbm577WAZ'
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 4 THEN 'https://youtu.be/EkDPupyxrEM?si=kDH2esLiNfH0xPDv'
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 5 THEN 'https://youtu.be/l4kJbEtOAZs?si=ikEEUkQzMr_hs6tA'
        WHEN c.title ILIKE '%statistics%' AND l.order_index = 6 THEN 'https://youtu.be/Cp_SmwJrETo?si=adBlaEpcf5E1TAg6'
        
        -- Simultaneous Equations lessons by order
        WHEN c.title ILIKE '%simultaneous%' AND l.order_index = 1 THEN 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn'
        WHEN c.title ILIKE '%simultaneous%' AND l.order_index = 2 THEN 'https://youtu.be/2Htd1Eojt-Q?si=t4f82PEB6L7kDXaU'
        WHEN c.title ILIKE '%simultaneous%' AND l.order_index = 3 THEN 'https://youtu.be/JIaUA5TsL-U?si=x1OjONQKmJDwBedd'
        WHEN c.title ILIKE '%simultaneous%' AND l.order_index = 4 THEN 'https://youtu.be/_oYmopR6hZQ?si=BXTLXYHfaZnqzuIA'
        WHEN c.title ILIKE '%simultaneous%' AND l.order_index = 5 THEN 'https://youtu.be/CAeynUBkLJs?si=KUwA-NMcY8p4HGCg'
        
        -- Thales Theorem lessons by order
        WHEN c.title ILIKE '%thales%' AND l.order_index = 1 THEN 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
        WHEN c.title ILIKE '%thales%' AND l.order_index = 2 THEN 'https://youtu.be/gjzwbZnJuBU?si=r7jZKSuTbObK2ADS'
        WHEN c.title ILIKE '%thales%' AND l.order_index = 3 THEN 'https://youtu.be/H56ogGAgGX0?si=he8L1tdkoKWjIXrD'
        WHEN c.title ILIKE '%thales%' AND l.order_index = 4 THEN 'https://youtu.be/NdIz-r-hs34?si=b0yHCloGDMvmGhw9'
        
        -- Indices and Surds lessons by order
        WHEN c.title ILIKE '%indices%' AND l.order_index = 1 THEN 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
        WHEN c.title ILIKE '%indices%' AND l.order_index = 2 THEN 'https://youtu.be/qwuR5BIfttE?si=ohhbOczHjBLg9gi_'
        WHEN c.title ILIKE '%indices%' AND l.order_index = 3 THEN 'https://youtu.be/KJz_hacF2s8?si=IoGCyu0NrSUka-l-'
        WHEN c.title ILIKE '%indices%' AND l.order_index = 4 THEN 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
        
        -- Default fallback
        ELSE 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
    END,
    CONCAT('RSL interpretation for lesson: ', l.title),
    CASE 
        WHEN l.difficulty_tags IS NOT NULL AND (
            l.difficulty_tags::text ILIKE '%easy%' OR 
            l.difficulty_tags::text LIKE '%"easy"%'
        ) THEN 'basic'
        WHEN l.difficulty_tags IS NOT NULL AND (
            l.difficulty_tags::text ILIKE '%moderate%' OR 
            l.difficulty_tags::text LIKE '%"moderate"%'
        ) THEN 'intermediate'
        WHEN l.difficulty_tags IS NOT NULL AND (
            l.difficulty_tags::text ILIKE '%challenge%' OR 
            l.difficulty_tags::text LIKE '%"challenge"%' OR
            l.difficulty_tags::text ILIKE '%hard%' OR 
            l.difficulty_tags::text LIKE '%"hard"%'
        ) THEN 'advanced'
        ELSE 'intermediate'
    END
FROM enhanced_lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.subject = 'Mathematics' 
AND c.grade_level = 'Senior 2'
AND l.rsl_video_url IS NOT NULL  -- Only add to rsl_content if lesson has RSL video
AND NOT EXISTS (
    SELECT 1 FROM rsl_content rc 
    WHERE rc.content_type = 'lesson' 
    AND rc.content_id = l.id
);

-- Verify all RSL content now has real video URLs
SELECT 
    content_type,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN rsl_video_url LIKE 'https://youtu.be/%' THEN 1 END) as youtube_videos,
    COUNT(CASE WHEN rsl_video_url NOT LIKE 'https://youtu.be/%' THEN 1 END) as non_youtube_videos
FROM rsl_content
GROUP BY content_type;

-- Final comprehensive check: Show all RSL coverage
SELECT 
    'Quiz' as content_type,
    q.title as content_title,
    CASE WHEN q.rsl_video_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rsl_video,
    q.rsl_video_url
FROM enhanced_quizzes q
WHERE q.rsl_enabled = true

UNION ALL

SELECT 
    'Question' as content_type,
    CONCAT(q.title, ' - Q', qq.order_index, ': ', LEFT(qq.question_text, 50), '...') as content_title,
    CASE WHEN qq.rsl_video_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rsl_video,
    qq.rsl_video_url
FROM enhanced_quizzes q
JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
WHERE q.rsl_enabled = true

UNION ALL

SELECT 
    'Lesson' as content_type,
    l.title as content_title,
    CASE WHEN l.rsl_video_url IS NOT NULL THEN 'YES' ELSE 'NO' END as has_rsl_video,
    l.rsl_video_url
FROM enhanced_lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.subject = 'Mathematics' AND c.grade_level = 'Senior 2'

ORDER BY content_type, content_title;