import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Save, Eye, EyeOff, Trash2, BookOpen,
  Clock, Users, Target, Video, FileText, Settings, X
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Course {
  id: string;
  title: string;
}

interface Lesson {
  id: string;
  title: string;
  course_id: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  correct_answer: string;
  options?: string[];
  rsl_video_url?: string;
  rsl_description?: string;
}

interface QuizFormData {
  title: string;
  description: string;
  course_id: string;
  lesson_id: string;
  passing_score: number;
  time_limit_minutes: number;
  is_published: boolean;
  rsl_video_url: string;
  rsl_description: string;
  questions: Question[];
}

export const TeacherQuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'questions'>('details');

  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    course_id: '',
    lesson_id: '',
    passing_score: 70,
    time_limit_minutes: 30,
    is_published: false,
    rsl_video_url: '',
    rsl_description: '',
    questions: []
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

  // Fetch lessons when course is selected
  useEffect(() => {
    const fetchLessons = async () => {
      if (!formData.course_id) {
        setLessons([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('id, title, course_section_id, course_sections!inner(course_id)')
          .eq('course_sections.course_id', formData.course_id);

        if (error) throw error;

        const lessonList = data?.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          course_id: formData.course_id
        })) || [];

        setLessons(lessonList);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      }
    };

    fetchLessons();
  }, [formData.course_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_type: 'multiple_choice',
      correct_answer: '',
      options: ['', '', '', ''],
      rsl_video_url: '',
      rsl_description: ''
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const removeQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.course_id || !formData.lesson_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setIsLoading(true);

    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: formData.title,
          description: formData.description,
          lesson_id: formData.lesson_id,
          passing_score: formData.passing_score,
          time_limit_minutes: formData.time_limit_minutes,
          is_published: formData.is_published,
          rsl_video_url: formData.rsl_video_url || null,
          rsl_description: formData.rsl_description || null
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = formData.questions.map(q => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        options: q.options || null,
        rsl_video_url: q.rsl_video_url || null,
        rsl_description: q.rsl_description || null
      }));

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      alert('Quiz created successfully!');
      navigate('/teacher/quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout role="teacher" title="Create Quiz">
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => navigate('/teacher/quizzes')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
                <p className="text-gray-600">Design and publish a new quiz for your students</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Settings size={16} />
                    <span>Quiz Details</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'questions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText size={16} />
                    <span>Questions ({formData.questions.length})</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Quiz Details Tab */}
            {activeTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Quiz Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter quiz title"
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
                        placeholder="Describe what this quiz covers"
                      />
                    </div>

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
                      <label htmlFor="lesson_id" className="block text-sm font-medium text-gray-700 mb-1">
                        Lesson *
                      </label>
                      <select
                        id="lesson_id"
                        name="lesson_id"
                        value={formData.lesson_id}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!formData.course_id}
                      >
                        <option value="">Select a lesson</option>
                        {lessons.map(lesson => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quiz Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quiz Settings</h3>
                    
                    <div>
                      <label htmlFor="passing_score" className="block text-sm font-medium text-gray-700 mb-1">
                        Passing Score (%)
                      </label>
                      <input
                        type="number"
                        id="passing_score"
                        name="passing_score"
                        value={formData.passing_score}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="time_limit_minutes" className="block text-sm font-medium text-gray-700 mb-1">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        id="time_limit_minutes"
                        name="time_limit_minutes"
                        value={formData.time_limit_minutes}
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
                </div>

                {/* RSL Accessibility */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">RSL Accessibility</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="https://example.com/video.mp4"
                      />
                    </div>
                    <div>
                      <label htmlFor="rsl_description" className="block text-sm font-medium text-gray-700 mb-1">
                        RSL Description
                      </label>
                      <input
                        type="text"
                        id="rsl_description"
                        name="rsl_description"
                        value={formData.rsl_description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe the RSL content"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Quiz Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {formData.questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No questions added yet</p>
                      <p className="text-sm">Click "Add Question" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.questions.map((question, index) => (
                        <QuestionEditor
                          key={question.id}
                          question={question}
                          index={index}
                          onUpdate={(updates) => updateQuestion(question.id, updates)}
                          onRemove={() => removeQuestion(question.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/teacher/quizzes')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center space-x-3">
                {activeTab === 'details' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('questions')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Next: Add Questions
                  </button>
                )}
                {activeTab === 'questions' && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={16} />
                    <span>{isLoading ? 'Creating...' : 'Create Quiz'}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Question Editor Component
interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (updates: Partial<Question>) => void;
  onRemove: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, index, onUpdate, onRemove }) => {
  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...(question.options || ['', '', '', ''])];
    newOptions[optionIndex] = value;
    onUpdate({ options: newOptions });
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text *
        </label>
        <textarea
          value={question.question_text}
          onChange={(e) => onUpdate({ question_text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Enter your question here"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Type
        </label>
        <select
          value={question.question_type}
          onChange={(e) => onUpdate({ question_type: e.target.value as Question['question_type'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="short_answer">Short Answer</option>
        </select>
      </div>

      {question.question_type === 'multiple_choice' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Answer Options
          </label>
          <div className="space-y-2">
            {(question.options || ['', '', '', '']).map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correct_answer === option}
                  onChange={() => onUpdate({ correct_answer: option })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${idx + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {question.question_type === 'true_false' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name={`correct-${question.id}`}
                value="true"
                checked={question.correct_answer === 'true'}
                onChange={(e) => onUpdate({ correct_answer: e.target.value })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">True</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name={`correct-${question.id}`}
                value="false"
                checked={question.correct_answer === 'false'}
                onChange={(e) => onUpdate({ correct_answer: e.target.value })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2">False</span>
            </label>
          </div>
        </div>
      )}

      {question.question_type === 'short_answer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer
          </label>
          <input
            type="text"
            value={question.correct_answer}
            onChange={(e) => onUpdate({ correct_answer: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter the correct answer"
          />
        </div>
      )}

      {/* RSL Support for Question */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">RSL Support (Optional)</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">RSL Video URL</label>
            <input
              type="url"
              value={question.rsl_video_url || ''}
              onChange={(e) => onUpdate({ rsl_video_url: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com/video.mp4"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">RSL Description</label>
            <input
              type="text"
              value={question.rsl_description || ''}
              onChange={(e) => onUpdate({ rsl_description: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe the RSL content"
            />
          </div>
        </div>
      </div>
    </div>
  );
};