import { supabase } from './supabase';
// User types
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  streak_count: number;
  longest_streak: number;
  last_login: string;
  role: 'student' | 'admin';
  accessibility_preferences?: {
    high_contrast: boolean;
    large_text: boolean;
    show_rsl: boolean;
  };
}
// Activity types
export type ActivityType = 'login' | 'course_progress' | 'course_completed' | 'badge_earned' | 'streak_maintained';
export interface Activity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  created_at: string;
  metadata: Record<string, any>;
}
// Notification types
export type NotificationType = 'streak_reminder' | 'badge_earned' | 'course_recommendation' | 'system';
export type NotificationUrgency = 'low' | 'medium' | 'high';
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  urgency: NotificationUrgency;
  is_read: boolean;
  created_at: string;
}
// Audit log types
export type AuditAction = 'login' | 'logout' | 'profile_update' | 'course_start' | 'course_progress' | 'course_complete' | 'badge_earned' | 'settings_changed' | 'password_changed' | 'admin_user_create' | 'admin_user_update' | 'admin_user_delete' | 'admin_content_create' | 'admin_content_update' | 'admin_content_delete';
export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
// Course types
export interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  subject: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: Record<string, any>;
  rsl_video_url: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}
export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  created_at: string;
  updated_at: string;
}
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'matching';
  options: string[];
  correct_answer: string | string[];
  points: number;
}
export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  is_published: boolean;
  publish_date: string;
  created_at: string;
  updated_at: string;
  post_type: 'announcement' | 'update' | 'motivational';
  target_audience: 'all' | 'students' | 'admins';
}
// Create a new audit log entry
export const createAuditLog = async (userId: string, action: AuditAction, details: Record<string, any>, ipAddress?: string) => {
  try {
    const {
      data,
      error
    } = await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      details,
      ip_address: ipAddress || 'unknown'
    }).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating audit log:', error);
    return null;
  }
};
// Streak management
export const updateUserStreak = async (userId: string) => {
  try {
    // Get user's current streak info
    const {
      data: userData,
      error: userError
    } = await supabase.from('users').select('streak_count, longest_streak, last_login').eq('id', userId).single();
    if (userError) throw userError;
    if (!userData) return null;
    const now = new Date();
    const lastLogin = userData.last_login ? new Date(userData.last_login) : null;
    let newStreakCount = userData.streak_count;
    let newLongestStreak = userData.longest_streak;
    // Check if this is a new day (maintaining streak)
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const isNewDay = now.toDateString() !== lastLoginDate.toDateString();
      const isConsecutiveDay = isNewDay && (now.getDate() - lastLoginDate.getDate() === 1 || now.getDate() === 1 && lastLoginDate.getDate() === [31, 30, 29, 28][now.getMonth() % 12]);
      if (isNewDay) {
        if (isConsecutiveDay) {
          // Consecutive day login - increment streak
          newStreakCount += 1;
          newLongestStreak = Math.max(newStreakCount, newLongestStreak);
          // Log streak activity
          await supabase.from('activities').insert({
            user_id: userId,
            activity_type: 'streak_maintained',
            metadata: {
              streak_count: newStreakCount
            }
          });
          // Create audit log
          await createAuditLog(userId, 'login', {
            streak_maintained: true,
            streak_count: newStreakCount
          });
          // Check if a badge should be awarded
          if (newStreakCount === 3 || newStreakCount === 7 || newStreakCount === 14 || newStreakCount === 30) {
            await awardStreakBadge(userId, newStreakCount);
          }
        } else {
          // Non-consecutive day - reset streak
          newStreakCount = 1;
          // Create audit log
          await createAuditLog(userId, 'login', {
            streak_reset: true,
            previous_streak: userData.streak_count,
            new_streak: 1
          });
        }
      }
    } else {
      // First login ever - set streak to 1
      newStreakCount = 1;
    }
    // Update user's streak information
    const {
      data,
      error
    } = await supabase.from('users').update({
      streak_count: newStreakCount,
      longest_streak: newLongestStreak,
      last_login: now.toISOString()
    }).eq('id', userId).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user streak:', error);
    return null;
  }
};
// Award streak badges
const awardStreakBadge = async (userId: string, streakCount: number) => {
  try {
    // Find the appropriate badge
    let badgeName = '';
    if (streakCount === 3) badgeName = '3-Day Streak';else if (streakCount === 7) badgeName = '7-Day Streak';else if (streakCount === 14) badgeName = '14-Day Streak';else if (streakCount === 30) badgeName = '30-Day Streak';else return null;
    // Get badge ID
    const {
      data: badge,
      error: badgeError
    } = await supabase.from('badges').select('id').eq('name', badgeName).single();
    if (badgeError || !badge) return null;
    // Award badge to user
    const {
      data,
      error
    } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badge.id
    }).select();
    if (error) throw error;
    // Create notification for badge
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'New Badge Earned!',
      message: `Congratulations! You've earned the ${badgeName} badge by maintaining your learning streak.`,
      type: 'badge_earned',
      urgency: 'medium'
    });
    // Create audit log
    await createAuditLog(userId, 'badge_earned', {
      badge_name: badgeName,
      streak_count: streakCount
    });
    return data;
  } catch (error) {
    console.error('Error awarding streak badge:', error);
    return null;
  }
};
// Notification system
export const generateStreakReminders = async () => {
  try {
    const now = new Date();
    // Find users who haven't logged in for various periods
    const {
      data: users,
      error
    } = await supabase.from('users').select('id, last_login, streak_count');
    if (error) throw error;
    for (const user of users) {
      const lastLogin = new Date(user.last_login);
      const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      // Skip if logged in today or more than 7 days
      if (daysSinceLogin === 0 || daysSinceLogin > 7) continue;
      let message = '';
      let title = '';
      let urgency: NotificationUrgency = 'low';
      // Escalating reminders based on days since login
      if (daysSinceLogin === 1) {
        title = 'Keep Your Streak Going!';
        message = `You've maintained a ${user.streak_count}-day streak. Log in today to keep it going!`;
        urgency = 'low';
      } else if (daysSinceLogin === 2) {
        title = "Don't Break Your Streak!";
        message = `Your ${user.streak_count}-day streak is at risk! Log in now to maintain it.`;
        urgency = 'medium';
      } else if (daysSinceLogin === 3) {
        title = 'Final Chance to Save Your Streak!';
        message = `This is your last chance to save your ${user.streak_count}-day streak! Log in now!`;
        urgency = 'high';
      } else if (daysSinceLogin >= 4 && daysSinceLogin <= 7) {
        title = 'We Miss You!';
        message = `You've lost your streak, but it's not too late to start a new one. Come back and continue learning!`;
        urgency = 'medium';
      }
      // Create notification
      await supabase.from('notifications').insert({
        user_id: user.id,
        title,
        message,
        type: 'streak_reminder',
        urgency
      });
    }
    return true;
  } catch (error) {
    console.error('Error generating streak reminders:', error);
    return false;
  }
};
// Demo account creation or verification
export const ensureDemoAccounts = async () => {
  try {
    // First, check if the demo accounts exist in auth
    const {
      data: studentAuthData,
      error: studentAuthError
    } = await supabase.auth.signInWithPassword({
      email: 'student@scholardorm.com',
      password: 'student123'
    });
    // If student auth doesn't exist, create it
    if (studentAuthError) {
      console.log('Creating demo student account...');
      const {
        data: newStudentAuth,
        error: newStudentError
      } = await supabase.auth.signUp({
        email: 'student@scholardorm.com',
        password: 'student123'
      });
      if (newStudentError) throw newStudentError;
      // Create user profile if auth was created successfully
      if (newStudentAuth?.user) {
        await supabase.from('users').insert({
          id: newStudentAuth.user.id,
          email: 'student@scholardorm.com',
          full_name: 'Demo Student',
          streak_count: 5,
          longest_streak: 7,
          role: 'student',
          avatar_url: 'https://ui-avatars.com/api/?name=Demo+Student&background=0D8ABC&color=fff'
        });
      }
    } else {
      // If student auth exists, check if the user profile exists
      const {
        error: studentProfileError
      } = await supabase.from('users').select('*').eq('email', 'student@scholardorm.com').single();
      // If profile doesn't exist but auth does, create the profile
      if (studentProfileError && studentAuthData?.user) {
        await supabase.from('users').insert({
          id: studentAuthData.user.id,
          email: 'student@scholardorm.com',
          full_name: 'Demo Student',
          streak_count: 5,
          longest_streak: 7,
          role: 'student',
          avatar_url: 'https://ui-avatars.com/api/?name=Demo+Student&background=0D8ABC&color=fff'
        });
      }
    }
    // Now do the same for admin account
    const {
      data: adminAuthData,
      error: adminAuthError
    } = await supabase.auth.signInWithPassword({
      email: 'admin@scholardorm.com',
      password: 'admin123'
    });
    // If admin auth doesn't exist, create it
    if (adminAuthError) {
      console.log('Creating demo admin account...');
      const {
        data: newAdminAuth,
        error: newAdminError
      } = await supabase.auth.signUp({
        email: 'admin@scholardorm.com',
        password: 'admin123'
      });
      if (newAdminError) throw newAdminError;
      // Create user profile if auth was created successfully
      if (newAdminAuth?.user) {
        await supabase.from('users').insert({
          id: newAdminAuth.user.id,
          email: 'admin@scholardorm.com',
          full_name: 'Demo Administrator',
          streak_count: 0,
          longest_streak: 0,
          role: 'admin',
          avatar_url: 'https://ui-avatars.com/api/?name=Demo+Admin&background=5521B5&color=fff'
        });
      }
    } else {
      // If admin auth exists, check if the user profile exists
      const {
        error: adminProfileError
      } = await supabase.from('users').select('*').eq('email', 'admin@scholardorm.com').single();
      // If profile doesn't exist but auth does, create the profile
      if (adminProfileError && adminAuthData?.user) {
        await supabase.from('users').insert({
          id: adminAuthData.user.id,
          email: 'admin@scholardorm.com',
          full_name: 'Demo Administrator',
          streak_count: 0,
          longest_streak: 0,
          role: 'admin',
          avatar_url: 'https://ui-avatars.com/api/?name=Demo+Admin&background=5521B5&color=fff'
        });
      }
    }
    // Sign out after creating/checking accounts
    await supabase.auth.signOut();
    return true;
  } catch (error) {
    console.error('Error ensuring demo accounts exist:', error);
    return false;
  }
};
// Course management functions
export const getCourses = async (filters?: {
  subject?: string;
  difficulty?: string;
  isActive?: boolean;
  search?: string;
}) => {
  try {
    // Select courses with creator name and lesson count using joins and aggregation
    let query = supabase
      .from('courses')
      .select(`
        *,
        creator:users!created_by(full_name),
        lesson_count:lessons!course_id(count)
      `, { count: 'exact' });

    if (filters) {
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Map data to include creator name and lesson count properly
    const mappedData = (data || []).map(course => ({
      ...course,
      created_by_name: course.creator?.full_name || 'Unknown',
      lesson_count: course.lesson_count || 0
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
};
export const getCourseById = async (courseId: string) => {
  try {
    const {
      data,
      error
    } = await supabase.from('courses').select(`
        *,
        lessons:lessons(*)
      `).eq('id', courseId).single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching course with ID ${courseId}:`, error);
    return null;
  }
};
export const createCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const {
      data,
      error
    } = await supabase.from('courses').insert(courseData).select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};
export const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
  try {
    const {
      data,
      error
    } = await supabase.from('courses').update({
      ...courseData,
      updated_at: new Date().toISOString()
    }).eq('id', courseId).select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Error updating course with ID ${courseId}:`, error);
    return null;
  }
};
export const deleteCourse = async (courseId: string) => {
  try {
    const {
      error
    } = await supabase.from('courses').delete().eq('id', courseId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting course with ID ${courseId}:`, error);
    return false;
  }
};
// Post management functions
export const getPosts = async (filters?: {
  isPublished?: boolean;
  type?: string;
  search?: string;
}) => {
  try {
    let query = supabase.from('posts').select(`
      *,
      author:users!author_id(full_name, avatar_url)
    `);
    if (filters) {
      if (filters.isPublished !== undefined) {
        query = query.eq('is_published', filters.isPublished);
      }
      if (filters.type) {
        query = query.eq('post_type', filters.type);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
    }
    const {
      data,
      error
    } = await query.order('created_at', {
      ascending: false
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};
export const createPost = async (postData: Omit<Post, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const {
      data,
      error
    } = await supabase.from('posts').insert(postData).select();
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};
// User enrollment functions
export const enrollUserInCourse = async (userId: string, courseId: string) => {
  try {
    const {
      data,
      error
    } = await supabase.from('user_courses').insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      completed: false
    }).select();
    if (error) throw error;
    // Create audit log
    await createAuditLog(userId, 'course_start', {
      course_id: courseId
    });
    return data[0];
  } catch (error) {
    console.error(`Error enrolling user ${userId} in course ${courseId}:`, error);
    return null;
  }
};
export const getUserEnrolledCourses = async (userId: string) => {
  try {
    const {
      data,
      error
    } = await supabase.from('user_courses').select(`
        *,
        course:courses(*)
      `).eq('user_id', userId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching enrolled courses for user ${userId}:`, error);
    return [];
  }
};
export const getUserAchievements = async (userId: string) => {
  try {
    const {
      data,
      error
    } = await supabase.from('user_badges').select(`
        *,
        badge:badges(*)
      `).eq('user_id', userId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching achievements for user ${userId}:`, error);
    return [];
  }
};