-- Rwanda S2 Mathematics seed data - Compatible with existing schema
-- This version works with your existing table structure

-- Insert the 5 Rwanda S2 Mathematics courses into existing courses table
INSERT INTO courses (
    title, description, subject, difficulty_level, duration_minutes,
    prerequisites, learning_objectives, is_featured, is_active, 
    created_by, grade_level, estimated_duration_hours, has_rsl_support
) VALUES 
-- Course 1: Pythagoras' Theorem
(
    'Pythagoras'' Theorem Mastery',
    'Master the fundamentals of Pythagoras'' theorem through interactive lessons and practical applications. Learn to find missing sides in right-angled triangles and apply this knowledge to real-world problems.',
    'Mathematics',
    'beginner',
    150,
    '["Basic geometry", "Understanding of squares and square roots"]'::JSONB,
    '["Understand and apply Pythagoras'' theorem", "Identify right-angled triangles and the hypotenuse", "Calculate missing sides in right triangles", "Solve real-world problems using Pythagoras'' theorem", "Recognize when to use the theorem in practical situations"]'::JSONB,
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
    'Thales'' Theorem and Similar Triangles',
    'Explore the relationships between parallel lines and proportional sides. Understand similarity in triangles and apply Thales'' theorem to solve geometric problems.',
    'Mathematics',
    'intermediate',
    150,
    '["Basic geometry", "Understanding of triangles", "Proportions"]'::JSONB,
    '["State and apply Thales'' theorem", "Identify similar triangles using Thales'' theorem", "Calculate proportional sides in similar triangles", "Understand the relationship between parallel lines and proportionality", "Solve geometric problems using similarity principles"]'::JSONB,
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

-- First, create course sections for each mathematics course
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

-- Insert lessons for Course 1: Pythagoras' Theorem using enhanced_lessons table
WITH course_pythagoras AS (
    SELECT id as course_id FROM courses WHERE title = 'Pythagoras'' Theorem Mastery'
), section_pythagoras AS (
    SELECT csb.id as section_id 
    FROM course_sections_bridge csb 
    JOIN courses c ON csb.course_id = c.id 
    WHERE c.title = 'Pythagoras'' Theorem Mastery'
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
        'html', lesson_data.content_html,
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
     '<h2>What is a Right-Angled Triangle?</h2>
     <p>A right-angled triangle is a triangle that has one angle equal to 90 degrees (a right angle).</p>
     <div class="example-box">
     <h3>Key Features:</h3>
     <ul>
     <li><strong>Right angle:</strong> The 90° angle</li>
     <li><strong>Hypotenuse:</strong> The longest side, opposite the right angle</li>
     <li><strong>Other two sides:</strong> Called legs or adjacent/opposite sides</li>
     </ul>
     </div>
     <div class="interactive-element">
     <p>🔍 <strong>Memory Tip:</strong> The hypotenuse is always the longest side in a right triangle!</p>
     </div>', 
     5, ARRAY['Identify right-angled triangles', 'Name parts of a right triangle'], 
     ARRAY['right angle', 'hypotenuse', 'triangle properties'], ARRAY['easy'], true),
     
    (2, 'Understanding the Hypotenuse', 'Master the concept of the hypotenuse and its relationship to other sides.', 'mixed',
     '<h2>The Hypotenuse: The Star of Right Triangles</h2>
     <p>The hypotenuse is the side opposite the right angle and is always the longest side.</p>
     <div class="formula-box">
     <h3>How to Identify the Hypotenuse:</h3>
     <ol>
     <li>Find the right angle (90°)</li>
     <li>The side opposite this angle is the hypotenuse</li>
     <li>It will be the longest of the three sides</li>
     </ol>
     </div>
     <div class="practice-section">
     <h3>Quick Practice:</h3>
     <p>In a right triangle with sides 3, 4, and 5 units, which is the hypotenuse?</p>
     <p><strong>Answer:</strong> 5 units (the longest side)</p>
     </div>', 
     5, ARRAY['Identify the hypotenuse in any right triangle'], 
     ARRAY['hypotenuse', 'longest side', 'right angle'], ARRAY['easy'], false),
     
    (3, 'Pythagoras'' Theorem Formula', 'Learn the famous formula and understand what each part means.', 'mixed',
     '<h2>The Famous Formula: c² = a² + b²</h2>
     <div class="formula-highlight">
     <h3>Pythagoras'' Theorem:</h3>
     <p><strong>c² = a² + b²</strong></p>
     <p>Where:</p>
     <ul>
     <li><strong>c</strong> = length of the hypotenuse</li>
     <li><strong>a</strong> = length of one leg</li>
     <li><strong>b</strong> = length of the other leg</li>
     </ul>
     </div>
     <div class="explanation-box">
     <h3>In Simple Words:</h3>
     <p>"The square of the hypotenuse equals the sum of squares of the other two sides."</p>
     </div>
     <div class="example">
     <h3>Example:</h3>
     <p>If a = 3 and b = 4, then:</p>
     <p>c² = 3² + 4² = 9 + 16 = 25</p>
     <p>So c = √25 = 5</p>
     </div>', 
     5, ARRAY['State Pythagoras theorem', 'Understand the formula components'], 
     ARRAY['formula', 'squares', 'hypotenuse calculation'], ARRAY['easy'], false),
     
    (4, 'Calculating Missing Sides', 'Practice using the theorem to find unknown side lengths.', 'mixed',
     '<h2>Finding Missing Sides Step by Step</h2>
     <div class="step-guide">
     <h3>Method 1: Finding the Hypotenuse</h3>
     <ol>
     <li>Square both known sides</li>
     <li>Add the squares together</li>
     <li>Take the square root of the sum</li>
     </ol>
     </div>
     <div class="example-detailed">
     <h3>Example: Find the hypotenuse</h3>
     <p>Given: sides a = 6 and b = 8</p>
     <p>Step 1: 6² = 36, 8² = 64</p>
     <p>Step 2: 36 + 64 = 100</p>
     <p>Step 3: √100 = 10</p>
     <p><strong>Answer: c = 10</strong></p>
     </div>
     <div class="step-guide">
     <h3>Method 2: Finding a Leg</h3>
     <p>If you know the hypotenuse and one leg:</p>
     <p>a² = c² - b²</p>
     </div>', 
     5, ARRAY['Calculate hypotenuse length', 'Find missing leg lengths'], 
     ARRAY['calculation steps', 'square roots', 'missing sides'], ARRAY['moderate'], false),
     
    (5, 'Real-World Applications', 'Apply Pythagoras theorem to solve practical problems.', 'mixed',
     '<h2>Pythagoras in Real Life</h2>
     <div class="real-world-examples">
     <h3>Common Applications:</h3>
     <ul>
     <li><strong>Ladders against walls</strong></li>
     <li><strong>TV screen sizes</strong> (diagonal measurement)</li>
     <li><strong>Construction and carpentry</strong></li>
     <li><strong>Navigation and GPS</strong></li>
     </ul>
     </div>
     <div class="word-problem">
     <h3>Word Problem Practice:</h3>
     <p><strong>Problem:</strong> A ladder is 10 meters long and its base is 6 meters from a wall. How high up the wall does it reach?</p>
     <div class="solution-steps">
     <p><strong>Solution:</strong></p>
     <p>Given: Hypotenuse (ladder) = 10m, Base = 6m</p>
     <p>Find: Height (h)</p>
     <p>Using: h² = 10² - 6² = 100 - 36 = 64</p>
     <p>Therefore: h = √64 = 8 meters</p>
     </div>
     </div>', 
     5, ARRAY['Apply theorem to real situations', 'Solve word problems'], 
     ARRAY['word problems', 'practical applications', 'problem solving'], ARRAY['moderate'], false),
     
    (6, 'Challenge Problems and Review', 'Test your mastery with challenging problems and comprehensive review.', 'mixed',
     '<h2>Challenge Yourself!</h2>
     <div class="challenge-section">
     <h3>Advanced Problem:</h3>
     <p>A square has a diagonal of 14 cm. What is the length of one side?</p>
     <div class="hint-box">
     <p><strong>Hint:</strong> In a square, the diagonal divides it into two right triangles.</p>
     </div>
     <div class="solution-reveal">
     <p><strong>Solution:</strong></p>
     <p>Let side length = s</p>
     <p>Diagonal² = s² + s² = 2s²</p>
     <p>14² = 2s²</p>
     <p>196 = 2s²</p>
     <p>s² = 98</p>
     <p>s = √98 ≈ 9.9 cm</p>
     </div>
     </div>
     <div class="review-summary">
     <h3>Quick Review:</h3>
     <ul>
     <li>✓ Right triangles have one 90° angle</li>
     <li>✓ Hypotenuse is the longest side</li>
     <li>✓ Formula: c² = a² + b²</li>
     <li>✓ Used in many real-world situations</li>
     </ul>
     </div>', 
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

-- Create quizzes for each course using the enhanced_quizzes table
WITH course_ids AS (
    SELECT 
        c1.id as pythagoras_id,
        c2.id as statistics_id,
        c3.id as equations_id,
        c4.id as thales_id,
        c5.id as indices_id
    FROM 
        (SELECT id FROM courses WHERE title = 'Pythagoras'' Theorem Mastery') c1,
        (SELECT id FROM courses WHERE title = 'Statistics: Mean, Median & Mode') c2,
        (SELECT id FROM courses WHERE title = 'Solving Simultaneous Linear Equations') c3,
        (SELECT id FROM courses WHERE title = 'Thales'' Theorem and Similar Triangles') c4,
        (SELECT id FROM courses WHERE title = 'Indices and Surds Simplified') c5
)
INSERT INTO enhanced_quizzes (course_id, title, description, quiz_type, max_attempts, passing_score)
SELECT 
    course_id,
    title,
    description,
    quiz_type::VARCHAR(20),
    max_attempts,
    passing_score
FROM course_ids,
(VALUES
    (course_ids.pythagoras_id, 'Pythagoras Theorem Assessment', 'Test your understanding of right triangles and the Pythagoras theorem', 'assessment', 3, 70.00),
    (course_ids.statistics_id, 'Statistics Mastery Quiz', 'Evaluate your knowledge of mean, median, and mode calculations', 'assessment', 3, 70.00),
    (course_ids.equations_id, 'Simultaneous Equations Test', 'Challenge your ability to solve systems of linear equations', 'assessment', 3, 70.00),
    (course_ids.thales_id, 'Thales Theorem Quiz', 'Assess your understanding of similar triangles and proportionality', 'assessment', 3, 70.00),
    (course_ids.indices_id, 'Indices and Surds Assessment', 'Test your mastery of exponents and surds', 'assessment', 3, 70.00)
) AS quiz_data(course_id, title, description, quiz_type, max_attempts, passing_score);

-- Insert quiz questions for Pythagoras Theorem (based on TODO.md)
WITH pythagoras_quiz AS (
    SELECT q.id as quiz_id 
    FROM enhanced_quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Pythagoras'' Theorem Mastery'
)
INSERT INTO enhanced_quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    pq.quiz_id,
    question_data.question_text,
    question_data.question_type::VARCHAR(20),
    question_data.options::JSONB,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficulty_level::VARCHAR(20),
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
    END::VARCHAR(20)
FROM enhanced_lessons l
WHERE l.course_id IN (
    SELECT id FROM courses WHERE subject = 'Mathematics' AND grade_level = 'Senior 2'
);

-- Update course lesson counts using enhanced_lessons
UPDATE courses SET total_lessons = (
    SELECT COUNT(*) FROM enhanced_lessons WHERE course_id = courses.id AND is_published = true
) WHERE subject = 'Mathematics' AND grade_level = 'Senior 2';