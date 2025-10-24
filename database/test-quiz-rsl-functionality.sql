-- Test script to verify RSL functionality and quiz-level RSL videos
-- Run this after the main migration to verify everything works correctly

-- 1. Check if quiz-level RSL columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'enhanced_quizzes' 
AND column_name IN ('rsl_video_url', 'rsl_description', 'rsl_enabled')
ORDER BY column_name;

-- 2. Show current RSL status of all quizzes
SELECT 
    id,
    title,
    rsl_enabled,
    CASE 
        WHEN rsl_video_url IS NOT NULL THEN 'HAS VIDEO'
        ELSE 'NO VIDEO'
    END as video_status,
    rsl_description,
    is_published,
    created_at
FROM enhanced_quizzes 
ORDER BY title;

-- 3. Count RSL-enabled quizzes
SELECT 
    COUNT(*) as total_quizzes,
    COUNT(CASE WHEN rsl_enabled = true THEN 1 END) as rsl_enabled_quizzes,
    COUNT(CASE WHEN rsl_video_url IS NOT NULL THEN 1 END) as quizzes_with_videos,
    COUNT(CASE WHEN rsl_enabled = true AND rsl_video_url IS NOT NULL THEN 1 END) as fully_rsl_ready
FROM enhanced_quizzes;

-- 4. Show detailed RSL information for debugging
SELECT 
    q.title as quiz_title,
    q.rsl_enabled,
    q.rsl_video_url,
    q.rsl_description,
    COUNT(qq.id) as question_count,
    COUNT(CASE WHEN qq.rsl_video_url IS NOT NULL THEN 1 END) as questions_with_rsl
FROM enhanced_quizzes q
LEFT JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
GROUP BY q.id, q.title, q.rsl_enabled, q.rsl_video_url, q.rsl_description
ORDER BY q.title;

-- 5. Insert sample quiz-level RSL data for testing (if needed)
-- UPDATE enhanced_quizzes 
-- SET 
--     rsl_video_url = 'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6',
--     rsl_description = 'Introduction to quiz topics in Rwandan Sign Language',
--     rsl_enabled = true
-- WHERE title ILIKE '%pythagoras%' AND rsl_video_url IS NULL;

-- 6. Verify the update worked
SELECT title, rsl_enabled, rsl_video_url, rsl_description 
FROM enhanced_quizzes 
WHERE rsl_video_url IS NOT NULL
ORDER BY title;