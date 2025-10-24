-- Add test RSL content for quiz functionality
-- This file adds sample RSL video content to test the quiz RSL functionality

-- Add general RSL content that can be used as fallback
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity) VALUES
('general', NULL, 'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6', 'General introduction to Rwandan Sign Language for mathematics', 'basic'),
('general', NULL, 'https://youtu.be/fJ_eq64iLYg?si=j_lhwCGfMtbtOE5A', 'Basic mathematical signs in RSL', 'basic');

-- Add RSL content for individual quiz questions
-- This creates question-specific RSL videos that will show for each question
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
SELECT 
    'question',
    qq.id,
    CASE 
        -- Different videos based on question content/type
        WHEN qq.question_text ILIKE '%theorem%' OR qq.question_text ILIKE '%thales%' THEN 'https://youtu.be/Plq7nrFE2i0?si=o4eAvoSUu38h0Geh'
        WHEN qq.question_text ILIKE '%triangle%' OR qq.question_text ILIKE '%angle%' THEN 'https://youtu.be/wZaq-YxLDag?si=CBddKcMnwwDJ55zh'
        WHEN qq.question_text ILIKE '%calculate%' OR qq.question_text ILIKE '%find%' THEN 'https://youtu.be/qwuR5BIfttE?si=IOmHpIQ95Nlbswf3'
        WHEN qq.question_type = 'true_false' THEN 'https://youtu.be/KJz_hacF2s8?si=VFAajDCGsqhI8hSH'
        WHEN qq.question_type = 'mcq' THEN 'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6'
        ELSE 'https://youtu.be/fJ_eq64iLYg?si=j_lhwCGfMtbtOE5A' -- Default fallback
    END,
    'RSL explanation for question: ' || LEFT(qq.question_text, 50) || '...',
    CASE 
        WHEN qq.difficulty_level = 'easy' THEN 'basic'
        WHEN qq.difficulty_level = 'medium' THEN 'intermediate'
        ELSE 'advanced'
    END
FROM enhanced_quiz_questions qq
JOIN enhanced_quizzes q ON qq.quiz_id = q.id
WHERE q.is_published = true
  AND NOT EXISTS (
      SELECT 1 FROM rsl_content r 
      WHERE r.content_type = 'question' 
      AND r.content_id = qq.id
  )
LIMIT 20; -- Add RSL videos to first 20 questions

-- Add fallback RSL content for quiz-level (lesson type) as backup
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
SELECT 
    'lesson',
    q.id,
    'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6', -- Fallback video for the whole quiz
    'RSL overview for quiz: ' || q.title,
    'basic'
FROM enhanced_quizzes q
WHERE q.is_published = true
  AND NOT EXISTS (
      SELECT 1 FROM rsl_content r 
      WHERE r.content_type = 'lesson' 
      AND r.content_id = q.id
  )
LIMIT 5; -- Only add to first 5 quizzes to avoid too many entries