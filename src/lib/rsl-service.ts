import { supabase } from './supabase';

// RSL Types
export interface RSLVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: RSLCategory;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  duration_seconds: number;
  tags: string[];
  created_at: string;
  is_active: boolean;
}

export interface RSLSign {
  id: string;
  word: string;
  description: string;
  video_url: string;
  image_url?: string;
  category: RSLCategory;
  usage_examples: string[];
  related_signs: string[];
  created_at: string;
}

export type RSLCategory = 
  | 'greetings'
  | 'education'
  | 'navigation'
  | 'emotions'
  | 'numbers'
  | 'colors'
  | 'family'
  | 'technology'
  | 'academic_subjects'
  | 'common_phrases';

export interface RSLLearningProgress {
  user_id: string;
  sign_id: string;
  mastery_level: number; // 0-100
  last_practiced: string;
  practice_count: number;
}

export interface RSLAccessibilitySettings {
  show_captions: boolean;
  video_speed: number; // 0.5, 0.75, 1.0, 1.25, 1.5
  high_contrast: boolean;
  large_text: boolean;
  auto_repeat: boolean;
  sign_descriptions: boolean;
}

// RSL Service Class
export class RSLService {
  // Get RSL videos by category
  static async getVideosByCategory(category: RSLCategory): Promise<RSLVideo[]> {
    try {
      const { data, error } = await supabase
        .from('rsl_videos')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching RSL videos:', error);
      return [];
    }
  }

  // Get featured/recommended RSL videos
  static async getFeaturedVideos(limit: number = 6): Promise<RSLVideo[]> {
    try {
      const { data, error } = await supabase
        .from('rsl_videos')
        .select('*')
        .eq('is_active', true)
        .in('category', ['greetings', 'education', 'navigation'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured RSL videos:', error);
      return [];
    }
  }

  // Search RSL signs
  static async searchSigns(query: string): Promise<RSLSign[]> {
    try {
      const { data, error } = await supabase
        .from('rsl_signs')
        .select('*')
        .or(`word.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('word');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching RSL signs:', error);
      return [];
    }
  }

  // Get signs by category
  static async getSignsByCategory(category: RSLCategory): Promise<RSLSign[]> {
    try {
      const { data, error } = await supabase
        .from('rsl_signs')
        .select('*')
        .eq('category', category)
        .order('word');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching RSL signs by category:', error);
      return [];
    }
  }

  // Track user's RSL learning progress
  static async updateLearningProgress(
    userId: string,
    signId: string,
    masteryLevel: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('rsl_learning_progress')
        .upsert({
          user_id: userId,
          sign_id: signId,
          mastery_level: masteryLevel,
          last_practiced: new Date().toISOString(),
          practice_count: 1
        }, {
          onConflict: 'user_id,sign_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating RSL learning progress:', error);
    }
  }

  // Get user's RSL progress
  static async getUserProgress(userId: string): Promise<RSLLearningProgress[]> {
    try {
      const { data, error } = await supabase
        .from('rsl_learning_progress')
        .select('*')
        .eq('user_id', userId)
        .order('last_practiced', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user RSL progress:', error);
      return [];
    }
  }

  // Get user's accessibility settings
  static async getAccessibilitySettings(userId: string): Promise<RSLAccessibilitySettings> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('accessibility_settings')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found for this user, return defaults
          return {
            show_captions: true,
            video_speed: 1.0,
            high_contrast: false,
            large_text: false,
            auto_repeat: false,
            sign_descriptions: true,
          };
        }
        throw error;
      }

      return {
        show_captions: data?.accessibility_settings?.show_captions ?? true,
        video_speed: data?.accessibility_settings?.video_speed ?? 1.0,
        high_contrast: data?.accessibility_settings?.high_contrast ?? false,
        large_text: data?.accessibility_settings?.large_text ?? false,
        auto_repeat: data?.accessibility_settings?.auto_repeat ?? false,
        sign_descriptions: data?.accessibility_settings?.sign_descriptions ?? true,
      };
    } catch (error) {
      console.error('Error fetching accessibility settings:', error);
      return {
        show_captions: true,
        video_speed: 1.0,
        high_contrast: false,
        large_text: false,
        auto_repeat: false,
        sign_descriptions: true,
      };
    }
  }

  // Update user's accessibility settings
  static async updateAccessibilitySettings(
    userId: string,
    settings: Partial<RSLAccessibilitySettings>
  ): Promise<void> {
    try {
      // First get current settings
      const { data: currentSettings, error: fetchError } = await supabase
        .from('user_settings')
        .select('accessibility_settings')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const updatedSettings = {
        ...currentSettings?.accessibility_settings,
        ...settings
      };

      const { error } = await supabase
        .from('user_settings')
        .update({
          accessibility_settings: updatedSettings
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
    }
  }

  // Get RSL categories with counts
  static async getCategoriesWithCounts(): Promise<Array<{category: RSLCategory, count: number, description: string}>> {
    const categories: Array<{category: RSLCategory, count: number, description: string}> = [
      { category: 'greetings', count: 0, description: 'Hello, goodbye, thank you' },
      { category: 'education', count: 0, description: 'School, learn, study, book' },
      { category: 'navigation', count: 0, description: 'Help, next, back, menu' },
      { category: 'emotions', count: 0, description: 'Happy, sad, excited, confused' },
      { category: 'numbers', count: 0, description: '1-10, counting, mathematics' },
      { category: 'colors', count: 0, description: 'Red, blue, green, yellow' },
      { category: 'family', count: 0, description: 'Mother, father, sister, brother' },
      { category: 'technology', count: 0, description: 'Computer, phone, internet' },
      { category: 'academic_subjects', count: 0, description: 'Math, science, history' },
      { category: 'common_phrases', count: 0, description: 'Please, excuse me, sorry' }
    ];

    try {
      for (const category of categories) {
        const { count, error } = await supabase
          .from('rsl_signs')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.category);

        if (error) throw error;
        category.count = count || 0;
      }
    } catch (error) {
      console.error('Error fetching category counts:', error);
    }

    return categories;
  }
}

// Utility functions for RSL
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getCategoryIcon = (category: RSLCategory): string => {
  const icons: Record<RSLCategory, string> = {
    greetings: '👋',
    education: '📚',
    navigation: '🧭',
    emotions: '😊',
    numbers: '🔢',
    colors: '🎨',
    family: '👨‍👩‍👧‍👦',
    technology: '💻',
    academic_subjects: '🎓',
    common_phrases: '💬'
  };
  return icons[category] || '📝';
};

export const getCategoryDisplayName = (category: RSLCategory): string => {
  const names: Record<RSLCategory, string> = {
    greetings: 'Greetings',
    education: 'Education',
    navigation: 'Navigation',
    emotions: 'Emotions',
    numbers: 'Numbers',
    colors: 'Colors',
    family: 'Family',
    technology: 'Technology',
    academic_subjects: 'Academic Subjects',
    common_phrases: 'Common Phrases'
  };
  return names[category] || category;
};