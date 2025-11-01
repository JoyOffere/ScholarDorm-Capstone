import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Save, Upload, FileText, Video, Image, 
  BookOpen, Clock, Users, Target, Link, Settings, X, Eye
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Course {
  id: string;
  title: string;
}

interface CourseSection {
  id: string;
  title: string;
  course_id: string;
}

interface ContentFormData {
  title: string;
  description: string;
  content_type: 'video' | 'document' | 'image' | 'audio' | 'text' | 'interactive';
  course_id: string;
  course_section_id: string;
  content_url: string;
  content_text: string;
  estimated_duration_minutes: number;
  is_published: boolean;
  order_index: number;
  prerequisites: string[];
  learning_objectives: string[];
  tags: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  rsl_video_url: string;
  rsl_description: string;
  thumbnail_url: string;
}

export const TeacherContentCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseSections, setCourseSections] = useState<CourseSection[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'settings' | 'accessibility'>('basic');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    content_type: 'text',
    course_id: '',
    course_section_id: '',
    content_url: '',
    content_text: '',
    estimated_duration_minutes: 15,
    is_published: false,
    order_index: 1,
    prerequisites: [],
    learning_objectives: [''],
    tags: [],
    difficulty_level: 'beginner',
    rsl_video_url: '',
    rsl_description: '',
    thumbnail_url: ''
  });

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('teacher_course_assignments')
          .select(`
            course_id,
            courses!inner(id, title)
          `)
          .eq('teacher_id', user.id);

        if (error) throw error;

        const courseList = data?.map((item: any) => ({
          id: item.courses.id,
          title: item.courses.title
        })) || [];

        setCourses(courseList);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, [user]);

  // Fetch course sections when course is selected
  useEffect(() => {
    const fetchCourseSections = async () => {
      if (!formData.course_id) {
        setCourseSections([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('course_sections')
          .select('id, title, course_id')
          .eq('course_id', formData.course_id)
          .order('order_index');

        if (error) throw error;

        setCourseSections(data || []);
      } catch (error) {
        console.error('Error fetching course sections:', error);
      }
    };

    fetchCourseSections();
  }, [formData.course_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayInputChange = (field: keyof ContentFormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof ContentFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof ContentFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleFileUpload = async (file: File, type: 'content' | 'thumbnail') => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `content/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Supabase JS storage upload does not expose browser progress callbacks; mark upload as complete
      setUploadProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);

      if (type === 'content') {
        setFormData(prev => ({ ...prev, content_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      }

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.course_id || !formData.course_section_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.content_type !== 'text' && !formData.content_url) {
      alert('Please provide content URL or upload a file');
      return;
    }

    if (formData.content_type === 'text' && !formData.content_text) {
      alert('Please provide text content');
      return;
    }

    setIsLoading(true);

    try {
      // First create the lesson
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          title: formData.title,
          description: formData.description,
          content_type: formData.content_type,
          course_section_id: formData.course_section_id,
          content_url: formData.content_url || null,
          content_text: formData.content_text || null,
          estimated_duration_minutes: formData.estimated_duration_minutes,
          is_published: formData.is_published,
          order_index: formData.order_index,
          difficulty_level: formData.difficulty_level,
          rsl_video_url: formData.rsl_video_url || null,
          rsl_description: formData.rsl_description || null,
          thumbnail_url: formData.thumbnail_url || null
        })
        .select()
        .single();

      if (lessonError) throw lessonError;

      // Add learning objectives
      if (formData.learning_objectives.length > 0 && formData.learning_objectives[0]) {
        const objectives = formData.learning_objectives
          .filter(obj => obj.trim())
          .map(objective => ({
            lesson_id: lesson.id,
            objective: objective.trim()
          }));

        if (objectives.length > 0) {
          const { error: objectivesError } = await supabase
            .from('lesson_objectives')
            .insert(objectives);

          if (objectivesError) console.warn('Error adding objectives:', objectivesError);
        }
      }

      // Add prerequisites if any
      if (formData.prerequisites.length > 0) {
        const prereqs = formData.prerequisites
          .filter(prereq => prereq.trim())
          .map(prerequisite_id => ({
            lesson_id: lesson.id,
            prerequisite_id
          }));

        if (prereqs.length > 0) {
          const { error: prereqsError } = await supabase
            .from('lesson_prerequisites')
            .insert(prereqs);

          if (prereqsError) console.warn('Error adding prerequisites:', prereqsError);
        }
      }

      // Add tags
      if (formData.tags.length > 0) {
        const tagEntries = formData.tags.map(tag => ({
          lesson_id: lesson.id,
          tag: tag.trim()
        }));

        const { error: tagsError } = await supabase
          .from('lesson_tags')
          .insert(tagEntries);

        if (tagsError) console.warn('Error adding tags:', tagsError);
      }

      alert('Content created successfully!');
      navigate('/teacher/content');
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentTypeFields = () => {
    switch (formData.content_type) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Content *
            </label>
            <textarea
              name="content_text"
              value={formData.content_text}
              onChange={handleInputChange}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your lesson content here..."
              required={formData.content_type === 'text'}
            />
          </div>
        );
      
      case 'video':
      case 'audio':
      case 'document':
      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.content_type.charAt(0).toUpperCase() + formData.content_type.slice(1)} URL
              </label>
              <input
                type="url"
                name="content_url"
                value={formData.content_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${formData.content_type} URL or upload file below`}
              />
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Upload {formData.content_type} file
                </p>
                <input
                  type="file"
                  accept={
                    formData.content_type === 'video' ? 'video/*' :
                    formData.content_type === 'audio' ? 'audio/*' :
                    formData.content_type === 'image' ? 'image/*' :
                    formData.content_type === 'document' ? '.pdf,.doc,.docx,.txt' : '*'
                  }
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'content');
                  }}
                  className="mt-2"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{Math.round(uploadProgress)}% uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardLayout role="teacher" title="Create Content">
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/teacher/content')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Content</h1>
                <p className="text-gray-600">Add learning materials to your courses</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'basic', label: 'Basic Info', icon: Settings },
                  { id: 'content', label: 'Content', icon: FileText },
                  { id: 'settings', label: 'Settings', icon: Target },
                  { id: 'accessibility', label: 'Accessibility', icon: Eye }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Content Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter content title"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what students will learn"
                      />
                    </div>

                    <div>
                      <label htmlFor="content_type" className="block text-sm font-medium text-gray-700 mb-1">
                        Content Type *
                      </label>
                      <select
                        id="content_type"
                        name="content_type"
                        value={formData.content_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="text">Text Content</option>
                        <option value="video">Video</option>
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="audio">Audio</option>
                        <option value="interactive">Interactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Course Assignment</h3>
                    
                    <div>
                      <label htmlFor="course_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Course *
                      </label>
                      <select
                        id="course_id"
                        name="course_id"
                        value={formData.course_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a course</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="course_section_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Course Section *
                      </label>
                      <select
                        id="course_section_id"
                        name="course_section_id"
                        value={formData.course_section_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!formData.course_id}
                      >
                        <option value="">Select a section</option>
                        {courseSections.map(section => (
                          <option key={section.id} value={section.id}>
                            {section.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700 mb-1">
                        Difficulty Level
                      </label>
                      <select
                        id="difficulty_level"
                        name="difficulty_level"
                        value={formData.difficulty_level}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">Content Details</h3>
                
                {renderContentTypeFields()}

                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="url"
                      name="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter thumbnail URL"
                    />
                    <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                      <Upload size={16} className="inline mr-2" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'thumbnail');
                        }}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                  {formData.thumbnail_url && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnail_url}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learning Settings</h3>
                    
                    <div>
                      <label htmlFor="estimated_duration_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="estimated_duration_minutes"
                        name="estimated_duration_minutes"
                        value={formData.estimated_duration_minutes}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="order_index" className="block text-sm font-medium text-gray-700 mb-1">
                        Order Index
                      </label>
                      <input
                        type="number"
                        id="order_index"
                        name="order_index"
                        value={formData.order_index}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                        Publish immediately
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
                    
                    {formData.learning_objectives.map((objective, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={objective}
                          onChange={(e) => handleArrayInputChange('learning_objectives', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Learning objective ${index + 1}`}
                        />
                        {formData.learning_objectives.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeArrayItem('learning_objectives', index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => addArrayItem('learning_objectives')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} />
                      <span>Add Learning Objective</span>
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags.join(', ')}
                        onChange={(e) => handleTagsChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="mathematics, algebra, equations"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Accessibility Tab */}
            {activeTab === 'accessibility' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <h3 className="text-lg font-semibold text-gray-900">RSL Accessibility Support</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="rsl_video_url" className="block text-sm font-medium text-gray-700 mb-1">
                      RSL Video URL
                    </label>
                    <input
                      type="url"
                      id="rsl_video_url"
                      name="rsl_video_url"
                      value={formData.rsl_video_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/rsl-video.mp4"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="rsl_description" className="block text-sm font-medium text-gray-700 mb-1">
                      RSL Description
                    </label>
                    <textarea
                      id="rsl_description"
                      name="rsl_description"
                      value={formData.rsl_description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the RSL content and signs used"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">RSL Accessibility Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Provide clear RSL video demonstrations for key concepts</li>
                    <li>• Include descriptions of signs and gestures used</li>
                    <li>• Ensure video quality is sufficient for sign visibility</li>
                    <li>• Consider lighting and background for optimal sign visibility</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/teacher/content')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                {activeTab !== 'accessibility' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'content', 'settings', 'accessibility'];
                      const currentIndex = tabs.indexOf(activeTab);
                      if (currentIndex < tabs.length - 1) {
                        setActiveTab(tabs[currentIndex + 1] as any);
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Next
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  <span>{isLoading ? 'Creating...' : 'Create Content'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};