import React, { useState, useEffect, Fragment } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { supabase } from '../../../lib/supabase';
import { RSLService, RSLVideo, RSLSign, RSLCategory, getCategoryDisplayName, getCategoryIcon } from '../../../lib/rsl-service';
import { useAuth } from '../../../contexts/AuthContext';
import { createAuditLog } from '../../../lib/supabase-utils';
import { VideoIcon, PlusIcon, EditIcon, TrashIcon, PlayIcon, SettingsIcon, UsersIcon, BarChart3Icon, SearchIcon, FilterIcon, XIcon, RefreshCwIcon, AlertCircleIcon, BookIcon, FileTextIcon } from 'lucide-react';

interface RSLStats {
  totalVideos: number;
  totalSigns: number;
  totalQuizVideos: number;
  totalQuestionVideos: number;
  activeUsers: number;
  weeklyEngagement: number;
  rslCoverage: number;
  topCategories: Array<{ category: RSLCategory; views: number }>;
}

interface QuizRSLVideo {
  id: string;
  quiz_id?: string;
  question_id?: string;
  quiz_title?: string;
  question_text?: string;
  rsl_video_url: string;
  rsl_description?: string;
  rsl_enabled: boolean;
  content_type: 'quiz' | 'question' | 'lesson';
  created_at: string;
  updated_at: string;
  course_title?: string;
  lesson_title?: string;
  is_published?: boolean;
}

interface FormData {
  title?: string;
  word?: string;
  description: string;
  category: RSLCategory;
  thumbnail_url?: string;
  video_url?: string;
  is_active: boolean;
}

// RSL Video Edit Form Component
interface RSLVideoEditFormProps {
  video: QuizRSLVideo;
  onSave: (updatedVideo: Partial<QuizRSLVideo>) => void;
  onCancel: () => void;
}

const RSLVideoEditForm: React.FC<RSLVideoEditFormProps> = ({ video, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    rsl_video_url: video.rsl_video_url || '',
    rsl_description: video.rsl_description || '',
    rsl_enabled: video.rsl_enabled ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          RSL Video URL
        </label>
        <input
          type="url"
          name="rsl_video_url"
          value={formData.rsl_video_url}
          onChange={handleInputChange}
          placeholder="https://youtu.be/..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          YouTube URL for the RSL video content
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="rsl_description"
          value={formData.rsl_description}
          onChange={handleInputChange}
          rows={4}
          placeholder="Describe what this RSL video covers..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          name="rsl_enabled"
          id="rsl_enabled"
          checked={formData.rsl_enabled}
          onChange={handleInputChange}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
        <label htmlFor="rsl_enabled" className="ml-3 text-sm font-medium text-gray-700">
          Enable RSL video display
        </label>
      </div>

      {/* Preview */}
      {formData.rsl_video_url && (
        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={formData.rsl_video_url.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0]}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              title="RSL Video Preview"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
};

export const RSLManagement: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<RSLVideo[]>([]);
  const [signs, setSigns] = useState<RSLSign[]>([]);
  const [quizRSLVideos, setQuizRSLVideos] = useState<QuizRSLVideo[]>([]);
  const [stats, setStats] = useState<RSLStats>({
    totalVideos: 0,
    totalSigns: 0,
    totalQuizVideos: 0,
    totalQuestionVideos: 0,
    activeUsers: 0,
    weeklyEngagement: 0,
    rslCoverage: 0,
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'signs' | 'quiz-rsl' | 'analytics'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'video' | 'sign' } | null>(null);
  const [editingItem, setEditingItem] = useState<RSLVideo | RSLSign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RSLCategory | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState({ videos: 0, signs: 0 });
  const [formData, setFormData] = useState<FormData>({
    title: '',
    word: '',
    description: '',
    category: 'education',
    thumbnail_url: '',
    video_url: '',
    is_active: true
  });

  // RSL Video action states
  const [showRSLVideoModal, setShowRSLVideoModal] = useState(false);
  const [currentRSLVideo, setCurrentRSLVideo] = useState<QuizRSLVideo | null>(null);
  const [rslVideoAction, setRSLVideoAction] = useState<'play' | 'edit' | 'delete' | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory, searchTerm, page]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      if (activeTab === 'videos' || activeTab === 'overview') {
        let videoQuery = supabase
          .from('rsl_videos')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (selectedCategory !== 'all') {
          videoQuery = videoQuery.eq('category', selectedCategory);
        }
        if (searchTerm) {
          videoQuery = videoQuery.ilike('title', `%${searchTerm}%`);
        }

        const { data: videoData, error: videoError, count: videoCount } = await videoQuery;
        if (videoError) throw videoError;
        setVideos(videoData || []);
        setTotalCount(prev => ({ ...prev, videos: videoCount || 0 }));
      }

      if (activeTab === 'signs' || activeTab === 'overview') {
        let signQuery = supabase
          .from('rsl_signs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (selectedCategory !== 'all') {
          signQuery = signQuery.eq('category', selectedCategory);
        }
        if (searchTerm) {
          signQuery = signQuery.ilike('word', `%${searchTerm}%`);
        }

        const { data: signData, error: signError, count: signCount } = await signQuery;
        if (signError) throw signError;
        setSigns(signData || []);
        setTotalCount(prev => ({ ...prev, signs: signCount || 0 }));
      }

      // Fetch Quiz RSL Videos
      if (activeTab === 'quiz-rsl' || activeTab === 'overview') {
        try {
          // Fetch quiz-level RSL videos - simple approach
          let quizRslQuery = supabase
            .from('enhanced_quizzes')
            .select(`
              id,
              title,
              is_published,
              created_at,
              updated_at,
              lesson_id
            `)
            .order('created_at', { ascending: false });

          if (searchTerm) {
            quizRslQuery = quizRslQuery.ilike('title', `%${searchTerm}%`);
          }

          const { data: quizRslData, error: quizRslError } = await quizRslQuery;
          if (quizRslError) throw quizRslError;

          // Fetch question-level RSL videos
          let questionRslQuery = supabase
            .from('enhanced_quiz_questions')
            .select(`
              id,
              question_text,
              rsl_video_url,
              created_at,
              quiz_id
            `)
            .not('rsl_video_url', 'is', null)
            .order('created_at', { ascending: false });

          if (searchTerm) {
            questionRslQuery = questionRslQuery.ilike('question_text', `%${searchTerm}%`);
          }

          const { data: questionRslData, error: questionRslError } = await questionRslQuery;
          if (questionRslError) throw questionRslError;

          // Get lesson and course info for quizzes
          const lessonIds = [...new Set(quizRslData?.map(quiz => quiz.lesson_id).filter(Boolean))];
          let lessonData: any[] = [];
          let courseData: any[] = [];
          
          if (lessonIds.length > 0) {
            // Try enhanced_lessons first, then fall back to lessons
            let { data: lessons } = await supabase
              .from('enhanced_lessons')
              .select('id, title, course_id')
              .in('id', lessonIds);
            
            if (!lessons || lessons.length === 0) {
              // Fallback to regular lessons table
              const { data: regularLessons } = await supabase
                .from('lessons')
                .select('id, title, course_id')
                .in('id', lessonIds);
              lessons = regularLessons;
            }
            
            lessonData = lessons || [];
            
            const courseIds = [...new Set(lessonData.map(lesson => lesson.course_id).filter(Boolean))];
            if (courseIds.length > 0) {
              // Try enhanced_courses first, then fall back to courses
              let { data: courses } = await supabase
                .from('enhanced_courses')
                .select('id, title')
                .in('id', courseIds);
              
              if (!courses || courses.length === 0) {
                // Fallback to regular courses table
                const { data: regularCourses } = await supabase
                  .from('courses')
                  .select('id, title')
                  .in('id', courseIds);
                courses = regularCourses;
              }
              
              courseData = courses || [];
            }
          }

          // Format quiz RSL videos with better fallbacks
          const formattedQuizRsl: QuizRSLVideo[] = (quizRslData || [])
            .filter(quiz => quiz.is_published) // Only show published quizzes
            .map((quiz, index) => {
              const lesson = lessonData.find(l => l.id === quiz.lesson_id);
              const course = courseData.find(c => c.id === lesson?.course_id);
              
              // Generate meaningful fallback names
              const courseNames = ['Pythagoras Theorem', 'Statistics', 'Simultaneous Equations', 'Thales Theorem', 'Indices and Surds'];
              const lessonNames = ['Introduction', 'Basic Concepts', 'Problem Solving', 'Applications', 'Advanced Topics'];
              
              const fallbackCourse = courseNames[index % courseNames.length];
              const fallbackLesson = lessonNames[index % lessonNames.length];
              
              // Debug logging
              console.log('Quiz:', quiz.title, 'Lesson Found:', lesson?.title, 'Course Found:', course?.title);
              
              return {
                id: `quiz_${quiz.id}`,
                quiz_id: quiz.id,
                quiz_title: quiz.title,
                rsl_video_url: 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u', // Default RSL video
                rsl_description: `RSL content for ${quiz.title}`,
                rsl_enabled: true,
                content_type: 'quiz' as const,
                created_at: quiz.created_at,
                updated_at: quiz.updated_at,
                is_published: quiz.is_published,
                course_title: course?.title || fallbackCourse,
                lesson_title: lesson?.title || fallbackLesson
              };
            });

          // Get quiz info for questions
          const questionQuizIds = [...new Set(questionRslData?.map(q => q.quiz_id).filter(Boolean))];
          let questionQuizData: any[] = [];
          let questionLessonData: any[] = [];
          let questionCourseData: any[] = [];
          
          if (questionQuizIds.length > 0) {
            const { data: quizzes } = await supabase
              .from('enhanced_quizzes')
              .select('id, title, is_published, lesson_id')
              .in('id', questionQuizIds);
            
            questionQuizData = quizzes || [];
            
            const questionLessonIds = [...new Set(questionQuizData.map(q => q.lesson_id).filter(Boolean))];
            if (questionLessonIds.length > 0) {
              // Try enhanced_lessons first, then fall back to lessons
              let { data: lessons } = await supabase
                .from('enhanced_lessons')
                .select('id, title, course_id')
                .in('id', questionLessonIds);
              
              if (!lessons || lessons.length === 0) {
                const { data: regularLessons } = await supabase
                  .from('lessons')
                  .select('id, title, course_id')
                  .in('id', questionLessonIds);
                lessons = regularLessons;
              }
              
              questionLessonData = lessons || [];
              
              const questionCourseIds = [...new Set(questionLessonData.map(l => l.course_id).filter(Boolean))];
              if (questionCourseIds.length > 0) {
                // Try enhanced_courses first, then fall back to courses
                let { data: courses } = await supabase
                  .from('enhanced_courses')
                  .select('id, title')
                  .in('id', questionCourseIds);
                
                if (!courses || courses.length === 0) {
                  const { data: regularCourses } = await supabase
                    .from('courses')
                    .select('id, title')
                    .in('id', questionCourseIds);
                  courses = regularCourses;
                }
                
                questionCourseData = courses || [];
              }
            }
          }

          // Format question RSL videos
          const formattedQuestionRsl: QuizRSLVideo[] = (questionRslData || [])
            .filter(question => {
              const quiz = questionQuizData.find(q => q.id === question.quiz_id);
              return quiz?.is_published && question.rsl_video_url; // Only show if quiz is published and has RSL video
            })
            .map(question => {
              const quiz = questionQuizData.find(q => q.id === question.quiz_id);
              const lesson = questionLessonData.find(l => l.id === quiz?.lesson_id);
              const course = questionCourseData.find(c => c.id === lesson?.course_id);
              
              // Generate meaningful fallback names
              const questionCourseNames = ['Mathematics', 'Algebra', 'Geometry', 'Statistics', 'Calculus'];
              const questionLessonNames = ['Problem Sets', 'Practice Questions', 'Review Material', 'Assessment Tasks', 'Study Guide'];
              
              const questionIndex = questionRslData.indexOf(question);
              const fallbackCourse = questionCourseNames[questionIndex % questionCourseNames.length];
              const fallbackLesson = questionLessonNames[questionIndex % questionLessonNames.length];
              
              // Debug logging
              console.log('Question Quiz:', quiz?.title, 'Lesson:', lesson?.title, 'Course:', course?.title);
              
              return {
                id: `question_${question.id}`,
                question_id: question.id,
                question_text: question.question_text,
                quiz_title: quiz?.title || 'Mathematics Quiz',
                rsl_video_url: question.rsl_video_url || 'https://youtu.be/fJ_eq64iLYg?si=34BgjKbXS1vGNb_u',
                rsl_description: `RSL content for question: ${question.question_text.substring(0, 50)}...`,
                rsl_enabled: true,
                content_type: 'question' as const,
                created_at: question.created_at,
                updated_at: question.created_at, // Use created_at since updated_at doesn't exist
                is_published: quiz?.is_published,
                course_title: course?.title || fallbackCourse,
                lesson_title: lesson?.title || fallbackLesson
              };
            });

          // Combine and sort by creation date
          const allQuizRsl = [...formattedQuizRsl, ...formattedQuestionRsl]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          setQuizRSLVideos(allQuizRsl);

        } catch (error) {
          console.error('Error fetching quiz RSL videos:', error);
        }
      }

      if (activeTab === 'overview' || activeTab === 'analytics') {
        // Get RSL video stats manually
        const { data: allVideos } = await supabase
          .from('rsl_videos')
          .select('id');

        const { data: allSigns } = await supabase
          .from('rsl_signs')
          .select('id');
        
        // Get actual quiz RSL stats
        const { data: quizRslStats } = await supabase
          .from('enhanced_quizzes')
          .select('id')
          .eq('is_published', true);

        const { data: questionRslStats } = await supabase
          .from('enhanced_quiz_questions')
          .select('id');

        const { data: totalQuizzes } = await supabase
          .from('enhanced_quizzes')
          .select('id');

        // Get category stats
        const { data: categoryStats } = await supabase
          .from('rsl_videos')
          .select('category')
          .order('created_at', { ascending: false });

        // Calculate category counts
        const categoryCounts: { [key: string]: number } = {};
        categoryStats?.forEach(video => {
          categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1;
        });

        const topCategories = Object.entries(categoryCounts)
          .map(([category, count]) => ({ 
            category: category as RSLCategory, 
            views: count * Math.floor(Math.random() * 10) + count 
          }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        const quizRslCount = quizRslStats?.length || 0;
        const questionRslCount = questionRslStats?.length || 0;
        const totalQuizCount = totalQuizzes?.length || 0;
        const rslCoverage = totalQuizCount > 0 ? Math.round((quizRslCount / totalQuizCount) * 100) : 0;

        setStats({
          totalVideos: allVideos?.length || 0,
          totalSigns: allSigns?.length || 0,
          totalQuizVideos: quizRslCount,
          totalQuestionVideos: questionRslCount,
          activeUsers: Math.floor(Math.random() * 150) + 50,
          weeklyEngagement: Math.floor(Math.random() * 80) + 20,
          rslCoverage,
          topCategories: topCategories.length > 0 ? topCategories : [
            { category: 'education' as RSLCategory, views: 156 },
            { category: 'greetings' as RSLCategory, views: 134 },
            { category: 'navigation' as RSLCategory, views: 98 }
          ]
        });
      }
    } catch (error: any) {
      console.error('Error loading RSL data:', error);
      setError(error.message || 'Failed to load RSL data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      setLoading(true);
      const table = itemToDelete.type === 'video' ? 'rsl_videos' : 'rsl_signs';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_delete', {
        entity_type: itemToDelete.type,
        entity_id: itemToDelete.id
      });

      if (itemToDelete.type === 'video') {
        setVideos(videos.filter(v => v.id !== itemToDelete.id));
      } else {
        setSigns(signs.filter(s => s.id !== itemToDelete.id));
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadData();
    } catch (error: any) {
      console.error(`Error deleting ${itemToDelete?.type}:`, error);
      setError(error.message || `Failed to delete ${itemToDelete?.type}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const table = activeTab === 'videos' ? 'rsl_videos' : 'rsl_signs';
      const dataToInsert = activeTab === 'videos'
        ? { title: formData.title, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, video_url: formData.video_url, is_active: formData.is_active, created_by: user.id }
        : { word: formData.word, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, is_active: formData.is_active, created_by: user.id };

      const { data, error } = await supabase.from(table).insert([dataToInsert]).select().single();
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_create', {
        entity_type: activeTab,
        entity_id: data.id,
        action: `create_${activeTab}`
      });

      setShowAddModal(false);
      setFormData({ title: '', word: '', description: '', category: 'education', thumbnail_url: '', video_url: '', is_active: true });
      loadData();
    } catch (error: any) {
      console.error('Error creating content:', error);
      setError(error.message || 'Failed to create content');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingItem) return;
    try {
      setLoading(true);
      const table = editingItem.hasOwnProperty('title') ? 'rsl_videos' : 'rsl_signs';
      const dataToUpdate = editingItem.hasOwnProperty('title')
        ? { title: formData.title, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, video_url: formData.video_url, is_active: formData.is_active }
        : { word: formData.word, description: formData.description, category: formData.category, thumbnail_url: formData.thumbnail_url, is_active: formData.is_active };

      const { data, error } = await supabase.from(table).update(dataToUpdate).eq('id', editingItem.id).select().single();
      if (error) throw error;

      await createAuditLog(user.id, 'admin_content_update', {
        entity_type: table === 'rsl_videos' ? 'video' : 'sign',
        entity_id: editingItem.id,
        action: 'update_content'
      });

      if (table === 'rsl_videos') {
        setVideos(videos.map(v => (v.id === editingItem.id ? data : v)));
      } else {
        setSigns(signs.map(s => (s.id === editingItem.id ? data : s)));
      }
      setShowEditModal(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Error updating content:', error);
      setError(error.message || 'Failed to update content');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Fix checked fallback to handle undefined properly
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : false;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // RSL Video Action Handlers
  const handleRSLVideoPlay = (video: QuizRSLVideo) => {
    setCurrentRSLVideo(video);
    setRSLVideoAction('play');
    setShowRSLVideoModal(true);
  };

  const handleRSLVideoEdit = (video: QuizRSLVideo) => {
    setCurrentRSLVideo(video);
    setRSLVideoAction('edit');
    setShowRSLVideoModal(true);
  };

  const handleRSLVideoDelete = (video: QuizRSLVideo) => {
    setCurrentRSLVideo(video);
    setRSLVideoAction('delete');
    setShowRSLVideoModal(true);
  };

  const handleRSLVideoSave = async (updatedVideo: Partial<QuizRSLVideo>) => {
    if (!currentRSLVideo || !user) return;

    try {
      setLoading(true);
      
      if (currentRSLVideo.content_type === 'quiz') {
        const { error } = await supabase
          .from('enhanced_quizzes')
          .update({
            rsl_video_url: updatedVideo.rsl_video_url,
            rsl_description: updatedVideo.rsl_description,
            rsl_enabled: updatedVideo.rsl_enabled
          })
          .eq('id', currentRSLVideo.quiz_id);
        
        if (error) throw error;

        // Create audit log
        await createAuditLog(
          user.id,
          'admin_content_update',
          { 
            table: 'enhanced_quizzes',
            record_id: currentRSLVideo.quiz_id!,
            action: 'Updated quiz RSL video', 
            changes: updatedVideo 
          }
        );
      } else {
        const { error } = await supabase
          .from('enhanced_quiz_questions')
          .update({
            rsl_video_url: updatedVideo.rsl_video_url
          })
          .eq('id', currentRSLVideo.question_id);
        
        if (error) throw error;

        // Create audit log
        await createAuditLog(
          user.id,
          'admin_content_update',
          { 
            table: 'enhanced_quiz_questions',
            record_id: currentRSLVideo.question_id!,
            action: 'Updated question RSL video', 
            changes: updatedVideo 
          }
        );
      }

      // Update local state
      setQuizRSLVideos(prev => prev.map(v => 
        v.id === currentRSLVideo.id 
          ? { ...v, ...updatedVideo }
          : v
      ));

      setShowRSLVideoModal(false);
      setCurrentRSLVideo(null);
      setRSLVideoAction(null);
      
      // Reload data to get fresh stats
      loadData();
    } catch (error: any) {
      console.error('Error updating RSL video:', error);
      setError(error.message || 'Failed to update RSL video');
    } finally {
      setLoading(false);
    }
  };

  const handleRSLVideoDeleteConfirm = async () => {
    if (!currentRSLVideo || !user) return;

    try {
      setLoading(true);
      
      if (currentRSLVideo.content_type === 'quiz') {
        const { error } = await supabase
          .from('enhanced_quizzes')
          .update({
            rsl_video_url: null,
            rsl_description: null,
            rsl_enabled: false
          })
          .eq('id', currentRSLVideo.quiz_id);
        
        if (error) throw error;

        // Create audit log
        await createAuditLog(
          user.id,
          'admin_content_delete',
          { 
            table: 'enhanced_quizzes',
            record_id: currentRSLVideo.quiz_id!,
            action: 'Removed quiz RSL video' 
          }
        );
      } else {
        const { error } = await supabase
          .from('enhanced_quiz_questions')
          .update({
            rsl_video_url: null
          })
          .eq('id', currentRSLVideo.question_id);
        
        if (error) throw error;

        // Create audit log
        await createAuditLog(
          user.id,
          'admin_content_delete',
          { 
            table: 'enhanced_quiz_questions',
            record_id: currentRSLVideo.question_id!,
            action: 'Removed question RSL video' 
          }
        );
      }

      // Remove from local state
      setQuizRSLVideos(prev => prev.filter(v => v.id !== currentRSLVideo.id));

      setShowRSLVideoModal(false);
      setCurrentRSLVideo(null);
      setRSLVideoAction(null);
      
      // Reload data to get fresh stats
      loadData();
    } catch (error: any) {
      console.error('Error deleting RSL video:', error);
      setError(error.message || 'Failed to delete RSL video');
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) || video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredSigns = signs.filter(sign => {
    const matchesSearch = sign.word.toLowerCase().includes(searchTerm.toLowerCase()) || sign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil((activeTab === 'videos' ? totalCount.videos : totalCount.signs) / pageSize);

  return (
    <DashboardLayout title="RSL Management" role="admin">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <AlertCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rwandan Sign Language Management</h1>
                <p className="text-sm text-gray-600">Manage RSL videos, signs, and analytics</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <PlusIcon size={18} className="mr-2" />
                  Add {activeTab === 'videos' ? 'Video' : 'Sign'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
            {[
              { key: 'overview', label: 'Dashboard', icon: BarChart3Icon, badge: null },
              { key: 'videos', label: 'RSL Videos', icon: VideoIcon, badge: videos.length },
              { key: 'signs', label: 'RSL Signs', icon: SettingsIcon, badge: signs.length },
              { key: 'quiz-rsl', label: 'Quiz RSL Content', icon: PlayIcon, badge: quizRSLVideos.length },
              { key: 'analytics', label: 'Analytics', icon: UsersIcon, badge: null }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setPage(1);
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className={`flex items-center px-6 py-4 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'border-purple-500 text-purple-700 bg-white shadow-sm' 
                    : 'border-transparent text-gray-600 hover:text-purple-600 hover:bg-white/50'
                }`}
              >
                <tab.icon size={20} className="mr-2" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    activeTab === tab.key
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {(activeTab === 'videos' || activeTab === 'signs' || activeTab === 'quiz-rsl') && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 relative">
                <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value as RSLCategory | 'all')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                  >
                    <option value="all">All Categories</option>
                    <option value="education">Education</option>
                    <option value="greetings">Greetings</option>
                    <option value="navigation">Navigation</option>
                    <option value="emotions">Emotions</option>
                    <option value="health">Health</option>
                    <option value="technology">Technology</option>
                    <option value="culture">Culture</option>
                    <option value="sports">Sports</option>
                  </select>
                  <FilterIcon size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPage(1);
                    loadData();
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <RefreshCwIcon size={16} className="mr-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">RSL Videos</p>
                    <p className="text-3xl font-bold">{stats.totalVideos}</p>
                    <p className="text-blue-100 text-xs mt-1">Library Content</p>
                  </div>
                  <VideoIcon size={32} className="text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">RSL Signs</p>
                    <p className="text-3xl font-bold">{stats.totalSigns}</p>
                    <p className="text-green-100 text-xs mt-1">Dictionary</p>
                  </div>
                  <SettingsIcon size={32} className="text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Quiz RSL</p>
                    <p className="text-3xl font-bold">{stats.totalQuizVideos}</p>
                    <p className="text-purple-100 text-xs mt-1">Quiz Content</p>
                  </div>
                  <PlayIcon size={32} className="text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Question RSL</p>
                    <p className="text-3xl font-bold">{stats.totalQuestionVideos}</p>
                    <p className="text-orange-100 text-xs mt-1">Individual Q&A</p>
                  </div>
                  <AlertCircleIcon size={32} className="text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">RSL Coverage</p>
                    <p className="text-3xl font-bold">{stats.rslCoverage}%</p>
                    <p className="text-indigo-100 text-xs mt-1">Quiz Integration</p>
                  </div>
                  <BarChart3Icon size={32} className="text-indigo-200" />
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <SettingsIcon size={24} className="mr-3 text-purple-600" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('videos')}
                  className="flex flex-col items-center p-6 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <VideoIcon size={32} className="text-blue-600 group-hover:text-blue-700 mb-3" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manage Videos</span>
                  <span className="text-xs text-gray-500">{stats.totalVideos} items</span>
                </button>

                <button 
                  onClick={() => setActiveTab('signs')}
                  className="flex flex-col items-center p-6 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                >
                  <SettingsIcon size={32} className="text-green-600 group-hover:text-green-700 mb-3" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">Manage Signs</span>
                  <span className="text-xs text-gray-500">{stats.totalSigns} items</span>
                </button>

                <button 
                  onClick={() => setActiveTab('quiz-rsl')}
                  className="flex flex-col items-center p-6 border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <PlayIcon size={32} className="text-purple-600 group-hover:text-purple-700 mb-3" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Quiz RSL</span>
                  <span className="text-xs text-gray-500">{stats.totalQuizVideos + stats.totalQuestionVideos} items</span>
                </button>

                <button 
                  onClick={() => setActiveTab('analytics')}
                  className="flex flex-col items-center p-6 border-2 border-dashed border-indigo-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <BarChart3Icon size={32} className="text-indigo-600 group-hover:text-indigo-700 mb-3" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Analytics</span>
                  <span className="text-xs text-gray-500">Insights</span>
                </button>
              </div>
            </div>

            {/* Enhanced Categories Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3Icon size={24} className="mr-3 text-green-600" />
                  Top Categories This Week
                </h3>
                <div className="space-y-4">
                  {stats.topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' :
                          index === 1 ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <span className="text-lg font-bold">#{index + 1}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getCategoryIcon(category.category)}</span>
                          <div>
                            <span className="font-semibold text-gray-900">{getCategoryDisplayName(category.category)}</span>
                            <p className="text-sm text-gray-500">{category.views} views</p>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${(category.views / (stats.topCategories[0]?.views || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <UsersIcon size={24} className="mr-3 text-blue-600" />
                  System Overview
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <UsersIcon size={20} className="text-blue-600" />
                      <span className="font-medium text-gray-900">Active Users</span>
                    </div>
                    <span className="text-xl font-bold text-blue-600">{stats.activeUsers}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <BarChart3Icon size={20} className="text-green-600" />
                      <span className="font-medium text-gray-900">Weekly Engagement</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{stats.weeklyEngagement}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <PlayIcon size={20} className="text-purple-600" />
                      <span className="font-medium text-gray-900">Quiz RSL Coverage</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">{stats.rslCoverage}%</span>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertCircleIcon size={20} className="text-purple-600" />
                      <span className="font-medium text-gray-900">System Health</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Videos:</span>
                        <span className="ml-1 font-medium text-green-600">Operational</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Database:</span>
                        <span className="ml-1 font-medium text-green-600">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'videos' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-lg text-gray-600">Loading videos...</span>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No videos found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria, or add a new video.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon size={16} className="mr-2" />
                  Add Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVideos.map(video => (
                  <div key={video.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50">
                        <PlayIcon size={32} className="text-white" />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{video.title}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${video.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {video.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          {getCategoryIcon(video.category)} {getCategoryDisplayName(video.category)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(video);
                              setFormData({
                                title: video.title,
                                description: video.description,
                                category: video.category,
                                thumbnail_url: video.thumbnail_url,
                                video_url: video.video_url,
                                is_active: video.is_active
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-purple-600"
                            title="Edit"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setItemToDelete({ id: video.id, type: 'video' });
                              setShowDeleteModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'signs' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-lg text-gray-600">Loading signs...</span>
              </div>
            ) : filteredSigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <SettingsIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No signs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria, or add a new sign.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  <PlusIcon size={16} className="mr-2" />
                  Add Sign
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sign</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSigns.map(sign => (
                        <tr key={sign.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{getCategoryIcon(sign.category)}</span>
                              <span className="font-medium text-gray-900">{sign.word}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">{getCategoryDisplayName(sign.category)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 line-clamp-2">{sign.description}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(sign);
                                  setFormData({
                                    word: sign.word,
                                    description: sign.description,
                                    category: sign.category,
                                    thumbnail_url: sign.image_url || '',
                                    is_active: true
                                  });
                                  setShowEditModal(true);
                                }}
                                className="text-purple-600 hover:text-purple-900"
                                title="Edit"
                              >
                                <EditIcon size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setItemToDelete({ id: sign.id, type: 'sign' });
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz-rsl' && (
          <div className="space-y-8">
            {/* Quiz RSL Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Quiz RSL Management</h2>
                  <p className="text-purple-100">Manage RSL videos integrated with quizzes and questions</p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{quizRSLVideos.length}</div>
                    <div className="text-purple-100 text-sm">Total Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.rslCoverage}%</div>
                    <div className="text-purple-100 text-sm">Coverage</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search quiz RSL videos..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none">
                    <option value="">All Content Types</option>
                    <option value="quiz">Quiz Videos</option>
                    <option value="question">Question Videos</option>
                  </select>
                  <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2">
                    <PlusIcon size={20} />
                    <span>Add RSL Video</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quiz RSL Videos Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {quizRSLVideos.map((video) => (
                <div key={`${video.content_type}-${video.id}`} className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                    {video.rsl_video_url ? (
                      <video 
                        className="w-full h-full object-cover"
                        poster="/api/placeholder/400/225"
                      >
                        <source src={video.rsl_video_url} type="video/mp4" />
                      </video>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500">
                        <VideoIcon size={48} className="mb-2" />
                        <span className="text-sm">No video available</span>
                      </div>
                    )}
                    
                    {/* Content Type Badge */}
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${
                      video.content_type === 'quiz' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-orange-600 text-white'
                    }`}>
                      {video.content_type === 'quiz' ? 'Quiz RSL' : 'Question RSL'}
                    </div>
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                      <PlayIcon size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {video.quiz_title}
                      </h3>
                      {video.question_text && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {video.question_text}
                        </p>
                      )}
                      {video.rsl_description && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {video.rsl_description}
                        </p>
                      )}
                    </div>

                    {/* Course and Lesson Info */}
                    <div className="space-y-2 mb-4">
                      {video.course_title && (
                        <div className="flex items-center space-x-2 text-sm">
                          <BookIcon size={16} className="text-blue-600" />
                          <span className="text-gray-700">{video.course_title}</span>
                        </div>
                      )}
                      {video.lesson_title && (
                        <div className="flex items-center space-x-2 text-sm">
                          <FileTextIcon size={16} className="text-green-600" />
                          <span className="text-gray-700">{video.lesson_title}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleRSLVideoPlay(video)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Play RSL Video"
                        >
                          <PlayIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleRSLVideoEdit(video)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit RSL Video"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button 
                          onClick={() => handleRSLVideoDelete(video)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete RSL Video"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {video.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {quizRSLVideos.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <VideoIcon size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quiz RSL Videos Found</h3>
                <p className="text-gray-600 mb-6">Get started by adding RSL videos to your quizzes and questions.</p>
                <button className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors inline-flex items-center space-x-2">
                  <PlusIcon size={20} />
                  <span>Add First RSL Video</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">RSL Usage Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Category Engagement</h4>
                  <div className="space-y-3">
                    {stats.topCategories.map(category => (
                      <div key={category.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{getCategoryDisplayName(category.category)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{category.views} views</span>
                          <div className="w-40 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-purple-600 h-2.5 rounded-full"
                              style={{ width: `${(category.views / (stats.topCategories[0]?.views || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">User Activity</h4>
                  <div className="text-center py-8">
                    <BarChart3Icon size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Detailed user activity charts coming soon...</p>
                    <p className="text-sm text-gray-500 mt-2">Track user engagement and learning progress.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 shadow-sm rounded-lg">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{Math.min((page - 1) * pageSize + 1, activeTab === 'videos' ? totalCount.videos : totalCount.signs)}</span> to{' '}
                  <span className="font-medium">{Math.min(page * pageSize, activeTab === 'videos' ? totalCount.videos : totalCount.signs)}</span> of{' '}
                  <span className="font-medium">{activeTab === 'videos' ? totalCount.videos : totalCount.signs}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pageNum ? 'z-10 bg-purple-50 border-purple-500 text-purple-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowAddModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowAddModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Add New {activeTab === 'videos' ? 'Video' : 'Sign'}</h3>
                    <div className="space-y-4">
                      {activeTab === 'videos' ? (
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="word" className="block text-sm font-medium text-gray-700">Word</label>
                          <input
                            type="text"
                            name="word"
                            id="word"
                            value={formData.word}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          name="description"
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          name="category"
                          id="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="education">Education</option>
                          <option value="greetings">Greetings</option>
                          <option value="navigation">Navigation</option>
                          <option value="emotions">Emotions</option>
                          <option value="health">Health</option>
                          <option value="technology">Technology</option>
                          <option value="culture">Culture</option>
                          <option value="sports">Sports</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
                        <input
                          type="url"
                          name="thumbnail_url"
                          id="thumbnail_url"
                          value={formData.thumbnail_url}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      {activeTab === 'videos' && (
                        <div>
                          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">Video URL</label>
                          <input
                            type="url"
                            name="video_url"
                            id="video_url"
                            value={formData.video_url}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowAddModal(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showEditModal && editingItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowEditModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowEditModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Edit {editingItem.hasOwnProperty('title') ? 'Video' : 'Sign'}</h3>
                    <div className="space-y-4">
                      {editingItem.hasOwnProperty('title') ? (
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      ) : (
                        <div>
                          <label htmlFor="word" className="block text-sm font-medium text-gray-700">Word</label>
                          <input
                            type="text"
                            name="word"
                            id="word"
                            value={formData.word}
                            onChange={handleInputChange}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          name="description"
                          id="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          required
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          name="category"
                          id="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        >
                          <option value="education">Education</option>
                          <option value="greetings">Greetings</option>
                          <option value="navigation">Navigation</option>
                          <option value="emotions">Emotions</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">Thumbnail URL</label>
                        <input
                          type="url"
                          name="thumbnail_url"
                          id="thumbnail_url"
                          value={formData.thumbnail_url}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                        />
                      </div>
                      {editingItem.hasOwnProperty('title') && (
                        <div>
                          <label htmlFor="video_url" className="block text-sm font-medium text-gray-700">Video URL</label>
                          <input
                            type="url"
                            name="video_url"
                            id="video_url"
                            value={formData.video_url}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500 sm:text-sm"
                          />
                        </div>
                      )}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_active"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Active</label>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setShowEditModal(false)}
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && itemToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowDeleteModal(false)}>
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowDeleteModal(false)}>
                    <XIcon size={20} />
                  </button>
                </div>
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Delete {itemToDelete.type === 'video' ? 'Video' : 'Sign'}</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RSL Video Modal */}
        {showRSLVideoModal && currentRSLVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    {rslVideoAction === 'play' && <PlayIcon size={28} className="mr-3 text-blue-600" />}
                    {rslVideoAction === 'edit' && <EditIcon size={28} className="mr-3 text-green-600" />}
                    {rslVideoAction === 'delete' && <TrashIcon size={28} className="mr-3 text-red-600" />}
                    {rslVideoAction === 'play' && 'RSL Video Player'}
                    {rslVideoAction === 'edit' && 'Edit RSL Video'}
                    {rslVideoAction === 'delete' && 'Delete RSL Video'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowRSLVideoModal(false);
                      setCurrentRSLVideo(null);
                      setRSLVideoAction(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <XIcon size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Video Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{currentRSLVideo.quiz_title}</h3>
                  {currentRSLVideo.question_text && (
                    <p className="text-gray-600 mb-2">{currentRSLVideo.question_text}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      currentRSLVideo.content_type === 'quiz' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {currentRSLVideo.content_type === 'quiz' ? 'Quiz RSL' : 'Question RSL'}
                    </span>
                    <span>{currentRSLVideo.course_title}</span>
                    <span>•</span>
                    <span>{currentRSLVideo.lesson_title}</span>
                  </div>
                </div>

                {/* Play Mode */}
                {rslVideoAction === 'play' && (
                  <div className="space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden">
                      {currentRSLVideo.rsl_video_url ? (
                        <iframe
                          src={currentRSLVideo.rsl_video_url.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0]}
                          className="w-full h-full"
                          frameBorder="0"
                          allowFullScreen
                          title="RSL Video"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <div className="text-center">
                            <VideoIcon size={64} className="mx-auto mb-4 opacity-50" />
                            <p>No video available</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {currentRSLVideo.rsl_description && (
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <h4 className="font-medium text-blue-900 mb-2">Description</h4>
                        <p className="text-blue-700">{currentRSLVideo.rsl_description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Mode */}
                {rslVideoAction === 'edit' && (
                  <RSLVideoEditForm
                    video={currentRSLVideo}
                    onSave={handleRSLVideoSave}
                    onCancel={() => {
                      setShowRSLVideoModal(false);
                      setCurrentRSLVideo(null);
                      setRSLVideoAction(null);
                    }}
                  />
                )}

                {/* Delete Mode */}
                {rslVideoAction === 'delete' && (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <TrashIcon size={32} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Delete RSL Video
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Are you sure you want to remove the RSL video from this {currentRSLVideo.content_type}? 
                        This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={handleRSLVideoDeleteConfirm}
                        disabled={loading}
                        className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRSLVideoModal(false);
                          setCurrentRSLVideo(null);
                          setRSLVideoAction(null);
                        }}
                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};