-- Create the missing get_rsl_stats RPC function
-- This function returns statistics about RSL videos and signs for the admin dashboard

CREATE OR REPLACE FUNCTION get_rsl_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    total_videos_count INTEGER;
    total_signs_count INTEGER;
    active_users_count INTEGER;
    weekly_engagement_percent INTEGER;
    top_categories_data JSON;
BEGIN
    -- Count total active RSL videos
    SELECT COUNT(*) INTO total_videos_count
    FROM rsl_videos 
    WHERE is_active = true;
    
    -- Count total active RSL signs
    SELECT COUNT(*) INTO total_signs_count
    FROM rsl_signs 
    WHERE is_active = true;
    
    -- Get active users count (users who have logged in within last 30 days)
    SELECT COUNT(DISTINCT id) INTO active_users_count
    FROM users 
    WHERE last_login >= NOW() - INTERVAL '30 days';
    
    -- Calculate weekly engagement (percentage of active users who engaged this week)
    WITH weekly_active AS (
        SELECT COUNT(DISTINCT id) as count
        FROM users 
        WHERE last_login >= NOW() - INTERVAL '7 days'
    ),
    total_active AS (
        SELECT COUNT(DISTINCT id) as count
        FROM users 
        WHERE last_login >= NOW() - INTERVAL '30 days'
    )
    SELECT CASE 
        WHEN total_active.count > 0 
        THEN ROUND((weekly_active.count::FLOAT / total_active.count::FLOAT) * 100)::INTEGER
        ELSE 0 
    END INTO weekly_engagement_percent
    FROM weekly_active, total_active;
    
    -- Get top categories by video count
    SELECT json_agg(
        json_build_object(
            'category', category,
            'views', video_count
        ) ORDER BY video_count DESC
    ) INTO top_categories_data
    FROM (
        SELECT 
            category,
            COUNT(*) as video_count
        FROM rsl_videos 
        WHERE is_active = true
        GROUP BY category
        ORDER BY video_count DESC
        LIMIT 5
    ) category_stats;
    
    -- Build the result JSON
    result := json_build_object(
        'total_videos', total_videos_count,
        'total_signs', total_signs_count,
        'active_users', active_users_count,
        'weekly_engagement', weekly_engagement_percent,
        'top_categories', COALESCE(top_categories_data, '[]'::json)
    );
    
    RETURN result;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION get_rsl_stats() TO authenticated;