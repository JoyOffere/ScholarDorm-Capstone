-- Migration: Add indexes on user-related tables and a helper RPC for per-user aggregates
-- Run this in your Postgres/Supabase SQL editor or include in your migration tooling.

-- 1) Add indexes to speed up lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id_completed ON user_courses (user_id, completed);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts (user_id);

-- 2) Example RPC (stable function) to fetch aggregated stats for multiple users in one call
-- Returns: user_id, total_courses, completed_courses, badges_earned, quiz_attempts, average_score
CREATE OR REPLACE FUNCTION public.get_user_aggregates(user_ids uuid[])
RETURNS TABLE(
  user_id uuid,
  total_courses int,
  completed_courses int,
  badges_earned int,
  quiz_attempts int,
  average_score int
) LANGUAGE sql STABLE AS $$
  WITH course_counts AS (
    SELECT user_id, COUNT(*) AS total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) AS completed
    FROM user_courses
    WHERE user_id = ANY(user_ids)
    GROUP BY user_id
  ),
  badge_counts AS (
    SELECT user_id, COUNT(*) AS badges
    FROM user_badges
    WHERE user_id = ANY(user_ids)
    GROUP BY user_id
  ),
  attempt_counts AS (
    SELECT user_id, COUNT(*) AS attempts, COALESCE(ROUND(AVG(percentage))::int,0) AS avg_score
    FROM quiz_attempts
    WHERE user_id = ANY(user_ids)
    GROUP BY user_id
  )
  SELECT u.id AS user_id,
    COALESCE(c.total,0) AS total_courses,
    COALESCE(c.completed,0) AS completed_courses,
    COALESCE(b.badges,0) AS badges_earned,
    COALESCE(a.attempts,0) AS quiz_attempts,
    COALESCE(a.avg_score,0) AS average_score
  FROM (SELECT UNNEST(user_ids) AS id) u
  LEFT JOIN course_counts c ON c.user_id = u.id
  LEFT JOIN badge_counts b ON b.user_id = u.id
  LEFT JOIN attempt_counts a ON a.user_id = u.id;
$$;

-- Grant execute to authenticated users if running in Supabase (optional)
-- GRANT EXECUTE ON FUNCTION public.get_user_aggregates(uuid[]) TO authenticated;

-- Notes:
-- - Run this migration once.
-- - The RPC lets the client call a single endpoint to get aggregates for the visible page of users, reducing client round-trips.
-- - Ensure your Supabase role policy allows calling this function (or expose via an RPC route).
