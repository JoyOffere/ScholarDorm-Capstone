import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Save, Upload, BookOpen, Users, 
  Target, Settings, Clock, Tag, X, Eye, FileText,
  Calendar, Globe, Shield, Star
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface CourseSection {
  id?: string;
  title: string;
  description: string;
  order_index: number;
}

interface CourseFormData {
  title: string;
  description: string;
  category: string; // Maps to subject in database
  level: 'beginner' | 'intermediate' | 'advanced'; // Maps to difficulty_level
  estimated_duration_hours: number; // Converted to duration_minutes
  is_published: boolean; // Maps to is_active
  thumbnail_url: string; // Maps to image_url
  prerequisites: string[]; // Stored as JSONB
  learning_objectives: string[]; // Stored as JSONB
  tags: string[]; // Optional field for future use
  sections: CourseSection[];
}

export const TeacherCourseCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'settings' | 'preview'>('basic');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: 'Mathematics',
    level: 'beginner',
    estimated_duration_hours: 10,
    is_published: false,
    thumbnail_url: '',
    prerequisites: [],
    learning_objectives: [''],
    tags: [],
    sections: [
      {
        title: '',
        description: '',
        order_index: 1
      }
    ]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              name === 'estimated_duration_hours' ? parseFloat(value) || 0 : value
    }));
  };

  const handleArrayInputChange = (field: keyof CourseFormData, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: keyof CourseFormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), '']
    }));
  };

  const removeArrayItem = (field: keyof CourseFormData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSectionChange = (index: number, field: keyof CourseSection, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, {
        title: '',
        description: '',
        order_index: prev.sections.length + 1
      }]
    }));
  };

  const removeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
        .map((section, i) => ({ ...section, order_index: i + 1 }))
    }));
  };

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleThumbnailUpload = async (file: File) => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `course-thumbnail-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `course-thumbnails/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-content')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-content')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      alert('Thumbnail uploaded successfully!');
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.sections.some(section => !section.title || !section.description)) {
      alert('Please complete all course sections');
      return;
    }

    if (formData.learning_objectives.filter(obj => obj.trim()).length === 0) {
      alert('Please add at least one learning objective');
      return;
    }

    setIsLoading(true);

    try {
      // Create the course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          description: formData.description,
          image_url: formData.thumbnail_url,
          difficulty_level: formData.level,
          subject: formData.category,
          duration_minutes: formData.estimated_duration_hours * 60, // Convert hours to minutes
          prerequisites: formData.prerequisites.filter(p => p.trim()), // Store as JSONB array
          learning_objectives: formData.learning_objectives.filter(obj => obj.trim()), // Store as JSONB array
          is_active: formData.is_published,
          created_by: user!.id
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Assign teacher to course
      const { error: assignmentError } = await supabase
        .from('teacher_course_assignments')
        .insert({
          teacher_id: user!.id,
          course_id: course.id,
          assigned_at: new Date().toISOString()
        });

      if (assignmentError) throw assignmentError;

      // Create course sections
      if (formData.sections.length > 0) {
        const sectionsToCreate = formData.sections.map(section => ({
          course_id: course.id,
          title: section.title,
          description: section.description,
          order_index: section.order_index
        }));

        const { error: sectionsError } = await supabase
          .from('course_sections')
          .insert(sectionsToCreate);

        if (sectionsError) throw sectionsError;
      }

      // Learning objectives and prerequisites are now stored as JSONB in the courses table
      // Tags could be stored in course categories or handled separately if needed

      alert('Course created successfully!');
      navigate('/teacher/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: BookOpen },
    { id: 'content', label: 'Content & Structure', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <DashboardLayout role="teacher" title="Create Course">
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/teacher/courses')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
                <p className="text-gray-600">Build a comprehensive learning experience for your students</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map(({ id, label, icon: Icon }) => (
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
                    <h3 className="text-lg font-semibold text-gray-900">Course Information</h3>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Course Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter course title"
                        required
                      />
                    </div>



                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Detailed course description"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Course Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Science">Science</option>
                          <option value="Language">Language</option>
                          <option value="Technology">Technology</option>
                          <option value="Arts">Arts</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                          Level
                        </label>
                        <select
                          id="level"
                          name="level"
                          value={formData.level}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">

                      <div>
                        <label htmlFor="estimated_duration_hours" className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (hours)
                        </label>
                        <input
                          type="number"
                          id="estimated_duration_hours"
                          name="estimated_duration_hours"
                          value={formData.estimated_duration_hours}
                          onChange={handleInputChange}
                          min="1"
                          step="0.5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Thumbnail Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Thumbnail
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
                              if (file) handleThumbnailUpload(file);
                            }}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                      </div>
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
                      {formData.thumbnail_url && (
                        <div className="mt-2">
                          <img
                            src={formData.thumbnail_url}
                            alt="Course thumbnail"
                            className="w-32 h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Content & Structure Tab */}
            {activeTab === 'content' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Learning Objectives */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Objectives</h3>
                    {formData.learning_objectives.map((objective, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-3">
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
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Prerequisites</h3>
                    {formData.prerequisites.map((prerequisite, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-3">
                        <input
                          type="text"
                          value={prerequisite}
                          onChange={(e) => handleArrayInputChange('prerequisites', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={`Prerequisite ${index + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem('prerequisites', index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addArrayItem('prerequisites')}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} />
                      <span>Add Prerequisite</span>
                    </button>
                  </div>
                </div>

                {/* Course Sections */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Course Sections</h3>
                    <button
                      type="button"
                      onClick={addSection}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Add Section</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.sections.map((section, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Section {index + 1}</span>
                          {formData.sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSection(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Section title"
                          />
                          <textarea
                            value={section.description}
                            onChange={(e) => handleSectionChange(index, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Section description"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="mathematics, algebra, equations, rsl"
                  />
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Publishing Settings</h3>
                  
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
                      Make course active immediately
                    </label>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-medium text-blue-900 mb-2">Publishing Guidelines</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure course content is complete and reviewed</li>
                      <li>• Add clear learning objectives and outcomes</li>
                      <li>• Include appropriate prerequisites if applicable</li>
                      <li>• Test all interactive elements and assessments</li>
                      <li>• Review accessibility features for RSL support</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Preview</h3>
                
                <div className="max-w-4xl mx-auto">
                  {/* Course Header */}
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {formData.thumbnail_url && (
                        <img
                          src={formData.thumbnail_url}
                          alt="Course thumbnail"
                          className="w-full md:w-48 h-32 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                          {formData.title || 'Course Title'}
                        </h1>
                        <p className="text-gray-600 mb-4">
                          {formData.description || 'Course description will appear here'}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <BookOpen size={16} className="mr-1" />
                            {formData.category}
                          </span>
                          <span className="flex items-center">
                            <Star size={16} className="mr-1" />
                            {formData.level}
                          </span>
                          <span className="flex items-center">
                            <Clock size={16} className="mr-1" />
                            {formData.estimated_duration_hours} hours
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          FREE
                        </div>
                        <div className="text-sm text-gray-600">
                          {formData.is_published ? 'Active' : 'Draft'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Description */}
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">About This Course</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {formData.description || 'Detailed course description will appear here'}
                    </p>
                  </div>

                  {/* Learning Objectives */}
                  {formData.learning_objectives.filter(obj => obj.trim()).length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">What You'll Learn</h4>
                      <ul className="space-y-2">
                        {formData.learning_objectives
                          .filter(obj => obj.trim())
                          .map((objective, index) => (
                            <li key={index} className="flex items-start">
                              <Target className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{objective}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  {/* Course Sections */}
                  {formData.sections.filter(section => section.title.trim()).length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-6 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Course Content</h4>
                      <div className="space-y-3">
                        {formData.sections
                          .filter(section => section.title.trim())
                          .map((section, index) => (
                            <div key={index} className="border border-gray-100 rounded p-3">
                              <h5 className="font-medium text-gray-900">
                                Section {index + 1}: {section.title}
                              </h5>
                              {section.description && (
                                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites and Tags */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formData.prerequisites.filter(prereq => prereq.trim()).length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Prerequisites</h4>
                        <ul className="space-y-1">
                          {formData.prerequisites
                            .filter(prereq => prereq.trim())
                            .map((prerequisite, index) => (
                              <li key={index} className="text-gray-700 text-sm">
                                • {prerequisite}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {formData.tags.length > 0 && (
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/teacher/courses')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                {activeTab !== 'preview' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tabs = ['basic', 'content', 'settings', 'preview'];
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
                  <span>{isLoading ? 'Creating...' : 'Create Course'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};