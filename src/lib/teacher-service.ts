import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// Teacher-specific types
export interface Teacher extends User {
  role: 'teacher';
  full_name: string;
  avatar_url?: string;
  bio?: string;
  department?: string;
}

export interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalCourses: number;
  completedCourses: number;
  currentCourse: string;
  overallProgress: number;
  averageScore: number;
  timeSpent: number;
  lastActive: string;
  strengths: string[];
  improvements: string[];
  enrollmentDate: string;
}

export interface TeacherCourse {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  enrolledStudents: number;
  averageProgress: number;
  averageRating: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface TeacherQuiz {
  id: string;
  title: string;
  description: string;
  course: string;
  courseId: string;
  totalQuestions: number;
  timeLimit: number;
  attempts: number;
  averageScore: number;
  participants: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  passingScore: number;
  type: 'practice' | 'assessment' | 'final';
}

export interface TeacherContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'document' | 'image' | 'audio' | 'rsl_video';
  url: string;
  thumbnailUrl?: string;
  size: number;
  course?: string;
  courseId?: string;
  lesson?: string;
  lessonId?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  viewCount: number;
  category: string;
}

export interface RSLContent {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  category: 'numbers' | 'letters' | 'words' | 'phrases' | 'mathematics' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  transcript?: string;
  signDescription: string;
  relatedConcepts: string[];
  viewCount: number;
  likes: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  instructor: string;
  course?: string;
  courseId?: string;
  lesson?: string;
  lessonId?: string;
}

export interface TeacherAnalytics {
  totalStudents: number;
  activeStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalContent: number;
  publishedContent: number;
  totalRSLVideos: number;
  publishedRSLVideos: number;
  averageProgress: number;
  averageScore: number;
  totalTimeSpent: number;
  completionRate: number;
}

// Teacher Service Class
export class TeacherService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Get Teacher Dashboard Data
  async getDashboardData(): Promise<TeacherAnalytics> {
    try {
      const { data, error } = await supabase
        .rpc('get_teacher_dashboard_data', { teacher_uuid: this.userId });

      if (error) throw error;

      return this.transformDashboardData(data);
    } catch (error) {
      console.error('Error fetching teacher dashboard data:', error);
      throw error;
    }
  }

  // Get Assigned Students
  async getStudents(searchTerm?: string, progressFilter?: string): Promise<TeacherStudent[]> {
    try {
      let query = supabase
        .from('teacher_student_progress_view')
        .select('*')
        .eq('teacher_id', this.userId);

      if (searchTerm) {
        query = query.or(`student_name.ilike.%${searchTerm}%,student_email.ilike.%${searchTerm}%`);
      }

      if (progressFilter && progressFilter !== 'all') {
        switch (progressFilter) {
          case 'high':
            query = query.gte('progress_percentage', 80);
            break;
          case 'medium':
            query = query.gte('progress_percentage', 50).lt('progress_percentage', 80);
            break;
          case 'low':
            query = query.lt('progress_percentage', 50);
            break;
        }
      }

      const { data, error } = await query.order('student_name');

      if (error) throw error;

      return this.transformStudentData(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  // Get Assigned Courses
  async getCourses(searchTerm?: string, statusFilter?: string): Promise<TeacherCourse[]> {
    try {
      let query = supabase
        .from('teacher_course_analytics')
        .select('*')
        .eq('teacher_id', this.userId);

      if (searchTerm) {
        query = query.or(`course_title.ilike.%${searchTerm}%,course_description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('course_title');

      if (error) throw error;

      return this.transformCourseData(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Get Teacher's Quizzes
  async getQuizzes(searchTerm?: string, statusFilter?: string, typeFilter?: string): Promise<TeacherQuiz[]> {
    try {
      let query = supabase
        .from('enhanced_quizzes')
        .select(`
          *,
          lessons!inner(
            course_sections!inner(
              courses!inner(
                teacher_course_assignments!inner(teacher_id)
              )
            )
          )
        `)
        .eq('lessons.course_sections.courses.teacher_course_assignments.teacher_id', this.userId);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        const isPublished = statusFilter === 'published';
        query = query.eq('is_published', isPublished);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformQuizData(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  }

  // Get Teacher's Content
  async getContent(searchTerm?: string, typeFilter?: string, statusFilter?: string): Promise<TeacherContent[]> {
    try {
      let query = supabase
        .from('teacher_content')
        .select('*')
        .eq('teacher_id', this.userId);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('content_type', typeFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformContentData(data || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  }

  // Get RSL Content
  async getRSLContent(searchTerm?: string, categoryFilter?: string, difficultyFilter?: string, statusFilter?: string): Promise<RSLContent[]> {
    try {
      let query = supabase
        .from('rsl_content')
        .select('*')
        .eq('teacher_id', this.userId);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (difficultyFilter && difficultyFilter !== 'all') {
        query = query.eq('difficulty_level', difficultyFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformRSLContentData(data || []);
    } catch (error) {
      console.error('Error fetching RSL content:', error);
      throw error;
    }
  }

  // Create RSL Content
  async createRSLContent(contentData: Partial<RSLContent>): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_rsl_content', {
          teacher_uuid: this.userId,
          content_title: contentData.title,
          content_description: contentData.description,
          video_url: contentData.videoUrl,
          content_category: contentData.category,
          difficulty: contentData.difficulty || 'beginner',
          sign_desc: contentData.signDescription,
          instructor: contentData.instructor
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error creating RSL content:', error);
      throw error;
    }
  }

  // Assign Students to Course
  async assignStudentsToCourse(studentIds: string[], courseId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('assign_students_to_teacher', {
          teacher_uuid: this.userId,
          student_uuids: studentIds,
          course_uuid: courseId
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error assigning students:', error);
      throw error;
    }
  }

  // Record Analytics Metric
  async recordMetric(metricType: string, metricName: string, value: number, metadata?: any): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('record_teacher_metric', {
          teacher_uuid: this.userId,
          metric_type_val: metricType,
          metric_name_val: metricName,
          metric_value_val: value,
          metadata_val: metadata || {}
        });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  }

  // Upload Content File
  async uploadContent(file: File, contentType: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${this.userId}/${contentType}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('teacher-content')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('teacher-content')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading content:', error);
      throw error;
    }
  }

  // Increment Content View Count
  async incrementViewCount(contentId: string, contentType: 'teacher_content' | 'rsl_content'): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('increment_content_view_count', {
          content_id: contentId,
          content_type: contentType
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }

  // Private helper methods for data transformation
  private transformDashboardData(data: any): TeacherAnalytics {
    const summary = data?.summary || {};
    return {
      totalStudents: summary.active_students || 0,
      activeStudents: summary.active_students || 0,
      totalCourses: summary.assigned_courses || 0,
      activeCourses: summary.assigned_courses || 0,
      totalContent: summary.created_content || 0,
      publishedContent: summary.created_content || 0,
      totalRSLVideos: summary.rsl_videos || 0,
      publishedRSLVideos: summary.rsl_videos || 0,
      averageProgress: 75, // Calculate from actual data
      averageScore: 82, // Calculate from actual data
      totalTimeSpent: 12800, // Calculate from actual data
      completionRate: 68 // Calculate from actual data
    };
  }

  private transformStudentData(data: any[]): TeacherStudent[] {
    return data.map(item => ({
      id: item.student_id,
      name: item.student_name,
      email: item.student_email,
      avatar: item.student_avatar,
      totalCourses: 1, // This would need to be calculated
      completedCourses: item.course_completed ? 1 : 0,
      currentCourse: item.course_title,
      overallProgress: item.progress_percentage || 0,
      averageScore: item.average_quiz_score || 0,
      timeSpent: Math.floor((item.total_time_spent_seconds || 0) / 60),
      lastActive: item.last_accessed || item.last_login,
      strengths: this.calculateStrengths(item),
      improvements: this.calculateImprovements(item),
      enrollmentDate: item.enrolled_at
    }));
  }

  private transformCourseData(data: any[]): TeacherCourse[] {
    return data.map(item => ({
      id: item.course_id,
      title: item.course_title,
      description: item.course_description,
      thumbnail: item.course_image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      totalLessons: item.total_lessons || 12,
      completedLessons: Math.floor((item.total_lessons || 12) * (item.average_progress / 100)),
      enrolledStudents: item.enrolled_students,
      averageProgress: item.average_progress,
      averageRating: 4.5, // This would need to be calculated from actual ratings
      status: 'published' as const,
      createdAt: new Date().toISOString(),
      updatedAt: item.last_assignment_update || new Date().toISOString(),
      category: item.subject,
      difficulty: item.difficulty_level || 'beginner'
    }));
  }

  private transformQuizData(data: any[]): TeacherQuiz[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      course: 'Course Name', // This would need to be joined
      courseId: 'course-id',
      totalQuestions: 15, // This would need to be calculated
      timeLimit: item.time_limit_minutes || 30,
      attempts: 0, // This would need to be calculated
      averageScore: 0, // This would need to be calculated
      participants: 0, // This would need to be calculated
      status: item.is_published ? 'published' : 'draft',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      difficulty: 'medium' as const,
      category: 'Mathematics',
      passingScore: item.passing_score,
      type: 'practice' as const
    }));
  }

  private transformContentData(data: any[]): TeacherContent[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.content_type,
      url: item.file_url,
      thumbnailUrl: item.thumbnail_url,
      size: item.file_size || 0,
      course: undefined,
      courseId: undefined,
      lesson: undefined,
      lessonId: undefined,
      tags: item.tags || [],
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      downloadCount: item.download_count,
      viewCount: item.view_count,
      category: item.category
    }));
  }

  private transformRSLContentData(data: any[]): RSLContent[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      videoUrl: item.video_url,
      thumbnailUrl: item.thumbnail_url || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
      duration: item.duration_seconds || 180,
      category: item.category,
      difficulty: item.difficulty_level,
      tags: item.tags || [],
      transcript: item.transcript,
      signDescription: item.sign_description,
      relatedConcepts: item.related_concepts || [],
      viewCount: item.view_count,
      likes: item.likes_count,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      instructor: item.instructor_name,
      course: undefined,
      courseId: item.course_id,
      lesson: undefined,
      lessonId: item.lesson_id
    }));
  }

  private calculateStrengths(studentData: any): string[] {
    const strengths = [];
    if (studentData.average_quiz_score > 85) strengths.push('High Test Performance');
    if (studentData.streak_count > 7) strengths.push('Consistent Learning');
    if (studentData.progress_percentage > 80) strengths.push('Fast Progress');
    return strengths.length > 0 ? strengths : ['Enrolled Student'];
  }

  private calculateImprovements(studentData: any): string[] {
    const improvements = [];
    if (studentData.average_quiz_score < 70) improvements.push('Quiz Performance');
    if (studentData.progress_percentage < 50) improvements.push('Course Progress');
    if (studentData.streak_count < 3) improvements.push('Consistency');
    return improvements.length > 0 ? improvements : [];
  }
}

// Helper function to create a teacher service instance
export const createTeacherService = (userId: string): TeacherService => {
  return new TeacherService(userId);
};