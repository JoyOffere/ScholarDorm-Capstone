-- Rwanda S2 Mathematics seed data - Simplified version without complex HTML
-- This version avoids JSON escaping issues

-- Insert the 5 Rwanda S2 Mathematics courses into existing courses table
INSERT INTO courses (
    title, description, subject, difficulty_level, duration_minutes,
    prerequisites, learning_objectives, is_featured, is_active, 
    created_by, grade_level, estimated_duration_hours, has_rsl_support
) VALUES 
-- Course 1: Pythagoras' Theorem
(
    'Pythagoras Theorem Mastery',
    'Master the fundamentals of Pythagoras theorem through interactive lessons and practical applications. Learn to find missing sides in right-angled triangles and apply this knowledge to real-world problems.',
    'Mathematics',
    'beginner',
    150,
    '["Basic geometry", "Understanding of squares and square roots"]'::JSONB,
    '["Understand and apply Pythagoras theorem", "Identify right-angled triangles and the hypotenuse", "Calculate missing sides in right triangles", "Solve real-world problems using Pythagoras theorem", "Recognize when to use the theorem in practical situations"]'::JSONB,
    true,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Senior 2',
    2.5,
    true
),
-- Course 2: Statistics Fundamentals
(
    'Statistics: Mean, Median & Mode',
    'Discover the world of statistics through central tendency measures. Learn to analyze data, calculate averages, and interpret statistical information in everyday contexts.',
    'Mathematics',
    'beginner',
    120,
    '["Basic arithmetic", "Number ordering"]'::JSONB,
    '["Calculate mean, median, and mode of datasets", "Understand when to use each measure of central tendency", "Organize and interpret data effectively", "Apply statistical concepts to real-world scenarios", "Compare and contrast different measures of central tendency"]'::JSONB,
    true,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Senior 2',
    2.0,
    true
),
-- Course 3: Simultaneous Linear Equations
(
    'Solving Simultaneous Linear Equations',
    'Learn multiple methods to solve systems of linear equations. Master substitution and elimination techniques to find solutions that satisfy multiple conditions simultaneously.',
    'Mathematics',
    'intermediate',
    180,
    '["Linear equations", "Basic algebra", "Graphing basics"]'::JSONB,
    '["Solve simultaneous equations using substitution method", "Apply elimination method to solve systems", "Interpret solutions in context of real problems", "Identify when systems have no solution or infinite solutions", "Model real-world problems using simultaneous equations"]'::JSONB,
    true,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Senior 2',
    3.0,
    true
),
-- Course 4: Thales' Theorem
(
    'Thales Theorem and Similar Triangles',
    'Explore the relationships between parallel lines and proportional sides. Understand similarity in triangles and apply Thales theorem to solve geometric problems.',
    'Mathematics',
    'intermediate',
    150,
    '["Basic geometry", "Understanding of triangles", "Proportions"]'::JSONB,
    '["State and apply Thales theorem", "Identify similar triangles using Thales theorem", "Calculate proportional sides in similar triangles", "Understand the relationship between parallel lines and proportionality", "Solve geometric problems using similarity principles"]'::JSONB,
    false,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Senior 2',
    2.5,
    true
),
-- Course 5: Indices and Surds
(
    'Indices and Surds Simplified',
    'Master the laws of exponents and work with surds (irrational numbers involving square roots). Learn to simplify complex expressions and solve problems involving powers and roots.',
    'Mathematics',
    'intermediate',
    150,
    '["Basic algebra", "Understanding of square roots", "Number properties"]'::JSONB,
    '["Apply the laws of indices to simplify expressions", "Work with surds and rationalize denominators", "Distinguish between rational and irrational numbers", "Simplify expressions involving powers and roots", "Solve practical problems using indices and surds"]'::JSONB,
    true,
    true,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    'Senior 2',
    2.5,
    true
)
ON CONFLICT (title) DO UPDATE SET
    description = EXCLUDED.description,
    subject = EXCLUDED.subject,
    difficulty_level = EXCLUDED.difficulty_level,
    duration_minutes = EXCLUDED.duration_minutes,
    prerequisites = EXCLUDED.prerequisites,
    learning_objectives = EXCLUDED.learning_objectives,
    is_featured = EXCLUDED.is_featured,
    grade_level = EXCLUDED.grade_level,
    estimated_duration_hours = EXCLUDED.estimated_duration_hours,
    has_rsl_support = EXCLUDED.has_rsl_support,
    updated_at = NOW();

-- Create course sections for each mathematics course
WITH course_data AS (
    SELECT id, title FROM courses WHERE subject = 'Mathematics' AND grade_level = 'Senior 2'
)
INSERT INTO course_sections_bridge (course_id, title, description, order_index)
SELECT 
    id, 
    'Main Content', 
    'Primary lessons for ' || title,
    1
FROM course_data
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Insert lessons for Course 1: Pythagoras Theorem
WITH course_pythagoras AS (
    SELECT id as course_id FROM courses WHERE title = 'Pythagoras Theorem Mastery'
), section_pythagoras AS (
    SELECT csb.id as section_id 
    FROM course_sections_bridge csb 
    JOIN courses c ON csb.course_id = c.id 
    WHERE c.title = 'Pythagoras Theorem Mastery'
)
INSERT INTO enhanced_lessons (
    course_id, section_id, title, description, content, content_type, content_html, 
    estimated_duration_minutes, order_index, learning_objectives, key_concepts, difficulty_tags, is_preview
)
SELECT 
    cp.course_id,
    sp.section_id,
    lesson_data.title,
    lesson_data.description,
    json_build_object(
        'type', lesson_data.content_type,
        'title', lesson_data.title,
        'description', lesson_data.description
    )::JSONB as content,
    lesson_data.content_type,
    lesson_data.content_html,
    lesson_data.duration_minutes,
    lesson_data.order_index,
    lesson_data.learning_objectives,
    lesson_data.key_concepts,
    lesson_data.difficulty_tags,
    lesson_data.is_preview
FROM course_pythagoras cp, section_pythagoras sp,
(VALUES
    (1, 'Introduction to Right-Angled Triangles', 'Learn to identify right-angled triangles and understand their properties.', 'mixed',
     'A right-angled triangle is a triangle that has one angle equal to 90 degrees. Key features: Right angle (90°), Hypotenuse (longest side), Other two sides (legs). Memory tip: The hypotenuse is always the longest side!', 
     5, ARRAY['Identify right-angled triangles', 'Name parts of a right triangle'], 
     ARRAY['right angle', 'hypotenuse', 'triangle properties'], ARRAY['easy'], true),
     
    (2, 'Understanding the Hypotenuse', 'Master the concept of the hypotenuse and its relationship to other sides.', 'mixed',
     'The hypotenuse is the side opposite the right angle and is always the longest side. To identify: 1) Find the right angle (90°), 2) The side opposite this angle is the hypotenuse, 3) It will be the longest of the three sides. Example: In a triangle with sides 3, 4, and 5 units, the hypotenuse is 5 units.', 
     5, ARRAY['Identify the hypotenuse in any right triangle'], 
     ARRAY['hypotenuse', 'longest side', 'right angle'], ARRAY['easy'], false),
     
    (3, 'Pythagoras Theorem Formula', 'Learn the famous formula and understand what each part means.', 'mixed',
     'The famous formula: c² = a² + b². Where c = hypotenuse, a = one leg, b = other leg. In simple words: The square of the hypotenuse equals the sum of squares of the other two sides. Example: If a = 3 and b = 4, then c² = 3² + 4² = 9 + 16 = 25, so c = √25 = 5', 
     5, ARRAY['State Pythagoras theorem', 'Understand the formula components'], 
     ARRAY['formula', 'squares', 'hypotenuse calculation'], ARRAY['easy'], false),
     
    (4, 'Calculating Missing Sides', 'Practice using the theorem to find unknown side lengths.', 'mixed',
     'Method 1 - Finding the hypotenuse: 1) Square both known sides, 2) Add the squares together, 3) Take the square root. Example: Given sides a = 6 and b = 8. Step 1: 6² = 36, 8² = 64. Step 2: 36 + 64 = 100. Step 3: √100 = 10. Method 2 - Finding a leg: If you know the hypotenuse and one leg, use a² = c² - b²', 
     5, ARRAY['Calculate hypotenuse length', 'Find missing leg lengths'], 
     ARRAY['calculation steps', 'square roots', 'missing sides'], ARRAY['moderate'], false),
     
    (5, 'Real-World Applications', 'Apply Pythagoras theorem to solve practical problems.', 'mixed',
     'Common applications: Ladders against walls, TV screen sizes (diagonal measurement), Construction and carpentry, Navigation and GPS. Word Problem Example: A ladder is 10 meters long and its base is 6 meters from a wall. How high up the wall does it reach? Solution: Given: Hypotenuse (ladder) = 10m, Base = 6m. Find: Height (h). Using: h² = 10² - 6² = 100 - 36 = 64. Therefore: h = √64 = 8 meters', 
     5, ARRAY['Apply theorem to real situations', 'Solve word problems'], 
     ARRAY['word problems', 'practical applications', 'problem solving'], ARRAY['moderate'], false),
     
    (6, 'Challenge Problems and Review', 'Test your mastery with challenging problems and comprehensive review.', 'mixed',
     'Challenge Problem: A square has a diagonal of 14 cm. What is the length of one side? Hint: In a square, the diagonal divides it into two right triangles. Solution: Let side length = s. Diagonal² = s² + s² = 2s². 14² = 2s². 196 = 2s². s² = 98. s = √98 ≈ 9.9 cm. Quick Review: Right triangles have one 90° angle, Hypotenuse is the longest side, Formula: c² = a² + b², Used in many real-world situations', 
     5, ARRAY['Solve challenging problems', 'Review all concepts'], 
     ARRAY['advanced problems', 'comprehensive review', 'mastery'], ARRAY['challenge'], false)
) AS lesson_data(order_index, title, description, content_type, content_html, duration_minutes, learning_objectives, key_concepts, difficulty_tags, is_preview)
ON CONFLICT (course_id, order_index) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    content = EXCLUDED.content,
    content_type = EXCLUDED.content_type,
    content_html = EXCLUDED.content_html,
    estimated_duration_minutes = EXCLUDED.estimated_duration_minutes,
    learning_objectives = EXCLUDED.learning_objectives,
    key_concepts = EXCLUDED.key_concepts,
    difficulty_tags = EXCLUDED.difficulty_tags,
    is_preview = EXCLUDED.is_preview,
    updated_at = NOW();

-- Create quizzes for each course - Fixed version
INSERT INTO enhanced_quizzes (course_id, title, description, quiz_type, max_attempts, passing_score)
SELECT 
    c.id,
    quiz_data.title,
    quiz_data.description,
    quiz_data.quiz_type,
    quiz_data.max_attempts,
    quiz_data.passing_score
FROM courses c,
(VALUES
    ('Pythagoras Theorem Mastery', 'Pythagoras Theorem Assessment', 'Test your understanding of right triangles and the Pythagoras theorem', 'assessment', 3, 70.00),
    ('Statistics: Mean, Median & Mode', 'Statistics Mastery Quiz', 'Evaluate your knowledge of mean, median, and mode calculations', 'assessment', 3, 70.00),
    ('Solving Simultaneous Linear Equations', 'Simultaneous Equations Test', 'Challenge your ability to solve systems of linear equations', 'assessment', 3, 70.00),
    ('Thales Theorem and Similar Triangles', 'Thales Theorem Quiz', 'Assess your understanding of similar triangles and proportionality', 'assessment', 3, 70.00),
    ('Indices and Surds Simplified', 'Indices and Surds Assessment', 'Test your mastery of exponents and surds', 'assessment', 3, 70.00)
) AS quiz_data(course_title, title, description, quiz_type, max_attempts, passing_score)
WHERE c.title = quiz_data.course_title;

-- Insert quiz questions for Pythagoras Theorem
WITH pythagoras_quiz AS (
    SELECT q.id as quiz_id 
    FROM enhanced_quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Pythagoras Theorem Mastery'
)
INSERT INTO enhanced_quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    pq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options::JSONB,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficulty_level,
    question_data.points,
    question_data.order_index,
    question_data.topic_tag
FROM pythagoras_quiz pq,
(VALUES
    ('In a right-angled triangle, which side is the hypotenuse?', 'mcq', 
     '{"A": "The shortest side", "B": "The longest side", "C": "The side opposite the smallest angle"}',
     'B', 'The hypotenuse is always the longest side in a right triangle, opposite the right angle.', 
     'easy', 1.00, 1, 'pythagoras_basics'),
     
    ('If one side of a right triangle is 3 cm and another is 4 cm, what is the hypotenuse?', 'mcq',
     '{"A": "5 cm", "B": "7 cm", "C": "12 cm", "D": "25 cm"}',
     'A', 'Using Pythagoras theorem: c² = 3² + 4² = 9 + 16 = 25, so c = √25 = 5 cm', 
     'easy', 1.00, 2, 'pythagoras_calculation'),
     
    ('The Pythagoras theorem applies to which type of triangle?', 'mcq',
     '{"A": "Equilateral", "B": "Right-angled", "C": "Isosceles"}',
     'B', 'Pythagoras theorem only applies to right-angled triangles (triangles with a 90° angle).', 
     'easy', 1.00, 3, 'pythagoras_basics'),
     
    ('Write the formula for Pythagoras theorem.', 'short_answer',
     NULL, 'c² = a² + b²', 
     'The standard form where c is the hypotenuse and a, b are the other two sides.', 
     'easy', 1.00, 4, 'pythagoras_formula'),
     
    ('A ladder is leaning on a wall. The base is 6 m away and the ladder is 10 m long. How high does it reach?', 'word_problem',
     NULL, '8 m',
     'Using h² = 10² - 6² = 100 - 36 = 64, so h = √64 = 8 meters', 
     'moderate', 2.00, 5, 'pythagoras_application'),
     
    ('A square has a diagonal of 14 cm. What is the length of one side? (Round to 1 decimal place)', 'word_problem',
     NULL, '9.9 cm',
     'In a square, diagonal² = side² + side² = 2×side². So 14² = 2×side², 196 = 2×side², side² = 98, side = √98 ≈ 9.9 cm', 
     'challenge', 3.00, 6, 'pythagoras_advanced')
) AS question_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index, topic_tag);

-- Add sample RSL content for enhanced lessons
INSERT INTO rsl_content (content_type, content_id, rsl_video_url, description, sign_complexity)
SELECT 
    'lesson',
    l.id,
    'https://example.com/rsl/lesson_' || l.id || '.mp4',
    'RSL interpretation for: ' || l.title,
    CASE 
        WHEN 'easy' = ANY(l.difficulty_tags) THEN 'basic'
        WHEN 'moderate' = ANY(l.difficulty_tags) THEN 'intermediate'
        ELSE 'advanced'
    END
FROM enhanced_lessons l
WHERE l.course_id IN (
    SELECT id FROM courses WHERE subject = 'Mathematics' AND grade_level = 'Senior 2'
);

-- Update course lesson counts
UPDATE courses SET total_lessons = (
    SELECT COUNT(*) FROM enhanced_lessons WHERE course_id = courses.id AND is_published = true
) WHERE subject = 'Mathematics' AND grade_level = 'Senior 2';