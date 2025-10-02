import React, { useEffect, useState, useRef, Component } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, BellIcon, UserIcon, HelpCircleIcon, ChevronDownIcon, LogOutIcon, SettingsIcon, MoonIcon, SunIcon, BookIcon, GraduationCapIcon, GamepadIcon, AwardIcon, XIcon, MenuIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createAuditLog } from '../../lib/supabase-utils';
interface NavbarProps {
  role: 'student' | 'admin';
  toggleSidebar: () => void;
  userProfile?: {
    name: string;
    avatar?: string;
    unreadNotifications: number;
  };
}
export const Navbar: React.FC<NavbarProps> = ({
  role,
  toggleSidebar,
  userProfile = {
    name: 'User',
    unreadNotifications: 0
  }
}) => {
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        document.getElementById('search-input')?.focus();
      }, 100);
    }
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real implementation, you would update the user's settings in the database
    // and apply the dark mode theme to the entire application
  };
  const handleSignOut = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog(user.id, 'logout', {
          method: 'navbar_button'
        });
      }
      await supabase.auth.signOut();
      localStorage.removeItem('userRole');
      setShowUserMenu(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      setIsSearching(true);
      setShowSearchResults(true);
      // Search courses
      const {
        data: courses,
        error: coursesError
      } = await supabase.from('courses').select('id, title, description, image_url, subject, difficulty_level').or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(3);
      if (coursesError) throw coursesError;
      // Search announcements
      const {
        data: announcements,
        error: announcementsError
      } = await supabase.from('posts').select('id, title, summary, post_type').or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`).eq('is_published', true).or('target_audience.eq.all,target_audience.eq.students').limit(3);
      if (announcementsError) throw announcementsError;
      // If admin, also search users
      let users: any[] = [];
      if (role === 'admin') {
        const {
          data: usersData,
          error: usersError
        } = await supabase.from('users').select('id, full_name, email, avatar_url, role').or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(3);
        if (usersError) throw usersError;
        users = usersData || [];
      }
      // Combine results
      setSearchResults([...(courses || []).map(course => ({
        ...course,
        type: 'course'
      })), ...(announcements || []).map(announcement => ({
        ...announcement,
        type: 'announcement'
      })), ...(users || []).map(user => ({
        ...user,
        type: 'user'
      }))]);
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  const handleSearchItemClick = (item: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    // Navigate based on item type
    switch (item.type) {
      case 'course':
        navigate(role === 'admin' ? `/admin/courses/${item.id}` : `/courses/${item.id}`);
        break;
      case 'announcement':
        navigate(role === 'admin' ? `/admin/announcements/${item.id}/edit` : `/announcements`);
        break;
      case 'user':
        navigate(`/admin/users/${item.id}`);
        break;
      default:
        break;
    }
  };
  // Close search results and user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Close search results if clicking outside
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      // Close user menu if clicking outside
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-30 md:pl-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side with hamburger menu and logo */}
          <div className="flex items-center">
            {/* Hamburger menu - visible on mobile */}
            <button className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" onClick={toggleSidebar} aria-label="Open sidebar">
              <MenuIcon size={24} />
            </button>
            {/* Logo - Visible on mobile when sidebar is collapsed */}
            <div className="flex-shrink-0 flex items-center md:hidden ml-2">
              <Link to={role === 'admin' ? '/admin' : '/dashboard'}>
                <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-8 w-auto" />
              </Link>
            </div>
          </div>
          {/* Search Bar */}
          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-start">
            <div ref={searchRef} id="search-container" className={`relative max-w-lg w-full lg:max-w-xs ${showSearch ? 'block' : 'hidden md:block'}`}>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input id="search-input" name="search" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder={role === 'admin' ? 'Search courses, users, or content...' : 'Search courses, badges, or lessons...'} type="search" value={searchQuery} onChange={e => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 2) {
                  handleSearch(e);
                } else {
                  setShowSearchResults(false);
                }
              }} onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }} aria-label="Search" />
              </form>
              {/* Search Results Dropdown */}
              {showSearchResults && <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="py-1 px-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">
                      Search Results
                    </span>
                    <button className="text-gray-400 hover:text-gray-600" onClick={() => setShowSearchResults(false)}>
                      <XIcon size={14} />
                    </button>
                  </div>
                  {isSearching ? <div className="py-3 px-4 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-1">Searching...</p>
                    </div> : searchResults.length === 0 ? <div className="py-3 px-4 text-center">
                      <p className="text-sm text-gray-500">No results found</p>
                    </div> : <div>
                      {/* Courses */}
                      {searchResults.filter(item => item.type === 'course').length > 0 && <div className="pt-2">
                          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Courses
                          </h3>
                          <div className="mt-1">
                            {searchResults.filter(item => item.type === 'course').map(course => <button key={`course-${course.id}`} className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleSearchItemClick(course)}>
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      {course.image_url ? <img src={course.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                                          <BookIcon size={16} className="text-blue-600" />
                                        </div>}
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-900">
                                        {course.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {course.subject} •{' '}
                                        {course.difficulty_level}
                                      </p>
                                    </div>
                                  </div>
                                </button>)}
                          </div>
                        </div>}
                      {/* Announcements */}
                      {searchResults.filter(item => item.type === 'announcement').length > 0 && <div className="pt-2">
                          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Announcements
                          </h3>
                          <div className="mt-1">
                            {searchResults.filter(item => item.type === 'announcement').map(announcement => <button key={`announcement-${announcement.id}`} className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleSearchItemClick(announcement)}>
                                  <p className="text-sm font-medium text-gray-900">
                                    {announcement.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {announcement.summary}
                                  </p>
                                </button>)}
                          </div>
                        </div>}
                      {/* Users (Admin Only) */}
                      {role === 'admin' && searchResults.filter(item => item.type === 'user').length > 0 && <div className="pt-2">
                            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Users
                            </h3>
                            <div className="mt-1">
                              {searchResults.filter(item => item.type === 'user').map(user => <button key={`user-${user.id}`} className="block w-full text-left px-3 py-2 hover:bg-gray-100" onClick={() => handleSearchItemClick(user)}>
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0">
                                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" /> : <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                            <UserIcon size={16} className="text-gray-600" />
                                          </div>}
                                      </div>
                                      <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">
                                          {user.full_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {user.email} • {user.role}
                                        </p>
                                      </div>
                                    </div>
                                  </button>)}
                            </div>
                          </div>}
                      {/* View All Results Link */}
                      <div className="py-2 px-3 border-t border-gray-100 mt-2">
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium" onClick={() => {
                    setShowSearchResults(false);
                    navigate(`/${role === 'admin' ? 'admin/' : ''}search?q=${encodeURIComponent(searchQuery)}`);
                  }}>
                          View all results
                        </button>
                      </div>
                    </div>}
                </div>}
            </div>
            <button className="md:hidden ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" onClick={toggleSearch} aria-label="Toggle search">
              <SearchIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {/* Right side buttons */}
          <div className="flex items-center">
            {/* Dark Mode Toggle */}
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <SunIcon className="h-5 w-5" aria-hidden="true" /> : <MoonIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
            {/* Help Button */}
            <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Help" onClick={() => setShowHelpModal(true)}>
              <HelpCircleIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Notifications */}
            <Link to={role === 'admin' ? '/admin/notifications' : '/notifications'} className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Notifications">
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              {userProfile.unreadNotifications > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </Link>
            {/* Profile dropdown */}
            <div className="ml-3 relative" ref={userMenuRef}>
              <div>
                <button type="button" className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" id="user-menu-button" aria-expanded={showUserMenu} aria-haspopup="true" onClick={toggleUserMenu}>
                  <span className="sr-only">Open user menu</span>
                  {userProfile.avatar ? <img className="h-8 w-8 rounded-full" src={userProfile.avatar} alt={userProfile.name} /> : <div className={`h-8 w-8 rounded-full flex items-center justify-center ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      <UserIcon className="h-4 w-4" aria-hidden="true" />
                    </div>}
                  <span className="hidden md:flex ml-2 text-sm font-medium text-gray-700">
                    {userProfile.name}
                  </span>
                  <ChevronDownIcon className="hidden md:flex ml-1 h-4 w-4 text-gray-400" aria-hidden="true" />
                </button>
              </div>
              {/* Dropdown menu */}
              {showUserMenu && <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabIndex={-1}>
                  <Link to={role === 'admin' ? '/admin/profile' : '/profile'} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex={-1} onClick={() => setShowUserMenu(false)}>
                    <UserIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                    Your Profile
                  </Link>
                  {role === 'student' && <Link to="/achievements" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex={-1} onClick={() => setShowUserMenu(false)}>
                      <AwardIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                      Achievements
                    </Link>}
                  <Link to={role === 'admin' ? '/admin/settings' : '/settings'} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex={-1} onClick={() => setShowUserMenu(false)}>
                    <SettingsIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                    Settings
                  </Link>
                  <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem" tabIndex={-1} onClick={handleSignOut}>
                    <LogOutIcon className="mr-3 h-4 w-4 text-gray-500" aria-hidden="true" />
                    Sign out
                  </button>
                </div>}
            </div>
          </div>
        </div>
      </div>
      {/* Help Modal */}
      {showHelpModal && <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <HelpCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Help & Support
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Need assistance with ScholarDorm? Here's how you can get
                        help:
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-blue-800">
                            Documentation
                          </h4>
                          <p className="text-xs text-blue-600 mt-1">
                            Browse our comprehensive documentation to find
                            guides and answers to common questions.
                          </p>
                          <a href="#" className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center">
                            View documentation
                            <ChevronDownIcon className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-green-800">
                            Contact Support
                          </h4>
                          <p className="text-xs text-green-600 mt-1">
                            Get personalized help from our support team via
                            email or live chat.
                          </p>
                          <a href="#" className="mt-2 text-xs font-medium text-green-700 hover:text-green-900 flex items-center">
                            Contact support
                            <ChevronDownIcon className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-md">
                          <h4 className="text-sm font-medium text-purple-800">
                            Frequently Asked Questions
                          </h4>
                          <p className="text-xs text-purple-600 mt-1">
                            Find quick answers to the most common questions
                            about using ScholarDorm.
                          </p>
                          <a href="#" className="mt-2 text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center">
                            View FAQs
                            <ChevronDownIcon className="ml-1 h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowHelpModal(false)}>
                  Got it
                </button>
                <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" onClick={() => setShowHelpModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>}
    </nav>;
};