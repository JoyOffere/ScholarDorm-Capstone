import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Edit, Camera, 
  Save, X, GraduationCap, Award, Book, Users, Clock, Star
} from 'lucide-react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';

interface TeacherProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  subject_specialization?: string;
  years_experience?: number;
  education_level?: string;
  certifications?: string[];
  created_at: string;
}

interface TeacherStats {
  total_courses: number;
  total_students: number;
  total_lessons: number;
  total_quizzes: number;
  average_rating: number;
}

export const TeacherProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [stats, setStats] = useState<TeacherStats>({
    total_courses: 0,
    total_students: 0,
    total_lessons: 0,
    total_quizzes: 0,
    average_rating: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: '',
    subject_specialization: '',
    years_experience: 0,
    education_level: '',
    certifications: [] as string[]
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setEditForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || '',
        subject_specialization: data.subject_specialization || '',
        years_experience: data.years_experience || 0,
        education_level: data.education_level || '',
        certifications: data.certifications || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // First get teacher's course assignments
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('teacher_course_assignments')
        .select('course_id')
        .eq('teacher_id', user.id);

      if (coursesError) throw coursesError;

      const courseIds = teacherCourses?.map(c => c.course_id) || [];
      const coursesCount = courseIds.length;

      // Initialize default results
      let studentsCount = 0;
      let lessonsCount = 0;
      let quizzesCount = 0;

      // Only proceed with further queries if we have courses
      if (courseIds.length > 0) {
        // Get students count
        const { count: studentsCountResult, error: studentsError } = await supabase
          .from('course_enrollments')
          .select('student_id', { count: 'exact' })
          .in('course_id', courseIds);

        if (!studentsError) {
          studentsCount = studentsCountResult || 0;
        }

        // Get course sections
        const { data: courseSections, error: sectionsError } = await supabase
          .from('course_sections')
          .select('id')
          .in('course_id', courseIds);

        if (!sectionsError && courseSections && courseSections.length > 0) {
          const sectionIds = courseSections.map(s => s.id);
          
          // Get lessons for sections (reuse for both lesson count and quiz count)
          const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('id')
            .in('course_section_id', sectionIds);

          if (!lessonsError && lessons) {
            lessonsCount = lessons.length;
            
            // Get quizzes count for these lessons
            if (lessons.length > 0) {
              const lessonIds = lessons.map(l => l.id);
              
              const { count: quizzesCountResult, error: quizzesError } = await supabase
                .from('quizzes')
                .select('id', { count: 'exact' })
                .in('lesson_id', lessonIds);

              if (!quizzesError) {
                quizzesCount = quizzesCountResult || 0;
              }
            }
          }
        }
      }

      const newStats = {
        total_courses: coursesCount,
        total_students: studentsCount,
        total_lessons: lessonsCount,
        total_quizzes: quizzesCount,
        average_rating: 4.5 // Placeholder - would need to implement rating system
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: name === 'years_experience' ? parseInt(value) || 0 : value
    }));
  };

  const handleCertificationChange = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => i === index ? value : cert)
    }));
  };

  const addCertification = () => {
    setEditForm(prev => ({
      ...prev,
      certifications: [...prev.certifications, '']
    }));
  };

  const removeCertification = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          location: editForm.location,
          bio: editForm.bio,
          subject_specialization: editForm.subject_specialization,
          years_experience: editForm.years_experience,
          education_level: editForm.education_level,
          certifications: editForm.certifications.filter(cert => cert.trim())
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        subject_specialization: profile.subject_specialization || '',
        years_experience: profile.years_experience || 0,
        education_level: profile.education_level || '',
        certifications: profile.certifications || []
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout role="teacher" title="My Profile">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="teacher" title="My Profile">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-blue-600" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors">
                  <Camera size={14} />
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || 'Teacher Profile'}
                </h1>
                <p className="text-gray-600">{profile?.subject_specialization || 'Subject Specialist'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{stats.average_rating.toFixed(1)} rating</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">{stats.total_students} students</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit size={16} />
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Courses</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total_courses}</p>
              </div>
              <Book className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-2xl font-bold text-green-600">{stats.total_students}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lessons</p>
                <p className="text-2xl font-bold text-purple-600">{stats.total_lessons}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quizzes</p>
                <p className="text-2xl font-bold text-orange-600">{stats.total_quizzes}</p>
              </div>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{profile?.email}</span>
                </div>
                
                {profile?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{profile.phone}</span>
                  </div>
                )}
                
                {profile?.location && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{profile.location}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">
                    Joined {new Date(profile?.created_at || '').toLocaleDateString()}
                  </span>
                </div>
                
                {profile?.bio && (
                  <div className="mt-4">
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Professional Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject Specialization</label>
                  <input
                    type="text"
                    name="subject_specialization"
                    value={editForm.subject_specialization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    name="years_experience"
                    value={editForm.years_experience}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                  <select
                    name="education_level"
                    value={editForm.education_level}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select education level</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                  {editForm.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={cert}
                        onChange={(e) => handleCertificationChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Certification name"
                      />
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCertification}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Certification
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile?.subject_specialization && (
                  <div>
                    <p className="text-sm text-gray-600">Subject Specialization</p>
                    <p className="text-gray-900 font-medium">{profile.subject_specialization}</p>
                  </div>
                )}
                
                {profile?.years_experience && (
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="text-gray-900 font-medium">{profile.years_experience} years</p>
                  </div>
                )}
                
                {profile?.education_level && (
                  <div>
                    <p className="text-sm text-gray-600">Education</p>
                    <p className="text-gray-900 font-medium">{profile.education_level}</p>
                  </div>
                )}
                
                {profile?.certifications && profile.certifications.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600">Certifications</p>
                    <div className="mt-1 space-y-1">
                      {profile.certifications.map((cert, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};