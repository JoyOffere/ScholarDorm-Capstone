-- Comprehensive Quiz Edit Functions
-- These functions handle CRUD operations for quizzes and quiz questions

-- Function to create a new quiz
CREATE OR REPLACE FUNCTION create_quiz(
    p_course_id UUID,
    p_lesson_id UUID DEFAULT NULL,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_quiz_type VARCHAR(20) DEFAULT 'assessment',
    p_time_limit_minutes INTEGER DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 3,
    p_passing_score DECIMAL(5,2) DEFAULT 70.00,
    p_randomize_questions BOOLEAN DEFAULT FALSE,
    p_show_results_immediately BOOLEAN DEFAULT TRUE,
    p_is_published BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_quiz_id UUID;
    result JSON;
BEGIN
    -- Insert new quiz
    INSERT INTO enhanced_quizzes (
        course_id, lesson_id, title, description, quiz_type,
        time_limit_minutes, max_attempts, passing_score,
        randomize_questions, show_results_immediately, is_published
    ) VALUES (
        p_course_id, p_lesson_id, p_title, p_description, p_quiz_type,
        p_time_limit_minutes, p_max_attempts, p_passing_score,
        p_randomize_questions, p_show_results_immediately, p_is_published
    ) RETURNING id INTO new_quiz_id;
    
    -- Return the created quiz data
    SELECT json_build_object(
        'id', id,
        'course_id', course_id,
        'lesson_id', lesson_id,
        'title', title,
        'description', description,
        'quiz_type', quiz_type,
        'time_limit_minutes', time_limit_minutes,
        'max_attempts', max_attempts,
        'passing_score', passing_score,
        'randomize_questions', randomize_questions,
        'show_results_immediately', show_results_immediately,
        'is_published', is_published,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result
    FROM enhanced_quizzes
    WHERE id = new_quiz_id;
    
    RETURN result;
END;
$$;

-- Function to update an existing quiz
CREATE OR REPLACE FUNCTION update_quiz(
    p_quiz_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_quiz_type VARCHAR(20) DEFAULT NULL,
    p_time_limit_minutes INTEGER DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT NULL,
    p_passing_score DECIMAL(5,2) DEFAULT NULL,
    p_randomize_questions BOOLEAN DEFAULT NULL,
    p_show_results_immediately BOOLEAN DEFAULT NULL,
    p_is_published BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Update quiz with non-null parameters only
    UPDATE enhanced_quizzes
    SET 
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        quiz_type = COALESCE(p_quiz_type, quiz_type),
        time_limit_minutes = COALESCE(p_time_limit_minutes, time_limit_minutes),
        max_attempts = COALESCE(p_max_attempts, max_attempts),
        passing_score = COALESCE(p_passing_score, passing_score),
        randomize_questions = COALESCE(p_randomize_questions, randomize_questions),
        show_results_immediately = COALESCE(p_show_results_immediately, show_results_immediately),
        is_published = COALESCE(p_is_published, is_published),
        updated_at = NOW()
    WHERE id = p_quiz_id;
    
    -- Return the updated quiz data
    SELECT json_build_object(
        'id', id,
        'course_id', course_id,
        'lesson_id', lesson_id,
        'title', title,
        'description', description,
        'quiz_type', quiz_type,
        'time_limit_minutes', time_limit_minutes,
        'max_attempts', max_attempts,
        'passing_score', passing_score,
        'randomize_questions', randomize_questions,
        'show_results_immediately', show_results_immediately,
        'is_published', is_published,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO result
    FROM enhanced_quizzes
    WHERE id = p_quiz_id;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Quiz with ID % not found', p_quiz_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to delete a quiz
CREATE OR REPLACE FUNCTION delete_quiz(p_quiz_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    quiz_exists BOOLEAN;
BEGIN
    -- Check if quiz exists
    SELECT EXISTS(SELECT 1 FROM enhanced_quizzes WHERE id = p_quiz_id) INTO quiz_exists;
    
    IF NOT quiz_exists THEN
        RAISE EXCEPTION 'Quiz with ID % not found', p_quiz_id;
    END IF;
    
    -- Delete the quiz (cascade will handle questions and attempts)
    DELETE FROM enhanced_quizzes WHERE id = p_quiz_id;
    
    RETURN TRUE;
END;
$$;

-- Function to add a question to a quiz
CREATE OR REPLACE FUNCTION add_quiz_question(
    p_quiz_id UUID,
    p_question_text TEXT,
    p_question_type VARCHAR(20) DEFAULT 'mcq',
    p_options JSONB DEFAULT NULL,
    p_correct_answer TEXT,
    p_explanation TEXT DEFAULT NULL,
    p_difficulty_level VARCHAR(20) DEFAULT 'easy',
    p_points DECIMAL(5,2) DEFAULT 1.00,
    p_topic_tag VARCHAR(100) DEFAULT NULL,
    p_rsl_video_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_question_id UUID;
    new_order_index INTEGER;
    result JSON;
BEGIN
    -- Get the next order index for this quiz
    SELECT COALESCE(MAX(order_index), 0) + 1 INTO new_order_index
    FROM enhanced_quiz_questions
    WHERE quiz_id = p_quiz_id;
    
    -- Insert new question
    INSERT INTO enhanced_quiz_questions (
        quiz_id, question_text, question_type, options, correct_answer,
        explanation, difficulty_level, points, order_index, topic_tag, rsl_video_url
    ) VALUES (
        p_quiz_id, p_question_text, p_question_type, p_options, p_correct_answer,
        p_explanation, p_difficulty_level, p_points, new_order_index, p_topic_tag, p_rsl_video_url
    ) RETURNING id INTO new_question_id;
    
    -- Return the created question data
    SELECT json_build_object(
        'id', id,
        'quiz_id', quiz_id,
        'question_text', question_text,
        'question_type', question_type,
        'options', options,
        'correct_answer', correct_answer,
        'explanation', explanation,
        'difficulty_level', difficulty_level,
        'points', points,
        'order_index', order_index,
        'topic_tag', topic_tag,
        'rsl_video_url', rsl_video_url,
        'created_at', created_at
    ) INTO result
    FROM enhanced_quiz_questions
    WHERE id = new_question_id;
    
    RETURN result;
END;
$$;

-- Function to update a quiz question
CREATE OR REPLACE FUNCTION update_quiz_question(
    p_question_id UUID,
    p_question_text TEXT DEFAULT NULL,
    p_question_type VARCHAR(20) DEFAULT NULL,
    p_options JSONB DEFAULT NULL,
    p_correct_answer TEXT DEFAULT NULL,
    p_explanation TEXT DEFAULT NULL,
    p_difficulty_level VARCHAR(20) DEFAULT NULL,
    p_points DECIMAL(5,2) DEFAULT NULL,
    p_topic_tag VARCHAR(100) DEFAULT NULL,
    p_rsl_video_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Update question with non-null parameters only
    UPDATE enhanced_quiz_questions
    SET 
        question_text = COALESCE(p_question_text, question_text),
        question_type = COALESCE(p_question_type, question_type),
        options = COALESCE(p_options, options),
        correct_answer = COALESCE(p_correct_answer, correct_answer),
        explanation = COALESCE(p_explanation, explanation),
        difficulty_level = COALESCE(p_difficulty_level, difficulty_level),
        points = COALESCE(p_points, points),
        topic_tag = COALESCE(p_topic_tag, topic_tag),
        rsl_video_url = COALESCE(p_rsl_video_url, rsl_video_url)
    WHERE id = p_question_id;
    
    -- Return the updated question data
    SELECT json_build_object(
        'id', id,
        'quiz_id', quiz_id,
        'question_text', question_text,
        'question_type', question_type,
        'options', options,
        'correct_answer', correct_answer,
        'explanation', explanation,
        'difficulty_level', difficulty_level,
        'points', points,
        'order_index', order_index,
        'topic_tag', topic_tag,
        'rsl_video_url', rsl_video_url,
        'created_at', created_at
    ) INTO result
    FROM enhanced_quiz_questions
    WHERE id = p_question_id;
    
    IF result IS NULL THEN
        RAISE EXCEPTION 'Quiz question with ID % not found', p_question_id;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to delete a quiz question
CREATE OR REPLACE FUNCTION delete_quiz_question(p_question_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    question_exists BOOLEAN;
    affected_quiz_id UUID;
BEGIN
    -- Check if question exists and get quiz_id
    SELECT quiz_id INTO affected_quiz_id
    FROM enhanced_quiz_questions 
    WHERE id = p_question_id;
    
    IF affected_quiz_id IS NULL THEN
        RAISE EXCEPTION 'Quiz question with ID % not found', p_question_id;
    END IF;
    
    -- Delete the question
    DELETE FROM enhanced_quiz_questions WHERE id = p_question_id;
    
    -- Reorder remaining questions in the quiz
    WITH ordered_questions AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) as new_order
        FROM enhanced_quiz_questions
        WHERE quiz_id = affected_quiz_id
    )
    UPDATE enhanced_quiz_questions
    SET order_index = ordered_questions.new_order
    FROM ordered_questions
    WHERE enhanced_quiz_questions.id = ordered_questions.id;
    
    RETURN TRUE;
END;
$$;

-- Function to reorder quiz questions
CREATE OR REPLACE FUNCTION reorder_quiz_questions(
    p_quiz_id UUID,
    p_question_orders JSONB -- Array of {id: UUID, order: INTEGER}
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    question_order RECORD;
BEGIN
    -- Update order for each question
    FOR question_order IN 
        SELECT 
            (value->>'id')::UUID as question_id,
            (value->>'order')::INTEGER as new_order
        FROM jsonb_array_elements(p_question_orders)
    LOOP
        UPDATE enhanced_quiz_questions
        SET order_index = question_order.new_order
        WHERE id = question_order.question_id AND quiz_id = p_quiz_id;
    END LOOP;
    
    RETURN TRUE;
END;
$$;

-- Function to get quiz with questions
CREATE OR REPLACE FUNCTION get_quiz_with_questions(p_quiz_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    quiz_data JSON;
    questions_data JSON;
    result JSON;
BEGIN
    -- Get quiz data
    SELECT json_build_object(
        'id', id,
        'course_id', course_id,
        'lesson_id', lesson_id,
        'title', title,
        'description', description,
        'quiz_type', quiz_type,
        'time_limit_minutes', time_limit_minutes,
        'max_attempts', max_attempts,
        'passing_score', passing_score,
        'randomize_questions', randomize_questions,
        'show_results_immediately', show_results_immediately,
        'is_published', is_published,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO quiz_data
    FROM enhanced_quizzes
    WHERE id = p_quiz_id;
    
    IF quiz_data IS NULL THEN
        RAISE EXCEPTION 'Quiz with ID % not found', p_quiz_id;
    END IF;
    
    -- Get questions data
    SELECT json_agg(
        json_build_object(
            'id', id,
            'question_text', question_text,
            'question_type', question_type,
            'options', options,
            'correct_answer', correct_answer,
            'explanation', explanation,
            'difficulty_level', difficulty_level,
            'points', points,
            'order_index', order_index,
            'topic_tag', topic_tag,
            'rsl_video_url', rsl_video_url,
            'created_at', created_at
        ) ORDER BY order_index
    ) INTO questions_data
    FROM enhanced_quiz_questions
    WHERE quiz_id = p_quiz_id;
    
    -- Combine quiz and questions data
    result := quiz_data || json_build_object('questions', COALESCE(questions_data, '[]'::json));
    
    RETURN result;
END;
$$;

-- Grant execution permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_quiz(UUID, UUID, TEXT, TEXT, VARCHAR, INTEGER, INTEGER, DECIMAL, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_quiz(UUID, TEXT, TEXT, VARCHAR, INTEGER, INTEGER, DECIMAL, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_quiz(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_quiz_question(UUID, TEXT, VARCHAR, JSONB, TEXT, TEXT, VARCHAR, DECIMAL, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_quiz_question(UUID, TEXT, VARCHAR, JSONB, TEXT, TEXT, VARCHAR, DECIMAL, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_quiz_question(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_quiz_questions(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_quiz_with_questions(UUID) TO authenticated;