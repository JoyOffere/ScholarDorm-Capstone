import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, BookOpenIcon, VideoIcon, FileTextIcon, DownloadIcon, ExternalLinkIcon, SearchIcon, FilterIcon, XIcon, AlertCircleIcon, UsersIcon, MessageSquareIcon, GraduationCapIcon, Award, PlayIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RSLVideo, RSLSign, RSLCategory, getCategoryDisplayName } from '../../lib/rsl-service';

interface RSLResource {
  type: 'video' | 'sign';
  data: RSLVideo | RSLSign;
}

export const RSLPage: React.FC = () => {
  const [resources, setResources] = useState<RSLResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RSLCategory | 'all'>('all');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RSLVideo | null>(null);

  useEffect(() => {
    fetchResources();
  }, [searchTerm, selectedCategory]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const videosQuery = supabase.from('rsl_videos').select('*').ilike('title', `%${searchTerm}%`);
      if (selectedCategory !== 'all') {
        videosQuery.eq('category', selectedCategory);
      }
      const signsQuery = supabase.from('rsl_signs').select('*').ilike('word', `%${searchTerm}%`);
      if (selectedCategory !== 'all') {
        signsQuery.eq('category', selectedCategory);
      }
      const [videosData, signsData] = await Promise.all([
        videosQuery,
        signsQuery
      ]);

      if (videosData.error) throw videosData.error;
      if (signsData.error) throw signsData.error;

      const combinedResources: RSLResource[] = [
        ...videosData.data.map(video => ({ type: 'video' as const, data: video })),
        ...signsData.data.map(sign => ({ type: 'sign' as const, data: sign }))
      ];

      setResources(combinedResources);
    } catch (err: any) {
      console.error('Error fetching RSL resources:', err);
      setError(err.message || 'Failed to load RSL resources');
    } finally {
      setLoading(false);
    }
  };

  const openVideoModal = (video: RSLVideo) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const categories: (RSLCategory | 'all')[] = ['all', 'education', 'greetings', 'navigation', 'emotions', 'family', 'technology', 'academic_subjects', 'common_phrases'];

  function getCategoryIcon(category: string): React.ReactNode {
    switch (category) {
      case 'education':
        return <BookOpenIcon size={16} className="text-blue-500" />;
      case 'greetings':
        return <MessageSquareIcon size={16} className="text-green-500" />;
      case 'navigation':
        return <ArrowLeftIcon size={16} className="text-yellow-500" />;
      case 'emotions':
        return <AlertCircleIcon size={16} className="text-pink-500" />;
      case 'family':
        return <UsersIcon size={16} className="text-red-500" />;
      case 'technology':
        return <VideoIcon size={16} className="text-indigo-500" />;
      case 'academic_subjects':
        return <GraduationCapIcon size={16} className="text-purple-500" />;
      case 'common_phrases':
        return <FileTextIcon size={16} className="text-orange-500" />;
      default:
        return <FileTextIcon size={16} className="text-gray-400" />;
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200">
            <ArrowLeftIcon size={18} className="mr-2" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-8 md:p-12 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -ml-16 -mb-16"></div>
            <div className="max-w-3xl mx-auto text-center relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Rwandan Sign Language Resources</h1>
              <p className="text-xl opacity-90 mb-6">Access comprehensive, interactive resources to learn and practice RSL for inclusive education on ScholarDorm.</p>
              <button
                onClick={() => openVideoModal(resources.find(r => r.type === 'video')?.data as RSLVideo || null)}
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors shadow-lg"
                disabled={!resources.some(r => r.type === 'video')}
              >
                <PlayIcon size={18} className="mr-2" />
                Watch Intro Video
              </button>
            </div>
          </div>
          <div className="px-6 py-8 md:px-12 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <div className="lg:col-span-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Why RSL Matters</h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  Rwandan Sign Language (RSL) is essential for deaf and hard-of-hearing students in Rwanda. By providing RSL resources, we promote inclusive education, enhance communication, and preserve Rwandan cultural heritage through sign language.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: UsersIcon, text: 'Promotes inclusive education for all students' },
                    { icon: MessageSquareIcon, text: 'Enhances communication between deaf and hearing individuals' },
                    { icon: GraduationCapIcon, text: 'Supports academic success in classrooms' },
                    { icon: Award, text: 'Preserves and promotes Rwandan Sign Language as a cultural asset' }
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full text-blue-600 mr-4">
                        <item.icon size={20} />
                      </div>
                      <span className="text-gray-700 text-lg">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop" 
                  alt="RSL in action" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                  <p className="text-white text-lg font-medium">RSL in everyday education</p>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Available Resources</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                  <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div className="relative w-full sm:w-auto">
                  <FilterIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value as RSLCategory | 'all')}
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-shadow"
                    >
                      <option value="all">All Categories</option>
                      <option value="education">Education</option>
                      <option value="greetings">Greetings</option>
                      <option value="navigation">Navigation</option>
                      <option value="emotions">Emotions</option>
                      <option value="family">Family</option>
                      <option value="technology">Technology</option>
                      <option value="academic_subjects">Academic Subjects</option>
                      <option value="common_phrases">Common Phrases</option>
                    </select>
                </div>
              </div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-lg text-gray-600">Loading resources...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <div className="flex">
                    <AlertCircleIcon className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-16">
                  <FileTextIcon size={64} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">No resources found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.map(resource => (
                    <div key={resource.data.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img 
                          src={
                            resource.type === 'video'
                              ? ((resource.data as RSLVideo).thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop')
                              : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1470&auto=format&fit=crop'
                          }
                          alt={resource.type === 'video' ? (resource.data as RSLVideo).title : (resource.data as RSLSign).word} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center text-blue-600 mb-2">
                          {resource.type === 'video' ? <VideoIcon size={16} className="mr-1" /> : <FileTextIcon size={16} className="mr-1" />}
                          <span className="text-sm font-medium capitalize">{resource.type}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 truncate">{resource.type === 'video' ? (resource.data as RSLVideo).title : (resource.data as RSLSign).word}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{resource.data.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            {getCategoryIcon(resource.data.category)} {getCategoryDisplayName(resource.data.category)}
                          </span>
                          {resource.type === 'video' ? (
                            <button 
                              onClick={() => openVideoModal(resource.data as RSLVideo)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <ExternalLinkIcon size={14} className="mr-1" />
                              Watch
                            </button>
                          ) : (
                            <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                              <DownloadIcon size={14} className="mr-1" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Practice with Interactive Lessons</h2>
              <p className="text-gray-700 mb-8 text-lg max-w-2xl">Enhance your RSL skills with our interactive lessons designed to build fluency and confidence in communication.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Alphabet & Numbers', description: 'Learn to sign the alphabet and numbers 1-100' },
                  { title: 'Common Phrases', description: 'Master everyday expressions and greetings' },
                  { title: 'Academic Vocabulary', description: 'Subject-specific signs for classroom use' },
                  { title: 'Conversation Practice', description: 'Interactive dialogues to build fluency' }
                ].map((lesson, index) => (
                  <button key={index} className="bg-white border border-gray-200 rounded-lg p-6 text-left hover:border-blue-500 hover:shadow-md transition-all duration-300">
                    <h3 className="font-bold text-gray-900 mb-2 text-xl">{lesson.title}</h3>
                    <p className="text-gray-600 text-sm">{lesson.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">&copy; 2025 ScholarDorm. All rights reserved.</p>
        </div>
      </div>

      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowVideoModal(false)}>
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4">
                <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowVideoModal(false)}>
                  <XIcon size={24} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedVideo.title}</h3>
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    width="100%"
                    height="100%"
                    src={selectedVideo.video_url.replace('watch?v=', 'embed/')}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <p className="mt-4 text-gray-600">{selectedVideo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};