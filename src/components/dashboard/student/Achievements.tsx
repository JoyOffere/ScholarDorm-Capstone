import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layout/DashboardLayout';
import { AwardIcon, TrophyIcon, StarIcon, BookIcon, CheckCircleIcon, LockIcon, Clock8Icon, CalendarIcon, BarChart2Icon, BadgeIcon, ChevronRightIcon, ChevronDownIcon, InfoIcon } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getUserAchievements } from '../../../lib/supabase-utils';
import { motion } from 'framer-motion';
interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  badge_type: 'streak' | 'achievement' | 'course' | 'special';
  level: number;
  earned_at?: string;
  progress?: number;
}
export const StudentAchievements: React.FC = () => {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalBadges: 0,
    coursesCompleted: 0,
    quizzesPassed: 0
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  useEffect(() => {
    fetchAchievements();
  }, []);
  const fetchAchievements = async () => {
    try {
      setLoading(true);
      // Get current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      // Get user profile for streak info
      const {
        data: profile,
        error: profileError
      } = await supabase.from('users').select('streak_count, longest_streak').eq('id', user.id).single();
      if (profileError) throw profileError;
      // Get earned badges
      const {
        data: userBadges,
        error: userBadgesError
      } = await supabase.from('user_badges').select(`
          id,
          earned_at,
          progress,
          badge:badges (
            id,
            name,
            description,
            image_url,
            badge_type,
            level
          )
        `).eq('user_id', user.id);
      if (userBadgesError) throw userBadgesError;
      // Get all available badges
      const {
        data: allBadges,
        error: allBadgesError
      } = await supabase.from('badges').select('*');
      if (allBadgesError) throw allBadgesError;
      // Get courses completed
      const {
        count: coursesCount,
        error: coursesError
      } = await supabase.from('user_courses').select('id', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id).eq('completed', true);
      if (coursesError) throw coursesError;
      // Get quizzes passed
      const {
        count: quizzesCount,
        error: quizzesError
      } = await supabase.from('quiz_attempts').select('id', {
        count: 'exact',
        head: true
      }).eq('user_id', user.id).eq('passed', true);
      if (quizzesError) throw quizzesError;
      // Process earned badges
      const earned = userBadges.map((item: any) => ({
        id: item.badge.id,
        name: item.badge.name,
        description: item.badge.description,
        image_url: item.badge.image_url,
        badge_type: item.badge.badge_type,
        level: item.badge.level,
        earned_at: item.earned_at,
        progress: item.progress || 100
      }));
      // Process available but not yet earned badges
      const earnedIds = earned.map((badge: Badge) => badge.id);
      const available = allBadges.filter((badge: any) => !earnedIds.includes(badge.id)).map((badge: any) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        image_url: badge.image_url,
        badge_type: badge.badge_type,
        level: badge.level,
        progress: 0
      }));
      setEarnedBadges(earned);
      setAvailableBadges(available);
      setStats({
        currentStreak: profile.streak_count || 0,
        longestStreak: profile.longest_streak || 0,
        totalBadges: earned.length,
        coursesCompleted: coursesCount || 0,
        quizzesPassed: quizzesCount || 0
      });
      // If there are earned badges, select the first one by default
      if (earned.length > 0) {
        setSelectedBadge(earned[0]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };
  const filterBadgesByType = (badges: Badge[], type: string) => {
    if (type === 'all') return badges;
    return badges.filter(badge => badge.badge_type === type);
  };
  const getBadgeTypeIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return <div size={18} className="text-orange-500" />;
      case 'achievement':
        return <TrophyIcon size={18} className="text-purple-500" />;
      case 'course':
        return <BookIcon size={18} className="text-blue-500" />;
      case 'special':
        return <StarIcon size={18} className="text-yellow-500" />;
      default:
        return <AwardIcon size={18} className="text-gray-500" />;
    }
  };
  const getBadgeTypeColor = (type: string) => {
    switch (type) {
      case 'streak':
        return 'bg-orange-100 text-orange-800';
      case 'achievement':
        return 'bg-purple-100 text-purple-800';
      case 'course':
        return 'bg-blue-100 text-blue-800';
      case 'special':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getLevelText = (level: number) => {
    switch (level) {
      case 1:
        return 'Bronze';
      case 2:
        return 'Silver';
      case 3:
        return 'Gold';
      case 4:
        return 'Platinum';
      default:
        return 'Basic';
    }
  };
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-amber-700';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-cyan-400';
      default:
        return 'bg-gray-300';
    }
  };
  const BadgeCard = ({
    badge,
    earned = false
  }: {
    badge: Badge;
    earned?: boolean;
  }) => <motion.div whileHover={{
    scale: 1.05
  }} whileTap={{
    scale: 0.95
  }} className={`relative rounded-lg overflow-hidden border ${earned ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} cursor-pointer`} onClick={() => setSelectedBadge(badge)}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="relative">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center ${earned ? 'bg-white' : 'bg-gray-200'} p-1`}>
              {earned ? <img src={badge.image_url} alt={badge.name} className="h-14 w-14 rounded-full object-cover" /> : <LockIcon size={24} className="text-gray-400" />}
            </div>
            <div className={`absolute -right-1 -bottom-1 h-6 w-6 rounded-full ${getLevelColor(badge.level)} flex items-center justify-center text-white text-xs font-bold border-2 border-white`}>
              {badge.level}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h3 className={`font-medium ${earned ? 'text-gray-900' : 'text-gray-500'}`}>
                {badge.name}
              </h3>
              {getBadgeTypeIcon(badge.badge_type)}
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {badge.description}
            </p>
            {earned ? <div className="flex items-center mt-2 text-xs text-green-600">
                <CheckCircleIcon size={12} className="mr-1" />
                <span>
                  Earned {new Date(badge.earned_at!).toLocaleDateString()}
                </span>
              </div> : <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{
                width: `${badge.progress}%`
              }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {badge.progress}% complete
                </p>
              </div>}
          </div>
        </div>
      </div>
    </motion.div>;
  return <DashboardLayout title="My Achievements" role="student">
      {loading ? <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - badges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Achievement stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Achievement Progress
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-blue-500">
                    <div size={24} />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.currentStreak}
                  </p>
                  <p className="text-xs text-gray-500">Current Streak</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-purple-500">
                    <BarChart2Icon size={24} />
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.longestStreak}
                  </p>
                  <p className="text-xs text-gray-500">Longest Streak</p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-yellow-500">
                    <AwardIcon size={24} />
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.totalBadges}
                  </p>
                  <p className="text-xs text-gray-500">Total Badges</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-green-500">
                    <BookIcon size={24} />
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.coursesCompleted}
                  </p>
                  <p className="text-xs text-gray-500">Courses Completed</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2 text-red-500">
                    <CheckCircleIcon size={24} />
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {stats.quizzesPassed}
                  </p>
                  <p className="text-xs text-gray-500">Quizzes Passed</p>
                </div>
              </div>
            </div>
            {/* Badge categories */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">My Badges</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Collect badges by completing courses, maintaining streaks, and
                  achieving milestones
                </p>
              </div>
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto py-2 px-6 space-x-2">
                  <button onClick={() => setExpandedCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${expandedCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    All Badges
                  </button>
                  <button onClick={() => setExpandedCategory('streak')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${expandedCategory === 'streak' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <div size={14} className="inline mr-1" />
                    Streak Badges
                  </button>
                  <button onClick={() => setExpandedCategory('achievement')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${expandedCategory === 'achievement' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <TrophyIcon size={14} className="inline mr-1" />
                    Achievements
                  </button>
                  <button onClick={() => setExpandedCategory('course')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${expandedCategory === 'course' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <BookIcon size={14} className="inline mr-1" />
                    Course Badges
                  </button>
                  <button onClick={() => setExpandedCategory('special')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${expandedCategory === 'special' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    <StarIcon size={14} className="inline mr-1" />
                    Special Badges
                  </button>
                </div>
              </div>
              <div className="p-6">
                {earnedBadges.length === 0 && availableBadges.length === 0 ? <div className="text-center py-12">
                    <AwardIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      No badges available yet
                    </h3>
                    <p className="text-gray-600">
                      Complete courses and maintain your learning streak to earn
                      badges.
                    </p>
                  </div> : <div>
                    {earnedBadges.length > 0 && <div className="mb-8">
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <CheckCircleIcon size={20} className="text-green-500 mr-2" />
                          Earned Badges (
                          {filterBadgesByType(earnedBadges, expandedCategory).length}
                          )
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filterBadgesByType(earnedBadges, expandedCategory).map(badge => <BadgeCard key={badge.id} badge={badge} earned={true} />)}
                        </div>
                      </div>}
                    {availableBadges.length > 0 && <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                          <LockIcon size={20} className="text-gray-500 mr-2" />
                          Available Badges (
                          {filterBadgesByType(availableBadges, expandedCategory).length}
                          )
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filterBadgesByType(availableBadges, expandedCategory).map(badge => <BadgeCard key={badge.id} badge={badge} earned={false} />)}
                        </div>
                      </div>}
                  </div>}
              </div>
            </div>
          </div>
          {/* Right column - badge details */}
          <div className="space-y-6">
            {/* Selected badge details */}
            {selectedBadge ? <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className="inline-block p-2 rounded-full bg-blue-50">
                    <img src={selectedBadge.image_url} alt={selectedBadge.name} className="h-24 w-24 rounded-full object-cover" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mt-4">
                    {selectedBadge.name}
                  </h2>
                  <div className="flex items-center justify-center mt-2 space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeTypeColor(selectedBadge.badge_type)}`}>
                      {selectedBadge.badge_type.charAt(0).toUpperCase() + selectedBadge.badge_type.slice(1)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                      {getLevelText(selectedBadge.level)}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Description
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {selectedBadge.description}
                    </p>
                  </div>
                  {selectedBadge.earned_at ? <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Earned On
                      </h3>
                      <p className="text-gray-600 mt-1 flex items-center">
                        <CalendarIcon size={16} className="mr-2 text-gray-400" />
                        {new Date(selectedBadge.earned_at).toLocaleDateString()}
                      </p>
                    </div> : <div>
                      <h3 className="text-sm font-medium text-gray-700">
                        Progress
                      </h3>
                      <div className="mt-2">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{
                    width: `${selectedBadge.progress}%`
                  }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {selectedBadge.progress}% complete
                        </p>
                      </div>
                    </div>}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex">
                      <InfoIcon size={20} className="text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">
                          How to earn this badge
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                          {selectedBadge.badge_type === 'streak' ? `Maintain a daily learning streak for ${selectedBadge.name.split('-')[0]} days.` : selectedBadge.badge_type === 'course' ? 'Complete all courses in the specified subject area.' : 'Complete specific learning activities and achievements.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> : <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center py-8">
                  <AwardIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    No badge selected
                  </h3>
                  <p className="text-gray-600">
                    Select a badge to view its details
                  </p>
                </div>
              </div>}
            {/* Achievement tips */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Tips to Earn More Badges
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircleIcon size={12} className="text-green-600" />
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Log in daily to maintain your streak
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircleIcon size={12} className="text-green-600" />
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Complete all lessons in your enrolled courses
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircleIcon size={12} className="text-green-600" />
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Score 100% on quizzes to earn perfect scores
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircleIcon size={12} className="text-green-600" />
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Provide feedback on courses you've completed
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <CheckCircleIcon size={12} className="text-green-600" />
                  </div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Explore different subject areas to earn diverse badges
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>}
    </DashboardLayout>;
};