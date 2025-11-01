import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Upload, Play, Save, Eye, Video, Image, FileText,
  Plus, Trash2, Check, AlertCircle, Hand, Volume2, Subtitles,
  Clock, Users, BookOpen, Star, Search, Filter, Download, X
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface RSLContent {
  id: string;
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  video_url?: string;
  thumbnail_url?: string;
  sign_description: string;
  related_words: string[];
  practice_tips: string[];
  common_mistakes: string[];
  usage_examples: string[];
  created_at: string;
  is_published: boolean;
  view_count: number;
  lesson_id?: string;
}

interface RSLLesson {
  id: string;
  title: string;
  course_id: string;
  course: {
    title: string;
  };
}

interface ContentFormData {
  title: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  sign_description: string;
  related_words: string[];
  practice_tips: string[];
  common_mistakes: string[];
  usage_examples: string[];
  lesson_id: string;
}

const RSL_CATEGORIES = [
  'Basic Greetings',
  'Family & Relationships',
  'Education',
  'Food & Drink',
  'Transportation',
  'Health & Medical',
  'Work & Professions',
  'Time & Calendar',
  'Numbers & Mathematics',
  'Colors & Descriptions',
  'Animals',
  'Nature & Weather',
  'Sports & Recreation',
  'Technology',
  'Government & Politics',
  'Religion & Culture',
  'Emotions & Feelings',
  'Daily Activities'
];

export const TeacherRSLContentCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [existingContent, setExistingContent] = useState<RSLContent[]>([]);
  const [rslLessons, setRslLessons] = useState<RSLLesson[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    difficulty_level: 'beginner',
    category: '',
    sign_description: '',
    related_words: [],
    practice_tips: [],
    common_mistakes: [],
    usage_examples: [],
    lesson_id: ''
  });

  const [managementFilters, setManagementFilters] = useState({
    search: '',
    category: 'all',
    difficulty: 'all',
    status: 'all'
  });

  const [newRelatedWord, setNewRelatedWord] = useState('');
  const [newPracticeTip, setNewPracticeTip] = useState('');
  const [newCommonMistake, setNewCommonMistake] = useState('');
  const [newUsageExample, setNewUsageExample] = useState('');

  useEffect(() => {
    fetchRSLLessons();
    fetchExistingContent();
  }, [user]);

  const fetchRSLLessons = async () => {
    if (!user) return;

    try {
      // Get teacher's courses with RSL content
      const { data, error } = await supabase
        .from('teacher_course_assignments')
        .select(`
          course_id,
          courses!inner(
            id,
            title,
            course_sections!inner(
              id,
              lessons!inner(
                id,
                title,
                lesson_type
              )
            )
          )
        `)
        .eq('teacher_id', user.id)
        .eq('courses.course_sections.lessons.lesson_type', 'rsl');

      if (error) throw error;

      const lessons: RSLLesson[] = [];
      data?.forEach((assignment: any) => {
        // Supabase may return the joined 'courses' as an array or as an object depending on the query shape.
        // Normalize to a single course object (use the first if it's an array).
        const course = Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses;
        if (!course || !course.course_sections) return;

        course.course_sections.forEach((section: any) => {
          section.lessons.forEach((lesson: any) => {
            lessons.push({
              id: lesson.id,
              title: lesson.title,
              course_id: course.id,
              course: {
                title: course.title
              }
            });
          });
        });
      });

      setRslLessons(lessons);
    } catch (error) {
      console.error('Error fetching RSL lessons:', error);
    }
  };

  const fetchExistingContent = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get RSL content for teacher's lessons
      const { data: teacherCourses } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      const courseIds = teacherCourses?.map(tc => tc.course_id) || [];

      // Early return if no courses assigned
      if (courseIds.length === 0) {
        setExistingContent([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('rsl_content')
        .select(`
          id,
          title,
          description,
          difficulty_level,
          category,
          video_url,
          thumbnail_url,
          sign_description,
          related_words,
          practice_tips,
          common_mistakes,
          usage_examples,
          created_at,
          is_published,
          view_count,
          lesson_id,
          lessons!inner(
            id,
            title,
            course_sections!inner(
              course_id
            )
          )
        `)
        .in('lessons.course_sections.course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExistingContent(data || []);
    } catch (error) {
      console.error('Error fetching existing RSL content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    }
  };

  const addToArray = (arrayName: keyof Pick<ContentFormData, 'related_words' | 'practice_tips' | 'common_mistakes' | 'usage_examples'>, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()]
      }));
      
      // Clear the corresponding input
      switch (arrayName) {
        case 'related_words':
          setNewRelatedWord('');
          break;
        case 'practice_tips':
          setNewPracticeTip('');
          break;
        case 'common_mistakes':
          setNewCommonMistake('');
          break;
        case 'usage_examples':
          setNewUsageExample('');
          break;
      }
    }
  };

  const removeFromArray = (arrayName: keyof Pick<ContentFormData, 'related_words' | 'practice_tips' | 'common_mistakes' | 'usage_examples'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user || !formData.title || !formData.description || !formData.lesson_id) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      let videoUrl = null;
      let thumbnailUrl = null;

      // Upload video if provided
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'rsl-videos');
        if (!videoUrl) {
          alert('Failed to upload video');
          return;
        }
      }

      // Upload thumbnail if provided
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'rsl-thumbnails');
        if (!thumbnailUrl) {
          alert('Failed to upload thumbnail');
          return;
        }
      }

      // Create RSL content
      const { error } = await supabase
        .from('rsl_content')
        .insert({
          title: formData.title,
          description: formData.description,
          difficulty_level: formData.difficulty_level,
          category: formData.category,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          sign_description: formData.sign_description,
          related_words: formData.related_words,
          practice_tips: formData.practice_tips,
          common_mistakes: formData.common_mistakes,
          usage_examples: formData.usage_examples,
          lesson_id: formData.lesson_id,
          is_published: !isDraft,
          created_by: user.id
        });

      if (error) throw error;

      // Reset form
      setFormData({
        title: '',
        description: '',
        difficulty_level: 'beginner',
        category: '',
        sign_description: '',
        related_words: [],
        practice_tips: [],
        common_mistakes: [],
        usage_examples: [],
        lesson_id: ''
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setVideoPreview(null);
      setThumbnailPreview(null);

      // Refresh content list
      fetchExistingContent();

      alert(isDraft ? 'RSL content saved as draft!' : 'RSL content published successfully!');
    } catch (error) {
      console.error('Error creating RSL content:', error);
      alert('Failed to create RSL content');
    } finally {
      setSaving(false);
    }
  };

  const togglePublishStatus = async (contentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rsl_content')
        .update({ is_published: !currentStatus })
        .eq('id', contentId);

      if (error) throw error;

      fetchExistingContent();
    } catch (error) {
      console.error('Error updating publish status:', error);
      alert('Failed to update publish status');
    }
  };

  const deleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this RSL content?')) return;

    try {
      const { error } = await supabase
        .from('rsl_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      fetchExistingContent();
      alert('RSL content deleted successfully');
    } catch (error) {
      console.error('Error deleting RSL content:', error);
      alert('Failed to delete RSL content');
    }
  };

  const filteredContent = existingContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(managementFilters.search.toLowerCase()) ||
                         content.description.toLowerCase().includes(managementFilters.search.toLowerCase());
    const matchesCategory = managementFilters.category === 'all' || content.category === managementFilters.category;
    const matchesDifficulty = managementFilters.difficulty === 'all' || content.difficulty_level === managementFilters.difficulty;
    const matchesStatus = managementFilters.status === 'all' || 
                         (managementFilters.status === 'published' && content.is_published) ||
                         (managementFilters.status === 'draft' && !content.is_published);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  return (
    <DashboardLayout role="teacher" title="RSL Content Creation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher/rsl')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RSL Content Creation</h1>
              <p className="text-gray-600">Create and manage Rwandan Sign Language content</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Plus size={16} />
                <span>Create Content</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen size={16} />
                <span>Manage Content ({existingContent.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Create Content Tab */}
        {activeTab === 'create' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter sign title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the sign and its meaning"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        value={formData.difficulty_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {RSL_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson *
                    </label>
                    <select
                      value={formData.lesson_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, lesson_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select RSL Lesson</option>
                      {rslLessons.map(lesson => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.course.title} - {lesson.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Media Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Media Content</h3>
                  
                  {/* Video Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sign Video
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {videoPreview ? (
                        <div className="space-y-2">
                          <video
                            src={videoPreview}
                            controls
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setVideoFile(null);
                              setVideoPreview(null);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove Video
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                          />
                          <div className="text-center">
                            <Video className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload sign video
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thumbnail Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {thumbnailPreview ? (
                        <div className="space-y-2">
                          <img
                            src={thumbnailPreview}
                            alt="Thumbnail"
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            onClick={() => {
                              setThumbnailFile(null);
                              setThumbnailPreview(null);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove Thumbnail
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            className="hidden"
                          />
                          <div className="text-center">
                            <Image className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              Click to upload thumbnail
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sign Description
                </label>
                <textarea
                  value={formData.sign_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, sign_description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe how to perform this sign (hand movements, position, etc.)"
                />
              </div>

              {/* Related Words */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Related Words
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newRelatedWord}
                      onChange={(e) => setNewRelatedWord(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add related word"
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('related_words', newRelatedWord)}
                    />
                    <button
                      onClick={() => addToArray('related_words', newRelatedWord)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.related_words.map((word, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {word}
                        <button
                          onClick={() => removeFromArray('related_words', index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Practice Tips */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Practice Tips
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newPracticeTip}
                      onChange={(e) => setNewPracticeTip(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add practice tip"
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('practice_tips', newPracticeTip)}
                    />
                    <button
                      onClick={() => addToArray('practice_tips', newPracticeTip)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.practice_tips.map((tip, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-green-50 rounded border"
                      >
                        <span className="text-sm text-green-800">{tip}</span>
                        <button
                          onClick={() => removeFromArray('practice_tips', index)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Mistakes
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newCommonMistake}
                      onChange={(e) => setNewCommonMistake(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add common mistake"
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('common_mistakes', newCommonMistake)}
                    />
                    <button
                      onClick={() => addToArray('common_mistakes', newCommonMistake)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.common_mistakes.map((mistake, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-red-50 rounded border"
                      >
                        <span className="text-sm text-red-800">{mistake}</span>
                        <button
                          onClick={() => removeFromArray('common_mistakes', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usage Examples */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage Examples
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newUsageExample}
                      onChange={(e) => setNewUsageExample(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add usage example"
                      onKeyPress={(e) => e.key === 'Enter' && addToArray('usage_examples', newUsageExample)}
                    />
                    <button
                      onClick={() => addToArray('usage_examples', newUsageExample)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {formData.usage_examples.map((example, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-purple-50 rounded border"
                      >
                        <span className="text-sm text-purple-800">{example}</span>
                        <button
                          onClick={() => removeFromArray('usage_examples', index)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  <Eye size={16} />
                  <span>Preview</span>
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{isSaving ? 'Saving...' : 'Save as Draft'}</span>
                  </button>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Upload size={16} />
                    <span>{isSaving ? 'Publishing...' : 'Publish'}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Manage Content Tab */}
        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={managementFilters.search}
                      onChange={(e) => setManagementFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search content..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={managementFilters.category}
                    onChange={(e) => setManagementFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {RSL_CATEGORIES.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={managementFilters.difficulty}
                    onChange={(e) => setManagementFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={managementFilters.status}
                    onChange={(e) => setManagementFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  RSL Content ({filteredContent.length})
                </h3>
              </div>

              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading RSL content...</p>
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="p-12 text-center">
                  <Hand className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No RSL Content Found</h3>
                  <p className="text-gray-600">
                    {existingContent.length === 0 
                      ? "You haven't created any RSL content yet."
                      : "No content matches your current filters."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {filteredContent.map((content) => (
                    <div key={content.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {content.thumbnail_url && (
                        <img
                          src={content.thumbnail_url}
                          alt={content.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 truncate">{content.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            content.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {content.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {content.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span className="capitalize">{content.difficulty_level}</span>
                          <span>{content.category}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                          <div className="flex items-center space-x-1">
                            <Eye size={12} />
                            <span>{content.view_count} views</span>
                          </div>
                          <span>{new Date(content.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => togglePublishStatus(content.id, content.is_published)}
                            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                              content.is_published
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                          >
                            {content.is_published ? (
                              <>
                                <AlertCircle size={12} />
                                <span>Unpublish</span>
                              </>
                            ) : (
                              <>
                                <Check size={12} />
                                <span>Publish</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => deleteContent(content.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-sm"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};