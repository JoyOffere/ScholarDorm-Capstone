-- Fix fallback RSL content to use real video links instead of placeholders
-- This script updates any sample or fallback RSL content with actual video URLs

-- Update any existing rsl_content entries that might have placeholder URLs
UPDATE rsl_content 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE rsl_video_url LIKE '%example%' 
OR rsl_video_url LIKE '%placeholder%'
OR rsl_video_url LIKE '%sample%'
OR rsl_video_url LIKE '%test%';

-- Update any lesson-level RSL content to use appropriate subject videos
UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
WHERE rsl_video_url IS NULL 
AND course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%pythagoras%' OR title ILIKE '%theorem%'
);

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
WHERE rsl_video_url IS NULL 
AND course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%statistics%' OR title ILIKE '%mean%'
);

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn'
WHERE rsl_video_url IS NULL 
AND course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%simultaneous%' OR title ILIKE '%equations%'
);

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
WHERE rsl_video_url IS NULL 
AND course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%thales%' OR title ILIKE '%similar%'
);

UPDATE enhanced_lessons 
SET rsl_video_url = 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
WHERE rsl_video_url IS NULL 
AND course_id IN (
    SELECT id FROM courses WHERE title ILIKE '%indices%' OR title ILIKE '%surds%'
);

-- Clean up any remaining placeholder or broken URLs in rsl_content table
DELETE FROM rsl_content 
WHERE rsl_video_url LIKE 'https://example.com%' 
OR rsl_video_url = '' 
OR rsl_video_url IS NULL;

-- Add proper RSL content entries for lessons if they don't exist
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
SELECT 
    'lesson',
    l.id,
    CASE 
        WHEN c.title ILIKE '%pythagoras%' THEN 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
        WHEN c.title ILIKE '%statistics%' THEN 'https://youtu.be/nMdKLhZNJHI?si=hZXlx_XYTe8bnAvM'
        WHEN c.title ILIKE '%simultaneous%' THEN 'https://youtu.be/EJuzonH5w30?si=1tPL-lpeNuJ2sohn'
        WHEN c.title ILIKE '%thales%' THEN 'https://youtu.be/YFCxqFMAwmU?si=8dtu-V5TyHThtBnI'
        WHEN c.title ILIKE '%indices%' OR c.title ILIKE '%surds%' THEN 'https://youtu.be/CQ22PxiOFaM?si=geNbP0eMGZSY2zhS'
        ELSE 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u'
    END,
    'RSL interpretation for: ' || l.title,
    'intermediate'
FROM enhanced_lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.subject = 'Mathematics' 
AND c.grade_level = 'Senior 2'
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