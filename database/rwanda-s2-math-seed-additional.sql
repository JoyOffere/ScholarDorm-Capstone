-- Additional quiz questions for the remaining 3 courses
-- This file continues the rwanda-s2-math-seed.sql

-- Insert quiz questions for Simultaneous Linear Equations
WITH equations_quiz AS (
    SELECT q.id as quiz_id 
    FROM quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Solving Simultaneous Linear Equations'
)
INSERT INTO quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    eq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficult_level,
    question_data.points,
    question_data.order_index,
    question_data.topic_tag
FROM equations_quiz eq,
(VALUES
    ('What is a simultaneous equation?', 'mcq',
     '{"A": "Two equations with one variable", "B": "Two equations with two variables", "C": "One equation with two variables"}',
     'B', 'Simultaneous equations are two or more equations that share the same variables and must be solved together.', 
     'easy', 1.00, 1, 'equations_basics'),
     
    ('Solve: x + y = 5 and x - y = 1. What is x?', 'mcq',
     '{"A": "2", "B": "3", "C": "4", "D": "5"}',
     'B', 'Adding the equations: (x+y) + (x-y) = 5+1, so 2x = 6, therefore x = 3', 
     'moderate', 2.00, 2, 'equations_elimination'),
     
    ('In the system x + y = 7 and x - y = 3, what is y?', 'mcq',
     '{"A": "1", "B": "2", "C": "3", "D": "4"}',
     'B', 'From elimination method: x = 5, substituting into x + y = 7 gives 5 + y = 7, so y = 2', 
     'moderate', 2.00, 3, 'equations_substitution'),
     
    ('Solve the system: 2x + y = 8, x - y = 1. Find x and y.', 'short_answer',
     NULL, 'x = 3, y = 2',
     'Adding equations: 3x = 9, so x = 3. Substituting: 3 - y = 1, so y = 2', 
     'moderate', 2.00, 4, 'equations_solution'),
     
    ('A pen costs x rwf and a book costs y rwf. If 2 pens and 1 book cost 500 rwf, and 1 pen and 2 books cost 400 rwf, find the cost of one pen.', 'word_problem',
     NULL, '200 rwf',
     'Equations: 2x + y = 500, x + 2y = 400. Solving gives x = 200, y = 100', 
     'challenge', 3.00, 5, 'equations_word_problem'),
     
    ('The sum of two numbers is 20 and their difference is 4. Find the smaller number.', 'word_problem',
     NULL, '8',
     'Let x and y be the numbers. x + y = 20, x - y = 4. Solving: x = 12, y = 8. Smaller number is 8', 
     'challenge', 3.00, 6, 'equations_application'),
     
    ('Solve: 3x + 2y = 12, 6x - y = 3. What is the value of x + y?', 'short_answer',
     NULL, '3',
     'Solving the system gives x = 1, y = 2. Therefore x + y = 1 + 2 = 3', 
     'challenge', 3.00, 7, 'equations_advanced')
) AS question_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index, topic_tag);

-- Insert quiz questions for Thales' Theorem
WITH thales_quiz AS (
    SELECT q.id as quiz_id 
    FROM quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Thales'' Theorem and Similar Triangles'
)
INSERT INTO quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    tq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficulty_level,
    question_data.points,
    question_data.order_index,
    question_data.topic_tag
FROM thales_quiz tq,
(VALUES
    ('Thales\' theorem is about which geometric concept?', 'mcq',
     '{"A": "Parallel lines", "B": "Right angles", "C": "Similar triangles", "D": "All of the above"}',
     'D', 'Thales\' theorem involves parallel lines creating similar triangles and proportional segments.', 
     'easy', 1.00, 1, 'thales_basics'),
     
    ('If two triangles are similar, their corresponding sides are:', 'mcq',
     '{"A": "Equal", "B": "Proportional", "C": "Different", "D": "Parallel"}',
     'B', 'Similar triangles have corresponding sides that are proportional (in the same ratio).', 
     'easy', 1.00, 2, 'thales_similarity'),
     
    ('In triangle ABC, if DE is parallel to BC, then AB/AD equals:', 'mcq',
     '{"A": "AC/AE", "B": "BC/DE", "C": "AD/AB", "D": "Both A and B"}',
     'D', 'By Thales\' theorem, AB/AD = AC/AE = BC/DE when DE || BC', 
     'moderate', 2.00, 3, 'thales_proportions'),
     
    ('What does it mean for two triangles to be similar?', 'short_answer',
     NULL, 'Same shape, proportional sides',
     'Similar triangles have the same shape but different sizes, with corresponding sides in proportion.', 
     'easy', 1.00, 4, 'thales_similarity_definition'),
     
    ('In a triangle, a line parallel to one side divides the other two sides in what way?', 'short_answer',
     NULL, 'Proportionally',
     'A line parallel to one side of a triangle divides the other two sides proportionally (Thales\' theorem).', 
     'moderate', 2.00, 5, 'thales_division'),
     
    ('Triangle ABC has DE parallel to BC. If AD = 4, DB = 2, and AE = 6, find EC.', 'word_problem',
     NULL, '3',
     'By Thales\' theorem: AD/DB = AE/EC, so 4/2 = 6/EC, therefore EC = 3', 
     'challenge', 3.00, 6, 'thales_calculation'),
     
    ('Two similar triangles have a ratio of similarity 2:3. If the smaller triangle has a side of 8 cm, what is the corresponding side in the larger triangle?', 'word_problem',
     NULL, '12 cm',
     'If the ratio is 2:3, then larger side = (8 × 3) ÷ 2 = 12 cm', 
     'challenge', 3.00, 7, 'thales_ratio_problem')
) AS question_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index, topic_tag);

-- Insert quiz questions for Indices and Surds
WITH indices_quiz AS (
    SELECT q.id as quiz_id 
    FROM quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Indices and Surds Simplified'
)
INSERT INTO quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    iq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficulty_level,
    question_data.points,
    question_data.order_index,
    question_data.topic_tag
FROM indices_quiz iq,
(VALUES
    ('What is 2³?', 'mcq',
     '{"A": "6", "B": "8", "C": "9", "D": "12"}',
     'B', '2³ = 2 × 2 × 2 = 8', 
     'easy', 1.00, 1, 'indices_basics'),
     
    ('What is the simplified form of √8?', 'mcq',
     '{"A": "2√2", "B": "4√2", "C": "2√4", "D": "√8"}',
     'A', '√8 = √(4×2) = √4 × √2 = 2√2', 
     'easy', 1.00, 2, 'surds_simplification'),
     
    ('What is x⁵ ÷ x²?', 'mcq',
     '{"A": "x³", "B": "x⁷", "C": "x¹⁰", "D": "x²"}',
     'A', 'Using the law: xᵃ ÷ xᵇ = xᵃ⁻ᵇ, so x⁵ ÷ x² = x⁵⁻² = x³', 
     'moderate', 2.00, 3, 'indices_division'),
     
    ('Simplify: (x²)³', 'short_answer',
     NULL, 'x⁶',
     'Using the power rule: (xᵃ)ᵇ = xᵃˣᵇ, so (x²)³ = x²ˣ³ = x⁶', 
     'moderate', 2.00, 4, 'indices_power_rule'),
     
    ('What is the simplified form of √18?', 'short_answer',
     NULL, '3√2',
     '√18 = √(9×2) = √9 × √2 = 3√2', 
     'moderate', 2.00, 5, 'surds_advanced'),
     
    ('A bacteria culture doubles every hour. If there are initially 100 bacteria, how many will there be after 4 hours? Express using indices.', 'word_problem',
     NULL, '100 × 2⁴ = 1600',
     'After 4 hours: 100 × 2⁴ = 100 × 16 = 1600 bacteria', 
     'challenge', 3.00, 6, 'indices_application'),
     
    ('Rationalize the denominator: 1/√3', 'short_answer',
     NULL, '√3/3',
     'Multiply by √3/√3: (1/√3) × (√3/√3) = √3/3', 
     'challenge', 3.00, 7, 'surds_rationalization')
) AS question_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index, topic_tag);

-- Add remaining lessons for Simultaneous Equations course
WITH course_equations AS (
    SELECT id as course_id FROM courses WHERE title = 'Solving Simultaneous Linear Equations'
)
INSERT INTO lessons (
    course_id, title, description, content_type, content_html, 
    duration_minutes, order_index, learning_objectives, key_concepts, difficulty_tags, is_preview
)
SELECT 
    ce.course_id,
    lesson_data.title,
    lesson_data.description,
    lesson_data.content_type,
    lesson_data.content_html,
    lesson_data.duration_minutes,
    lesson_data.order_index,
    lesson_data.learning_objectives,
    lesson_data.key_concepts,
    lesson_data.difficulty_tags,
    lesson_data.is_preview
FROM course_equations ce,
(VALUES
    (1, 'Introduction to Simultaneous Equations', 'Understand what simultaneous equations are and why we solve them together.', 'mixed',
     '<h2>What Are Simultaneous Equations?</h2>
     <p>Simultaneous equations are two or more equations that contain the same variables and must be solved together to find values that satisfy all equations.</p>
     <div class="example-basic">
     <h3>Simple Example:</h3>
     <p>x + y = 5</p>
     <p>x - y = 1</p>
     <p>We need to find values of x and y that make both equations true!</p>
     </div>
     <div class="why-simultaneous">
     <h3>Why "Simultaneous"?</h3>
     <p>Because the solution must work for all equations at the same time (simultaneously).</p>
     </div>', 
     5, ARRAY['Define simultaneous equations', 'Understand the concept of shared solutions'], 
     ARRAY['simultaneous equations', 'shared variables', 'system of equations'], ARRAY['easy'], true),
     
    (2, 'The Elimination Method', 'Learn to solve systems by eliminating one variable.', 'mixed',
     '<h2>Elimination: Making Variables Disappear!</h2>
     <p>The elimination method involves adding or subtracting equations to eliminate one variable.</p>
     <div class="method-steps">
     <h3>Steps:</h3>
     <ol>
     <li>Arrange equations with variables aligned</li>
     <li>Add or subtract to eliminate one variable</li>
     <li>Solve for the remaining variable</li>
     <li>Substitute back to find the other variable</li>
     </ol>
     </div>
     <div class="worked-example">
     <h3>Example:</h3>
     <p>x + y = 7 ... (1)</p>
     <p>x - y = 3 ... (2)</p>
     <p>Adding (1) + (2): 2x = 10, so x = 5</p>
     <p>Substituting: 5 + y = 7, so y = 2</p>
     </div>', 
     5, ARRAY['Apply elimination method', 'Solve systems by elimination'], 
     ARRAY['elimination method', 'variable elimination', 'adding equations'], ARRAY['moderate'], false)
) AS lesson_data(order_index, title, description, content_type, content_html, duration_minutes, learning_objectives, key_concepts, difficulty_tags, is_preview);