-- Seed data for Rwanda S2 Mathematics courses
-- Based on the detailed curriculum in TODO.md

-- Insert the 5 main mathematics courses
INSERT INTO courses (
    id, title, description, subject, grade_level, difficulty_level, 
    total_lessons, estimated_duration_hours, is_active, is_featured,
    prerequisites, learning_objectives, has_rsl_support, created_at
) VALUES 
-- Course 1: Pythagoras' Theorem
(
    gen_random_uuid(),
    'Pythagoras'' Theorem Mastery',
    'Master the fundamentals of Pythagoras'' theorem through interactive lessons and practical applications. Learn to find missing sides in right-angled triangles and apply this knowledge to real-world problems.',
    'Mathematics',
    'Senior 2',
    'beginner',
    6,
    2.5,
    true,
    true,
    ARRAY['Basic geometry', 'Understanding of squares and square roots'],
    ARRAY[
        'Understand and apply Pythagoras'' theorem',
        'Identify right-angled triangles and the hypotenuse',
        'Calculate missing sides in right triangles',
        'Solve real-world problems using Pythagoras'' theorem',
        'Recognize when to use the theorem in practical situations'
    ],
    true,
    NOW()
),
-- Course 2: Statistics Fundamentals
(
    gen_random_uuid(),
    'Statistics: Mean, Median & Mode',
    'Discover the world of statistics through central tendency measures. Learn to analyze data, calculate averages, and interpret statistical information in everyday contexts.',
    'Mathematics',
    'Senior 2',
    'beginner',
    6,
    2.0,
    true,
    true,
    ARRAY['Basic arithmetic', 'Number ordering'],
    ARRAY[
        'Calculate mean, median, and mode of datasets',
        'Understand when to use each measure of central tendency',
        'Organize and interpret data effectively',
        'Apply statistical concepts to real-world scenarios',
        'Compare and contrast different measures of central tendency'
    ],
    true,
    NOW()
),
-- Course 3: Simultaneous Linear Equations
(
    gen_random_uuid(),
    'Solving Simultaneous Linear Equations',
    'Learn multiple methods to solve systems of linear equations. Master substitution and elimination techniques to find solutions that satisfy multiple conditions simultaneously.',
    'Mathematics',
    'Senior 2',
    'intermediate',
    7,
    3.0,
    true,
    true,
    ARRAY['Linear equations', 'Basic algebra', 'Graphing basics'],
    ARRAY[
        'Solve simultaneous equations using substitution method',
        'Apply elimination method to solve systems',
        'Interpret solutions in context of real problems',
        'Identify when systems have no solution or infinite solutions',
        'Model real-world problems using simultaneous equations'
    ],
    true,
    NOW()
),
-- Course 4: Thales' Theorem
(
    gen_random_uuid(),
    'Thales'' Theorem and Similar Triangles',
    'Explore the relationships between parallel lines and proportional sides. Understand similarity in triangles and apply Thales'' theorem to solve geometric problems.',
    'Mathematics',
    'Senior 2',
    'intermediate',
    5,
    2.5,
    true,
    false,
    ARRAY['Basic geometry', 'Understanding of triangles', 'Proportions'],
    ARRAY[
        'State and apply Thales'' theorem',
        'Identify similar triangles using Thales'' theorem',
        'Calculate proportional sides in similar triangles',
        'Understand the relationship between parallel lines and proportionality',
        'Solve geometric problems using similarity principles'
    ],
    true,
    NOW()
),
-- Course 5: Indices and Surds
(
    gen_random_uuid(),
    'Indices and Surds Simplified',
    'Master the laws of exponents and work with surds (irrational numbers involving square roots). Learn to simplify complex expressions and solve problems involving powers and roots.',
    'Mathematics',
    'Senior 2',
    'intermediate',
    6,
    2.5,
    true,
    true,
    ARRAY['Basic algebra', 'Understanding of square roots', 'Number properties'],
    ARRAY[
        'Apply the laws of indices to simplify expressions',
        'Work with surds and rationalize denominators',
        'Distinguish between rational and irrational numbers',
        'Simplify expressions involving powers and roots',
        'Solve practical problems using indices and surds'
    ],
    true,
    NOW()
);

-- Get the course IDs for lesson insertion
-- We'll use variables to store course IDs (in a real implementation, you'd get these from the insert results)

-- Insert lessons for Course 1: Pythagoras' Theorem
WITH course_pythagoras AS (
    SELECT id as course_id FROM courses WHERE title = 'Pythagoras'' Theorem Mastery'
)
INSERT INTO lessons (
    course_id, title, description, content_type, content_html, 
    duration_minutes, order_index, learning_objectives, key_concepts, difficulty_tags, is_preview
)
SELECT 
    cp.course_id,
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
FROM course_pythagoras cp,
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
) AS lesson_data(order_index, title, description, content_type, content_html, duration_minutes, learning_objectives, key_concepts, difficulty_tags, is_preview);

-- Insert lessons for Course 2: Statistics
WITH course_statistics AS (
    SELECT id as course_id FROM courses WHERE title = 'Statistics: Mean, Median & Mode'
)
INSERT INTO lessons (
    course_id, title, description, content_type, content_html, 
    duration_minutes, order_index, learning_objectives, key_concepts, difficulty_tags, is_preview
)
SELECT 
    cs.course_id,
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
FROM course_statistics cs,
(VALUES
    (1, 'Introduction to Statistics', 'Discover what statistics is and why we use mean, median, and mode.', 'mixed',
     '<h2>Welcome to the World of Statistics!</h2>
     <p>Statistics helps us understand and describe data by finding patterns and making sense of numbers.</p>
     <div class="concept-intro">
     <h3>The Big Three: Measures of Central Tendency</h3>
     <ul>
     <li><strong>Mean:</strong> The average of all numbers</li>
     <li><strong>Median:</strong> The middle number when arranged in order</li>
     <li><strong>Mode:</strong> The number that appears most often</li>
     </ul>
     </div>
     <div class="real-life-connection">
     <h3>Why Do We Need These?</h3>
     <p>📊 To understand test scores, sports statistics, weather data, and much more!</p>
     </div>', 
     5, ARRAY['Understand what statistics is', 'Identify the three measures of central tendency'], 
     ARRAY['statistics basics', 'central tendency', 'data analysis'], ARRAY['easy'], true),
     
    (2, 'Calculating the Mean (Average)', 'Master the art of finding averages in any dataset.', 'mixed',
     '<h2>The Mean: Your Friend "Average"</h2>
     <div class="formula-simple">
     <h3>Formula:</h3>
     <p><strong>Mean = Sum of all values ÷ Number of values</strong></p>
     </div>
     <div class="step-example">
     <h3>Example: Find the mean of 3, 5, 7</h3>
     <p>Step 1: Add all numbers: 3 + 5 + 7 = 15</p>
     <p>Step 2: Count how many numbers: 3 numbers</p>
     <p>Step 3: Divide: 15 ÷ 3 = 5</p>
     <p><strong>Mean = 5</strong></p>
     </div>
     <div class="practice-quick">
     <h3>Quick Practice:</h3>
     <p>Find the mean of: 10, 12, 8, 10</p>
     <p><em>Answer: (10+12+8+10) ÷ 4 = 40 ÷ 4 = 10</em></p>
     </div>', 
     5, ARRAY['Calculate mean of any dataset', 'Apply mean formula correctly'], 
     ARRAY['mean calculation', 'average', 'addition and division'], ARRAY['easy'], false),
     
    (3, 'Finding the Median', 'Learn to find the middle value in ordered datasets.', 'mixed',
     '<h2>The Median: The Middle Champion</h2>
     <div class="method-box">
     <h3>How to Find the Median:</h3>
     <ol>
     <li>Arrange numbers from smallest to largest</li>
     <li>Find the middle number</li>
     <li>If there are two middle numbers, find their average</li>
     </ol>
     </div>
     <div class="example-odd">
     <h3>Example 1: Odd number of values</h3>
     <p>Data: 2, 4, 6, 8, 10</p>
     <p>Already in order ✓</p>
     <p>Middle position: 3rd number</p>
     <p><strong>Median = 6</strong></p>
     </div>
     <div class="example-even">
     <h3>Example 2: Even number of values</h3>
     <p>Data: 2, 4, 6, 8</p>
     <p>Middle positions: 2nd and 3rd numbers (4 and 6)</p>
     <p>Average: (4 + 6) ÷ 2 = 5</p>
     <p><strong>Median = 5</strong></p>
     </div>', 
     5, ARRAY['Order data correctly', 'Find median for odd and even datasets'], 
     ARRAY['median calculation', 'ordering data', 'middle value'], ARRAY['easy'], false),
     
    (4, 'Discovering the Mode', 'Identify the most frequently occurring values in datasets.', 'mixed',
     '<h2>The Mode: The Popular Choice</h2>
     <div class="definition-clear">
     <h3>What is the Mode?</h3>
     <p>The mode is the value that appears most frequently in a dataset.</p>
     </div>
     <div class="examples-variety">
     <h3>Example 1: Clear Mode</h3>
     <p>Data: 2, 5, 5, 6, 7</p>
     <p>5 appears twice, others appear once</p>
     <p><strong>Mode = 5</strong></p>
     </div>
     <div class="special-cases">
     <h3>Special Cases:</h3>
     <ul>
     <li><strong>No Mode:</strong> All values appear equally (1, 2, 3, 4)</li>
     <li><strong>Multiple Modes:</strong> Two or more values tie for most frequent</li>
     </ul>
     </div>
     <div class="real-world-mode">
     <h3>Mode in Real Life:</h3>
     <p>👟 Most popular shoe size in a store</p>
     <p>🎵 Most played song on a playlist</p>
     </div>', 
     5, ARRAY['Identify mode in datasets', 'Recognize when there is no mode or multiple modes'], 
     ARRAY['mode identification', 'frequency', 'most common value'], ARRAY['easy'], false),
     
    (5, 'Comparing Mean, Median, and Mode', 'Learn when to use each measure and understand their differences.', 'mixed',
     '<h2>When to Use Which Measure?</h2>
     <div class="comparison-table">
     <h3>Quick Comparison:</h3>
     <table class="comparison">
     <tr><th>Measure</th><th>Best Used When</th><th>Example</th></tr>
     <tr><td><strong>Mean</strong></td><td>Data is evenly distributed</td><td>Test scores: 85, 87, 89, 91</td></tr>
     <tr><td><strong>Median</strong></td><td>Data has outliers</td><td>Incomes: $30k, $32k, $35k, $200k</td></tr>
     <tr><td><strong>Mode</strong></td><td>Looking for most common</td><td>Favorite colors in a survey</td></tr>
     </table>
     </div>
     <div class="practice-scenario">
     <h3>Practice Scenario:</h3>
     <p>Student test scores: 6, 8, 10, 6</p>
     <p>Mean = (6+8+10+6) ÷ 4 = 7.5</p>
     <p>Median = (6+8) ÷ 2 = 7 (middle of 6,6,8,10)</p>
     <p>Mode = 6 (appears twice)</p>
     </div>', 
     5, ARRAY['Choose appropriate measure for different situations', 'Compare all three measures'], 
     ARRAY['comparison', 'appropriate use', 'data interpretation'], ARRAY['moderate'], false),
     
    (6, 'Statistics in Action', 'Apply your knowledge to real-world data analysis problems.', 'mixed',
     '<h2>Real Data, Real Analysis</h2>
     <div class="real-problem">
     <h3>Case Study: Class Survey Results</h3>
     <p>Shoe sizes in a class: 37, 38, 38, 39, 40, 40, 40, 41</p>
     <div class="analysis-steps">
     <h4>Let\'s analyze this data:</h4>
     <p><strong>Mean:</strong> (37+38+38+39+40+40+40+41) ÷ 8 = 313 ÷ 8 = 39.125</p>
     <p><strong>Median:</strong> Middle of ordered data = (39+40) ÷ 2 = 39.5</p>
     <p><strong>Mode:</strong> 40 (appears 3 times)</p>
     </div>
     </div>
     <div class="interpretation">
     <h3>What This Tells Us:</h3>
     <ul>
     <li>Most common shoe size is 40</li>
     <li>Average shoe size is about 39</li>
     <li>Half the students wear size 39.5 or smaller</li>
     </ul>
     </div>
     <div class="challenge-question">
     <h3>Your Turn:</h3>
     <p>If you were ordering shoes for this class, which measure would be most useful? Why?</p>
     </div>', 
     5, ARRAY['Analyze real-world data', 'Interpret statistical results', 'Apply knowledge practically'], 
     ARRAY['data interpretation', 'real-world application', 'statistical reasoning'], ARRAY['moderate'], false)
) AS lesson_data(order_index, title, description, content_type, content_html, duration_minutes, learning_objectives, key_concepts, difficulty_tags, is_preview);

-- Continue with lessons for other courses...
-- [Additional lesson inserts for the remaining 3 courses would follow the same pattern]

-- Now let's create the quiz questions based on the TODO.md content

-- First, create quizzes for each course
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
INSERT INTO quizzes (course_id, title, description, quiz_type, max_attempts, passing_score)
SELECT 
    course_id,
    title,
    description,
    quiz_type,
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
    FROM quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Pythagoras'' Theorem Mastery'
)
INSERT INTO quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    pq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options,
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

-- Insert quiz questions for Statistics (based on TODO.md)
WITH statistics_quiz AS (
    SELECT q.id as quiz_id 
    FROM quizzes q 
    JOIN courses c ON q.course_id = c.id 
    WHERE c.title = 'Statistics: Mean, Median & Mode'
)
INSERT INTO quiz_questions (
    quiz_id, question_text, question_type, options, correct_answer, 
    explanation, difficulty_level, points, order_index, topic_tag
)
SELECT 
    sq.quiz_id,
    question_data.question_text,
    question_data.question_type,
    question_data.options,
    question_data.correct_answer,
    question_data.explanation,
    question_data.difficulty_level,
    question_data.points,
    question_data.order_index,
    question_data.topic_tag
FROM statistics_quiz sq,
(VALUES
    ('What is the mean of these numbers: 3, 5, 7?', 'mcq',
     '{"A": "4", "B": "5", "C": "6", "D": "15"}',
     'B', 'Mean = (3 + 5 + 7) ÷ 3 = 15 ÷ 3 = 5', 
     'easy', 1.00, 1, 'statistics_mean'),
     
    ('The median of 2, 4, 6, 8, 10 is:', 'mcq',
     '{"A": "4", "B": "6", "C": "8", "D": "30"}',
     'B', 'The median is the middle value. In ordered data 2,4,6,8,10, the middle (3rd) value is 6.', 
     'easy', 1.00, 2, 'statistics_median'),
     
    ('What is the mode of 2, 5, 5, 6, 7?', 'mcq',
     '{"A": "2", "B": "5", "C": "6", "D": "7"}',
     'B', 'The mode is the most frequently occurring value. 5 appears twice, others appear once.', 
     'easy', 1.00, 3, 'statistics_mode'),
     
    ('Find the mean of the data: 10, 12, 8, 10.', 'short_answer',
     NULL, '10',
     'Mean = (10 + 12 + 8 + 10) ÷ 4 = 40 ÷ 4 = 10', 
     'easy', 1.00, 4, 'statistics_mean'),
     
    ('Arrange this data in order: 8, 12, 10, 14, 6 and find the median.', 'short_answer',
     NULL, '10',
     'Ordered data: 6, 8, 10, 12, 14. The median is the middle value: 10', 
     'moderate', 2.00, 5, 'statistics_median'),
     
    ('A student scored 6, 8, 10, and 6 in four tests. What is their average score?', 'word_problem',
     NULL, '7.5',
     'Average = (6 + 8 + 10 + 6) ÷ 4 = 30 ÷ 4 = 7.5', 
     'moderate', 2.00, 6, 'statistics_application'),
     
    ('In a class survey, these shoe sizes were recorded: 37, 38, 38, 39, 40, 40, 40, 41. What is the mode?', 'word_problem',
     NULL, '40',
     'Mode is the most frequent value. 40 appears 3 times, which is more than any other value.', 
     'moderate', 2.00, 7, 'statistics_mode_application')
) AS question_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, points, order_index, topic_tag);

-- Add sample RSL content
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
FROM lessons l
WHERE l.course_id IN (
    SELECT id FROM courses WHERE subject = 'Mathematics' AND grade_level = 'Senior 2'
);

-- Create some sample enrollments and progress (for demo purposes)
-- You would typically not include this in production seed data
/*
INSERT INTO course_enrollments (user_id, course_id, progress_percentage)
SELECT 
    u.id,
    c.id,
    CASE 
        WHEN random() > 0.7 THEN 100
        WHEN random() > 0.4 THEN round((random() * 80 + 10)::numeric, 2)
        ELSE 0
    END
FROM users u
CROSS JOIN courses c
WHERE u.role = 'student' 
AND c.subject = 'Mathematics'
AND random() > 0.3; -- Only enroll 70% of students randomly
*/

-- Update course lesson counts
UPDATE courses SET total_lessons = (
    SELECT COUNT(*) FROM lessons WHERE course_id = courses.id AND is_active = true
) WHERE subject = 'Mathematics' AND grade_level = 'Senior 2';