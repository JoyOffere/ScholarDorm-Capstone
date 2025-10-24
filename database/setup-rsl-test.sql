-- Test RSL functionality by ensuring there are some quiz questions
-- This will help verify the RSL video system is working

-- First, let's check what quizzes and questions we have
DO $$
DECLARE
    quiz_count INTEGER;
    question_count INTEGER;
    rsl_count INTEGER;
BEGIN
    -- Count existing data
    SELECT COUNT(*) INTO quiz_count FROM enhanced_quizzes WHERE is_published = true;
    SELECT COUNT(*) INTO question_count FROM enhanced_quiz_questions;
    SELECT COUNT(*) INTO rsl_count FROM rsl_content WHERE content_type = 'question';
    
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '- Published quizzes: %', quiz_count;
    RAISE NOTICE '- Quiz questions: %', question_count;
    RAISE NOTICE '- Question RSL videos: %', rsl_count;
    
    -- Add sample RSL content if there are questions but no RSL
    IF question_count > 0 AND rsl_count = 0 THEN
        RAISE NOTICE 'Adding sample RSL content for testing...';
        
        -- Add RSL content for the first few questions
        INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
        SELECT 
            'question',
            q.id,
            CASE 
                WHEN q.question_text ILIKE '%theorem%' OR q.question_text ILIKE '%thales%' THEN 'https://youtu.be/Plq7nrFE2i0?si=o4eAvoSUu38h0Geh'
                WHEN q.question_text ILIKE '%triangle%' OR q.question_text ILIKE '%angle%' THEN 'https://youtu.be/wZaq-YxLDag?si=CBddKcMnwwDJ55zh'
                WHEN q.question_text ILIKE '%calculate%' OR q.question_text ILIKE '%find%' THEN 'https://youtu.be/qwuR5BIfttE?si=IOmHpIQ95Nlbswf3'
                WHEN q.question_type = 'true_false' THEN 'https://youtu.be/KJz_hacF2s8?si=VFAajDCGsqhI8hSH'
                WHEN q.question_type = 'mcq' THEN 'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6'
                ELSE 'https://youtu.be/fJ_eq64iLYg?si=j_lhwCGfMtbtOE5A'
            END,
            'RSL explanation for: ' || LEFT(q.question_text, 50) || '...',
            'basic'
        FROM enhanced_quiz_questions q
        JOIN enhanced_quizzes qz ON q.quiz_id = qz.id
        WHERE qz.is_published = true
        LIMIT 10;
        
        -- Get the new count
        SELECT COUNT(*) INTO rsl_count FROM rsl_content WHERE content_type = 'question';
        RAISE NOTICE 'Added RSL content! New count: %', rsl_count;
    END IF;
    
    -- Also add some general RSL content as fallback
    INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
    VALUES 
        ('general', NULL, 'https://youtu.be/NdIz-r-hs34?si=mOHmXPNaEqzvufw6', 'General RSL introduction for mathematics', 'basic'),
        ('general', NULL, 'https://youtu.be/fJ_eq64iLYg?si=j_lhwCGfMtbtOE5A', 'Basic mathematical signs in RSL', 'basic')
    ON CONFLICT (content_type, COALESCE(content_id::text, '')) DO NOTHING;
    
    RAISE NOTICE 'RSL setup complete!';
END $$;