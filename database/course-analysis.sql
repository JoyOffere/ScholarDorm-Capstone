-- Course Analysis and Verification Script
-- Analyzing the course data provided to ensure quiz insertion works correctly

-- From the provided INSERT statement, here are the 5 math courses:

-- 1. '11ddae59-531f-4baf-b72c-5bae91a41d69' - 'Pythagoras Theorem Mastery'
-- 2. '2fd8e980-dc73-49f0-ba85-2ccfbf304973' - 'Solving Simultaneous Linear Equations'  
-- 3. '9c2ee879-cbfe-4e96-b0cf-0465d62cbf88' - 'Thales Theorem and Similar Triangles'
-- 4. 'd191e1ea-61ad-47f8-9010-fd0be0cceeff' - 'Statistics: Mean, Median & Mode'
-- 5. 'fa48f5f2-716e-4281-8fbe-5d654818f13b' - 'Indices and Surds Simplified'

-- Let's verify these course titles match our quiz question script exactly:

SELECT 'Course Title Verification' as check_type;

-- Check if all 4 target courses exist (excluding Pythagoras which already has questions)
SELECT 
    title,
    id,
    CASE 
        WHEN title = 'Statistics: Mean, Median & Mode' THEN '✓ Match'
        WHEN title = 'Solving Simultaneous Linear Equations' THEN '✓ Match'
        WHEN title = 'Thales Theorem and Similar Triangles' THEN '✓ Match'
        WHEN title = 'Indices and Surds Simplified' THEN '✓ Match'
        ELSE '❌ No match needed'
    END as quiz_script_status
FROM courses 
WHERE id IN (
    '11ddae59-531f-4baf-b72c-5bae91a41d69',
    '2fd8e980-dc73-49f0-ba85-2ccfbf304973',
    '9c2ee879-cbfe-4e96-b0cf-0465d62cbf88',
    'd191e1ea-61ad-47f8-9010-fd0be0cceeff',
    'fa48f5f2-716e-4281-8fbe-5d654818f13b'
)
ORDER BY title;

-- Check if enhanced_quizzes exist for these courses
SELECT 'Enhanced Quiz Verification' as check_type;

SELECT 
    c.title as course_title,
    c.id as course_id,
    COUNT(q.id) as quiz_count,
    CASE 
        WHEN COUNT(q.id) > 0 THEN '✓ Quiz exists'
        ELSE '❌ Quiz missing'
    END as quiz_status
FROM courses c
LEFT JOIN enhanced_quizzes q ON c.id = q.course_id
WHERE c.id IN (
    '11ddae59-531f-4baf-b72c-5bae91a41d69',
    '2fd8e980-dc73-49f0-ba85-2ccfbf304973', 
    '9c2ee879-cbfe-4e96-b0cf-0465d62cbf88',
    'd191e1ea-61ad-47f8-9010-fd0be0cceeff',
    'fa48f5f2-716e-4281-8fbe-5d654818f13b'
)
GROUP BY c.title, c.id
ORDER BY c.title;

-- Check existing quiz questions count
SELECT 'Quiz Questions Count' as check_type;

SELECT 
    c.title as course_title,
    COUNT(qq.id) as question_count,
    CASE 
        WHEN COUNT(qq.id) >= 6 THEN '✓ Has detailed questions'
        WHEN COUNT(qq.id) > 0 THEN '⚠️ Has basic questions only'
        ELSE '❌ No questions'
    END as question_status
FROM courses c
LEFT JOIN enhanced_quizzes q ON c.id = q.course_id
LEFT JOIN enhanced_quiz_questions qq ON q.id = qq.quiz_id
WHERE c.id IN (
    '11ddae59-531f-4baf-b72c-5bae91a41d69',
    '2fd8e980-dc73-49f0-ba85-2ccfbf304973',
    '9c2ee879-cbfe-4e96-b0cf-0465d62cbf88', 
    'd191e1ea-61ad-47f8-9010-fd0be0cceeff',
    'fa48f5f2-716e-4281-8fbe-5d654818f13b'
)
GROUP BY c.title, c.id
ORDER BY c.title;