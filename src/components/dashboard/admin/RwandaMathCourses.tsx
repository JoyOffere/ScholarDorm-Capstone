import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { BookOpenIcon, PlayCircleIcon, CheckCircleIcon, ClockIcon, UsersIcon } from 'lucide-react';

interface EnhancedCourse {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: string;
  difficulty_level: string;
  total_lessons: number;
  estimated_duration_hours: number;
  has_rsl_support: boolean;
  is_featured: boolean;
  learning_objectives: string[];
  prerequisites: string[];
}

interface EnhancedLesson {
  id: string;
  title: string;
  description: string;
  content_type: string;
  estimated_duration_minutes: number;
  difficulty_tags: string[];
  is_preview: boolean;
  order_index: number;
}

interface EnhancedQuiz {
  id: string;
  title: string;
  description: string;
  quiz_type: string;
  max_attempts: number;
  passing_score: number;
}

export const RwandaMathCourses: React.FC = () => {
  const [courses, setCourses] = useState<EnhancedCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<EnhancedCourse | null>(null);
  const [lessons, setLessons] = useState<EnhancedLesson[]>([]);
  const [quizzes, setQuizzes] = useState<EnhancedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRwandaMathCourses();
  }, []);

  const fetchRwandaMathCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch Rwanda S2 Mathematics courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('subject', 'Mathematics')
        .eq('grade_level', 'Senior 2')
        .eq('is_active', true)
        .order('title');

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);
      
    } catch (error) {
      console.error('Error fetching Rwanda Math courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId: string) => {
    try {
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('enhanced_lessons')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch quizzes
      const { data: quizzesData, error: quizzesError } = await supabase
        .from('enhanced_quizzes')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true);

      if (quizzesError) throw quizzesError;
      setQuizzes(quizzesData || []);
      
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleCourseSelect = (course: EnhancedCourse) => {
    setSelectedCourse(course);
    fetchCourseDetails(course.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Rwanda S2 Mathematics Courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🇷🇼 Rwanda Senior 2 Mathematics Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive mathematics curriculum designed for Rwanda's Senior 2 students, 
            featuring interactive lessons, practice quizzes, and RSL accessibility support.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {courses.map((course) => (
            <div 
              key={course.id}
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 ${
                selectedCourse?.id === course.id ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => handleCourseSelect(course)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <BookOpenIcon className="h-6 w-6 text-blue-600" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {course.difficulty_level}
                    </span>
                  </div>
                  {course.is_featured && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{course.estimated_duration_hours}h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BookOpenIcon className="h-4 w-4" />
                    <span>{course.total_lessons} lessons</span>
                  </div>
                </div>
                
                {course.has_rsl_support && (
                  <div className="flex items-center text-sm text-blue-600 mb-2">
                    <PlayCircleIcon className="h-4 w-4 mr-1" />
                    <span>RSL Support Available</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Prerequisites:</h4>
                  <div className="flex flex-wrap gap-1">
                    {course.prerequisites?.slice(0, 2).map((prereq, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {prereq}
                      </span>
                    ))}
                    {course.prerequisites?.length > 2 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{course.prerequisites.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Details */}
        {selectedCourse && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              📚 {selectedCourse.title} - Course Details
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lessons */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Lessons ({lessons.length})
                </h3>
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {lesson.order_index}. {lesson.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {lesson.is_preview && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              Preview
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {lesson.estimated_duration_minutes}min
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {lesson.difficulty_tags?.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 text-xs rounded ${
                            tag === 'easy' ? 'bg-green-100 text-green-700' :
                            tag === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quizzes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
                  Assessments ({quizzes.length})
                </h3>
                <div className="space-y-3">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-2">{quiz.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          quiz.quiz_type === 'assessment' ? 'bg-blue-100 text-blue-800' :
                          quiz.quiz_type === 'practice' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {quiz.quiz_type}
                        </span>
                        <div className="text-gray-500">
                          <span>Pass: {quiz.passing_score}%</span>
                          <span className="mx-2">•</span>
                          <span>Max: {quiz.max_attempts} attempts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Learning Objectives</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedCourse.learning_objectives?.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Curriculum Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {courses.reduce((sum, course) => sum + course.total_lessons, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {courses.reduce((sum, course) => sum + course.estimated_duration_hours, 0).toFixed(1)}h
              </div>
              <div className="text-sm text-gray-600">Study Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {courses.filter(course => course.has_rsl_support).length}
              </div>
              <div className="text-sm text-gray-600">RSL Supported</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};