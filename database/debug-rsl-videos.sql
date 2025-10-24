-- Debug query to check RSL video availability in database
-- Run this to verify that RSL videos are properly populated

-- Check quiz-level RSL videos
SELECT 
    'Quiz Level' as rsl_level,
    id,
    title,
    rsl_enabled,
    rsl_video_url,
    rsl_description
FROM enhanced_quizzes 
WHERE rsl_video_url IS NOT NULL 
ORDER BY title;

-- Check question-level RSL videos
SELECT 
    'Question Level' as rsl_level,
    qq.id,
    q.title as quiz_title,
    qq.order_index,
    LEFT(qq.question_text, 100) as question_preview,
    qq.rsl_video_url
FROM enhanced_quiz_questions qq
JOIN enhanced_quizzes q ON qq.quiz_id = q.id
WHERE qq.rsl_video_url IS NOT NULL 
ORDER BY q.title, qq.order_index;

-- Check lesson-level RSL videos
SELECT 
    'Lesson Level' as rsl_level,
    l.id,
    l.title,
    c.title as course_title,
    l.rsl_video_url
FROM enhanced_lessons l
JOIN courses c ON l.course_id = c.id
WHERE l.rsl_video_url IS NOT NULL 
ORDER BY c.title, l.order_index;

-- Summary count
SELECT 
    'Quiz RSL Videos' as type,
    COUNT(*) as count
FROM enhanced_quizzes 
WHERE rsl_video_url IS NOT NULL

UNION ALL

SELECT 
    'Question RSL Videos' as type,
    COUNT(*) as count
FROM enhanced_quiz_questions 
WHERE rsl_video_url IS NOT NULL

UNION ALL

SELECT 
    'Lesson RSL Videos' as type,
    COUNT(*) as count
FROM enhanced_lessons 
WHERE rsl_video_url IS NOT NULL;