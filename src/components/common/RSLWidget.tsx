import React, { useState, useEffect, useRef } from 'react';
import { VideoIcon, BookOpenIcon, PlayIcon, SettingsIcon, ChevronRightIcon, EyeIcon, VolumeXIcon } from 'lucide-react';
import { RSLService, RSLVideo, RSLSign, RSLAccessibilitySettings, getCategoryDisplayName, getCategoryIcon } from '../../lib/rsl-service';

interface RSLWidgetProps {
  userId: string;
  variant?: 'compact' | 'full' | 'sidebar';
  onOpenFullModal?: () => void;
  className?: string;
}

export const RSLWidget: React.FC<RSLWidgetProps> = ({
  userId,
  variant = 'compact',
  onOpenFullModal,
  className = ''
}) => {
  const [featuredVideos, setFeaturedVideos] = useState<RSLVideo[]>([]);
  const [quickSigns, setQuickSigns] = useState<RSLSign[]>([]);
  const [accessibilitySettings, setAccessibilitySettings] = useState<RSLAccessibilitySettings>({
    show_captions: true,
    video_speed: 1.0,
    high_contrast: false,
    large_text: false,
    auto_repeat: false,
    sign_descriptions: true,
  });
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadContent();
  }, [userId]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = accessibilitySettings.video_speed;
    }
  }, [accessibilitySettings.video_speed, currentVideoIndex]);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Load featured videos and accessibility settings
      const [videos, settings, educationSigns] = await Promise.all([
        RSLService.getFeaturedVideos(3),
        RSLService.getAccessibilitySettings(userId),
        RSLService.getSignsByCategory('education')
      ]);

      setFeaturedVideos(videos);
      setAccessibilitySettings(settings);
      setQuickSigns(educationSigns.slice(0, 4));
    } catch (error) {
      console.error('Error loading RSL widget content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200 ${className} ${accessibilitySettings.high_contrast ? 'bg-black border-white' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${accessibilitySettings.high_contrast ? 'bg-white text-black' : 'bg-purple-100 text-purple-600'}`}>
              <VideoIcon size={16} />
            </div>
            <h3 className={`font-medium ${accessibilitySettings.large_text ? 'text-lg' : 'text-sm'} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
              RSL Quick Access
            </h3>
          </div>
          {accessibilitySettings.high_contrast && (
            <div className="flex items-center space-x-1">
              <EyeIcon size={14} className="text-white" />
              <VolumeXIcon size={14} className="text-white" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {featuredVideos.slice(0, 2).map((video, _index) => (
            <button
              key={video.id}
              onClick={onOpenFullModal}
              className={`w-full text-left p-2 rounded-lg transition-colors ${
                accessibilitySettings.high_contrast 
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white hover:bg-purple-50 border border-purple-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getCategoryIcon(video.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${accessibilitySettings.large_text ? 'text-base' : 'text-sm'}`}>
                    {video.title}
                  </p>
                  <p className={`text-xs truncate ${accessibilitySettings.large_text ? 'text-sm' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-500'}`}>
                    {getCategoryDisplayName(video.category)}
                  </p>
                </div>
                <PlayIcon size={14} className={accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-purple-400'} />
              </div>
            </button>
          ))}
        </div>
        
        <button
          onClick={onOpenFullModal}
          className={`w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            accessibilitySettings.high_contrast
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          View All RSL Resources
        </button>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`${className} ${accessibilitySettings.high_contrast ? 'bg-black border-white' : 'bg-white border-gray-200'} rounded-lg border shadow-sm`}>
        <div className={`p-4 border-b ${accessibilitySettings.high_contrast ? 'border-white' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-2">
            <VideoIcon size={20} className={accessibilitySettings.high_contrast ? 'text-white' : 'text-purple-600'} />
            <h3 className={`font-semibold ${accessibilitySettings.large_text ? 'text-lg' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
              RSL Learning
            </h3>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h4 className={`font-medium mb-2 ${accessibilitySettings.large_text ? 'text-base' : 'text-sm'} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-700'}`}>
              Quick Signs
            </h4>
            <div className="space-y-2">
              {quickSigns.map((sign) => (
                <div
                  key={sign.id}
                  className={`p-2 rounded-lg ${accessibilitySettings.high_contrast ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getCategoryIcon(sign.category)}</span>
                    <span className={`text-sm font-medium ${accessibilitySettings.large_text ? 'text-base' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
                      {sign.word}
                    </span>
                  </div>
                  {accessibilitySettings.sign_descriptions && (
                    <p className={`text-xs mt-1 ${accessibilitySettings.large_text ? 'text-sm' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                      {sign.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className={`font-medium mb-2 ${accessibilitySettings.large_text ? 'text-base' : 'text-sm'} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-700'}`}>
              Featured Videos
            </h4>
            <div className="space-y-2">
              {featuredVideos.slice(0, 3).map((video) => (
                <button
                  key={video.id}
                  onClick={onOpenFullModal}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    accessibilitySettings.high_contrast
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getCategoryIcon(video.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${accessibilitySettings.large_text ? 'text-base' : 'text-sm'}`}>
                        {video.title}
                      </p>
                      <p className={`text-xs ${accessibilitySettings.large_text ? 'text-sm' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-500'}`}>
                        {Math.floor(video.duration_seconds / 60)}min
                      </p>
                    </div>
                    <PlayIcon size={12} className={accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-400'} />
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={onOpenFullModal}
            className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              accessibilitySettings.high_contrast
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            Open RSL Center
          </button>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`${className} ${accessibilitySettings.high_contrast ? 'bg-black border-white' : 'bg-white border-gray-200'} rounded-lg border shadow-sm`}>
      <div className={`p-6 border-b ${accessibilitySettings.high_contrast ? 'border-white' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${accessibilitySettings.high_contrast ? 'bg-white text-black' : 'bg-purple-100 text-purple-600'}`}>
              <VideoIcon size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${accessibilitySettings.large_text ? 'text-2xl' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
                RSL Learning Center
              </h3>
              <p className={`${accessibilitySettings.large_text ? 'text-lg' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                Enhance your learning with sign language
              </p>
            </div>
          </div>
          <button
            onClick={onOpenFullModal}
            className={`p-2 rounded-lg transition-colors ${
              accessibilitySettings.high_contrast
                ? 'text-white hover:bg-white hover:text-black'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Featured Video */}
        <div>
          <h4 className={`font-semibold mb-3 ${accessibilitySettings.large_text ? 'text-lg' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
            Featured Learning Video
          </h4>
          {featuredVideos.length > 0 && (
            <div className="space-y-3">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  poster={featuredVideos[currentVideoIndex]?.thumbnail_url}
                  controls
                >
                  <source src={featuredVideos[currentVideoIndex]?.video_url} type="video/mp4" />
                  {accessibilitySettings.show_captions && (
                    <track kind="captions" src="#" srcLang="en" label="English" default />
                  )}
                </video>
              </div>
              <div>
                <h5 className={`font-medium ${accessibilitySettings.large_text ? 'text-lg' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
                  {getCategoryIcon(featuredVideos[currentVideoIndex]?.category)} {featuredVideos[currentVideoIndex]?.title}
                </h5>
                <p className={`text-sm mt-1 ${accessibilitySettings.large_text ? 'text-base' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                  {featuredVideos[currentVideoIndex]?.description}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Access Signs */}
        <div>
          <h4 className={`font-semibold mb-3 ${accessibilitySettings.large_text ? 'text-lg' : ''} ${accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'}`}>
            Essential Signs
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {quickSigns.map((sign) => (
              <div
                key={sign.id}
                className={`p-3 rounded-lg border ${
                  accessibilitySettings.high_contrast
                    ? 'bg-gray-800 border-white text-white'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                } transition-colors cursor-pointer`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(sign.category)}</span>
                  <span className={`font-medium ${accessibilitySettings.large_text ? 'text-lg' : ''}`}>
                    {sign.word}
                  </span>
                </div>
                {accessibilitySettings.sign_descriptions && (
                  <p className={`text-xs ${accessibilitySettings.large_text ? 'text-sm' : ''} ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                    {sign.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={onOpenFullModal}
            className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              accessibilitySettings.high_contrast
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            <BookOpenIcon size={18} />
            <span>Explore Full RSL Dictionary</span>
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};