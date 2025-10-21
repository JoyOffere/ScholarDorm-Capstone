import { supabase } from './supabase';

// Enhanced Lesson Types
export interface EnhancedLesson {
  id: string;
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  content: Record<string, any>;
  content_type: 'video' | 'text' | 'interactive' | 'quiz' | 'mixed';
  content_html?: string;
  rsl_video_url?: string;
  estimated_duration_minutes: number;
  order_index: number;
  learning_objectives?: string[];
  key_concepts?: string[];
  difficulty_tags?: string[];
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLessonData {
  course_id: string;
  section_id?: string;
  title: string;
  description?: string;
  content?: Record<string, any>;
  content_type: 'video' | 'text' | 'interactive' | 'quiz' | 'mixed';
  content_html?: string;
  rsl_video_url?: string;
  estimated_duration_minutes?: number;
  learning_objectives?: string[];
  key_concepts?: string[];
  difficulty_tags?: string[];
  is_preview?: boolean;
  is_published?: boolean;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {
  id: string;
}

// Course Section Types
export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSectionData {
  course_id: string;
  title: string;
  description?: string;
}

// Lesson Management Functions
export class LessonService {
  
  // Get all lessons for a course
  static async getLessonsByCourse(courseId: string): Promise<EnhancedLesson[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  // Get single lesson by ID
  static async getLessonById(lessonId: string): Promise<EnhancedLesson | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  // Create new lesson
  static async createLesson(lessonData: CreateLessonData): Promise<EnhancedLesson> {
    try {
      // Get the next order index for this course
      const { data: lastLesson } = await supabase
        .from('enhanced_lessons')
        .select('order_index')
        .eq('course_id', lessonData.course_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const nextOrderIndex = (lastLesson?.order_index || 0) + 1;

      const { data, error } = await supabase
        .from('enhanced_lessons')
        .insert({
          ...lessonData,
          order_index: nextOrderIndex,
          content: lessonData.content || {},
          estimated_duration_minutes: lessonData.estimated_duration_minutes || 5,
          difficulty_tags: lessonData.difficulty_tags || ['easy'],
          is_preview: lessonData.is_preview || false,
          is_published: lessonData.is_published !== false, // default to true
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update course total lessons count
      await this.updateCourseLessonCount(lessonData.course_id);

      return data;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  // Update lesson
  static async updateLesson(lessonData: UpdateLessonData): Promise<EnhancedLesson> {
    try {
      const { id, ...updateData } = lessonData;
      
      const { data, error } = await supabase
        .from('enhanced_lessons')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  // Delete lesson
  static async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      // First get the lesson to know which course to update
      const lesson = await this.getLessonById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      const { error } = await supabase
        .from('enhanced_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      // Update course total lessons count
      await this.updateCourseLessonCount(lesson.course_id);

      // Reorder remaining lessons
      await this.reorderLessons(lesson.course_id);

      return true;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  // Reorder lessons
  static async reorderLessons(courseId: string, lessonIds?: string[]): Promise<void> {
    try {
      if (lessonIds) {
        // Custom order provided
        const updates = lessonIds.map((lessonId, index) => 
          supabase
            .from('enhanced_lessons')
            .update({ 
              order_index: index + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', lessonId)
        );
        
        await Promise.all(updates);
      } else {
        // Auto-reorder based on current order
        const lessons = await this.getLessonsByCourse(courseId);
        const updates = lessons.map((lesson, index) => 
          supabase
            .from('enhanced_lessons')
            .update({ 
              order_index: index + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', lesson.id)
        );
        
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Error reordering lessons:', error);
      throw error;
    }
  }

  // Duplicate lesson
  static async duplicateLesson(lessonId: string): Promise<EnhancedLesson> {
    try {
      const originalLesson = await this.getLessonById(lessonId);
      if (!originalLesson) throw new Error('Lesson not found');

      const duplicateData: CreateLessonData = {
        course_id: originalLesson.course_id,
        section_id: originalLesson.section_id,
        title: `${originalLesson.title} (Copy)`,
        description: originalLesson.description,
        content: originalLesson.content,
        content_type: originalLesson.content_type,
        content_html: originalLesson.content_html,
        rsl_video_url: originalLesson.rsl_video_url,
        estimated_duration_minutes: originalLesson.estimated_duration_minutes,
        learning_objectives: originalLesson.learning_objectives,
        key_concepts: originalLesson.key_concepts,
        difficulty_tags: originalLesson.difficulty_tags,
        is_preview: originalLesson.is_preview,
        is_published: false // Start as unpublished for review
      };

      return await this.createLesson(duplicateData);
    } catch (error) {
      console.error('Error duplicating lesson:', error);
      throw error;
    }
  }

  // Toggle lesson published status
  static async toggleLessonStatus(lessonId: string): Promise<EnhancedLesson> {
    try {
      const lesson = await this.getLessonById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      return await this.updateLesson({
        id: lessonId,
        is_published: !lesson.is_published
      });
    } catch (error) {
      console.error('Error toggling lesson status:', error);
      throw error;
    }
  }

  // Update course lesson count
  private static async updateCourseLessonCount(courseId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('enhanced_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);

      await supabase
        .from('courses')
        .update({ 
          total_lessons: count || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);
    } catch (error) {
      console.error('Error updating course lesson count:', error);
    }
  }

  // Get lesson statistics
  static async getLessonStats(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('enhanced_lessons')
        .select('content_type, is_published, estimated_duration_minutes')
        .eq('course_id', courseId);

      if (error) throw error;

      const stats = {
        total: data.length,
        published: data.filter(l => l.is_published).length,
        draft: data.filter(l => !l.is_published).length,
        totalDurationMinutes: data.reduce((sum, l) => sum + (l.estimated_duration_minutes || 0), 0),
        byType: data.reduce((acc, lesson) => {
          acc[lesson.content_type] = (acc[lesson.content_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('Error getting lesson stats:', error);
      throw error;
    }
  }
}

// Course Section Management Functions
export class CourseSectionService {
  
  // Get all sections for a course
  static async getSectionsByCourse(courseId: string): Promise<CourseSection[]> {
    try {
      const { data, error } = await supabase
        .from('course_sections_bridge')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  }

  // Create new section
  static async createSection(sectionData: CreateSectionData): Promise<CourseSection> {
    try {
      // Get the next order index for this course
      const { data: lastSection } = await supabase
        .from('course_sections_bridge')
        .select('order_index')
        .eq('course_id', sectionData.course_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const nextOrderIndex = (lastSection?.order_index || 0) + 1;

      const { data, error } = await supabase
        .from('course_sections_bridge')
        .insert({
          ...sectionData,
          order_index: nextOrderIndex,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating section:', error);
      throw error;
    }
  }

  // Delete section
  static async deleteSection(sectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('course_sections_bridge')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  }
}