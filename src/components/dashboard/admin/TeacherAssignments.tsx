import * as React from 'react';
const { useEffect, useState } = React;
import { motion } from 'framer-motion';
import {
  User, Search, Filter, Plus, Edit3, Trash2, Users, 
  BookOpen, Calendar, Check, X, AlertCircle, UserPlus,
  Settings, Eye, MoreHorizontal, RefreshCw, Download
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  created_at: string;
  phone?: string;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  level: string;
  category: string;
  created_at: string;
  is_active: boolean;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  course_id: string;
  assigned_at: string;
  assigned_by?: string;
  teacher: Teacher;
  course: Course;
  status: 'active' | 'inactive';
}

interface NewAssignment {
  teacher_id: string;
  course_ids: string[];
}

export const AdminTeacherAssignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState<NewAssignment>({
    teacher_id: '',
    course_ids: []
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAssignments(),
        fetchTeachers(),
        fetchCourses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('teacher_course_assignments')
        .select(`
          id,
          teacher_id,
          course_id,
          assigned_at,
          assigned_by,
          users!teacher_id(
            id,
            full_name,
            email,
            avatar_url,
            status,
            department,
            created_at,
            phone
          ),
          courses!course_id(
            id,
            title,
            description,
            difficulty_level,
            subject,
            created_at,
            is_active
          )
        `)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      const formattedAssignments: TeacherAssignment[] = (data || []).map(item => {
        const course = Array.isArray(item.courses) ? item.courses[0] : item.courses;
        return {
          id: item.id,
          teacher_id: item.teacher_id,
          course_id: item.course_id,
          assigned_at: item.assigned_at,
          assigned_by: item.assigned_by,
          teacher: Array.isArray(item.users) ? item.users[0] : item.users,
          course: {
            id: course?.id || '',
            title: course?.title || '',
            description: course?.description || '',
            level: course?.difficulty_level || '',
            category: course?.subject || '',
            created_at: course?.created_at || '',
            is_active: course?.is_active || false
          },
          status: course?.is_active ? 'active' : 'inactive'
        };
      });

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, status, department, created_at, phone')
        .eq('role', 'teacher')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchCourses = async () => {
    setCoursesLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, difficulty_level, subject, created_at, is_active')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      console.log('Fetched courses:', data);
      
      // Map the database columns to our interface
      const mappedCourses = (data || []).map(course => ({
        ...course,
        level: course.difficulty_level,
        category: course.subject
      }));
      
      setCourses(mappedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!user || !newAssignment.teacher_id || newAssignment.course_ids.length === 0) return;

    setAssignmentLoading(true);
    try {
      // Create multiple assignments - one for each selected course
      const assignmentsToCreate = newAssignment.course_ids.map(courseId => ({
        teacher_id: newAssignment.teacher_id,
        course_id: courseId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('teacher_course_assignments')
        .insert(assignmentsToCreate);

      if (error) throw error;

      setShowAssignModal(false);
      setNewAssignment({ teacher_id: '', course_ids: [] });
      fetchAssignments();
      
      // Show success message
      const courseCount = newAssignment.course_ids.length;
      alert(`Successfully created ${courseCount} teacher assignment${courseCount > 1 ? 's' : ''}!`);
    } catch (error) {
      console.error('Error creating assignments:', error);
      alert('Failed to create assignments.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const removeAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('teacher_course_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      fetchAssignments();
      alert('Assignment removed successfully!');
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment.');
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || assignment.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getUnassignedTeachers = () => {
    const assignedTeacherIds = assignments.map(a => a.teacher_id);
    return teachers.filter(teacher => !assignedTeacherIds.includes(teacher.id));
  };

  const getAvailableCoursesForTeacher = (teacherId: string) => {
    // Return all active courses - teachers can have multiple assignments
    return courses.filter(course => course.is_active);
  };

  if (loading) {
    return (
      <DashboardLayout title="Teacher Assignments" role="admin">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading teacher assignments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Teacher Assignments" role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Course Assignments</h1>
            <p className="text-gray-600 mt-1">Manage teacher-course assignments and responsibilities</p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Assignment</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(assignments.filter(a => a.status === 'active').map(a => a.teacher_id)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(assignments.filter(a => a.status === 'active').map(a => a.course_id)).size}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unassigned Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{getUnassignedTeachers().length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search teachers or courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssignments.map((assignment) => (
                  <motion.tr
                    key={assignment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {assignment.teacher.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={assignment.teacher.avatar_url}
                              alt={assignment.teacher.full_name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.teacher.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.teacher.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.course.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level: {assignment.course.level} • {assignment.course.category}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.teacher.department || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Remove Assignment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">No assignments found</p>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first teacher assignment to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Create New Assignment</h2>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Teacher
                  </label>
                  <select
                    value={newAssignment.teacher_id}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, teacher_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.full_name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Courses ({newAssignment.course_ids.length} selected)
                    {coursesLoading && (
                      <span className="ml-2 text-xs text-blue-600">Loading courses...</span>
                    )}
                  </label>
                  
                  {!coursesLoading && newAssignment.teacher_id ? (
                    <div className="border border-gray-300 rounded-lg">
                      {/* Select All Header */}
                      {getAvailableCoursesForTeacher(newAssignment.teacher_id).length > 1 && (
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newAssignment.course_ids.length === getAvailableCoursesForTeacher(newAssignment.teacher_id).length}
                              onChange={(e) => {
                                const allCourseIds = getAvailableCoursesForTeacher(newAssignment.teacher_id).map(c => c.id);
                                setNewAssignment(prev => ({
                                  ...prev,
                                  course_ids: e.target.checked ? allCourseIds : []
                                }));
                              }}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Select All ({getAvailableCoursesForTeacher(newAssignment.teacher_id).length} courses)
                            </span>
                          </label>
                        </div>
                      )}
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto p-3">
                        {getAvailableCoursesForTeacher(newAssignment.teacher_id).map((course) => (
                        <label key={course.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={newAssignment.course_ids.includes(course.id)}
                            onChange={(e) => {
                              const courseId = course.id;
                              setNewAssignment(prev => ({
                                ...prev,
                                course_ids: e.target.checked
                                  ? [...prev.course_ids, courseId]
                                  : prev.course_ids.filter(id => id !== courseId)
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{course.title}</span>
                            <span className="ml-2 text-xs text-gray-500">({course.level})</span>
                            {course.category && (
                              <span className="ml-2 text-xs text-blue-600">{course.category}</span>
                            )}
                          </div>
                        </label>
                        ))}
                        
                        {getAvailableCoursesForTeacher(newAssignment.teacher_id).length === 0 && (
                          <p className="text-sm text-orange-600 text-center py-4">
                            No active courses available for assignment.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full px-3 py-8 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-500">
                      {coursesLoading ? "Loading courses..." : "Select a teacher first to see available courses"}
                    </div>
                  )}
                  
                  {courses.length === 0 && !coursesLoading && (
                    <p className="text-sm text-red-600 mt-1">
                      No courses available. Please create courses first.
                    </p>
                  )}
                  
                  {newAssignment.course_ids.length > 0 && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {newAssignment.course_ids.length} course{newAssignment.course_ids.length > 1 ? 's' : ''} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewAssignment(prev => ({ ...prev, course_ids: [] }))}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createAssignment}
                    disabled={!newAssignment.teacher_id || newAssignment.course_ids.length === 0 || assignmentLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {assignmentLoading ? 'Creating...' : 
                     newAssignment.course_ids.length > 1 ? 
                     `Create ${newAssignment.course_ids.length} Assignments` : 
                     'Create Assignment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};