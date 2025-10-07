import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SettingsIcon, ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon, Volume2Icon, VolumeXIcon, FullscreenIcon, AlertCircleIcon, FileTextIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { RSLVideo, RSLSign, RSLCategory, getCategoryDisplayName, getCategoryIcon } from '../../lib/rsl-service';
import Avatar from '../common/Avatar';

interface RSLModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

interface AccessibilitySettings {
  show_captions: boolean;
  video_speed: number;
  high_contrast: boolean;
  large_text: boolean;
  auto_repeat: boolean;
  sign_descriptions: boolean;
}

interface RSLContent {
  type: 'video' | 'sign';
  data: RSLVideo | RSLSign;
}

export const RSLModal: React.FC<RSLModalProps> = ({ isOpen, onClose, userId }) => {
  const [content, setContent] = useState<RSLContent[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    show_captions: true,
    video_speed: 1.0,
    high_contrast: false,
    large_text: false,
    auto_repeat: false,
    sign_descriptions: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen, userId]);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      const [videosData, signsData] = await Promise.all([
        supabase.from('rsl_videos').select('*').eq('is_active', true).limit(8),
        supabase.from('rsl_signs').select('*').eq('is_active', true).limit(4)
      ]);

      if (videosData.error) throw videosData.error;
      if (signsData.error) throw signsData.error;

      const combinedContent: RSLContent[] = [
        ...videosData.data.map(video => ({ type: 'video' as const, data: video })),
        ...signsData.data.map(sign => ({ type: 'sign' as const, data: sign }))
      ];

      setContent(combinedContent);
    } catch (err: any) {
      console.error('Error loading RSL content:', err);
      setError(err.message || 'Failed to load RSL content');
    } finally {
      setLoading(false);
    }
  };

  const updateAccessibilitySettings = async (updates: Partial<AccessibilitySettings>) => {
    const newSettings = { ...accessibilitySettings, ...updates };
    setAccessibilitySettings(newSettings);
    if (userId) {
      await supabase.from('users').update({ accessibility_preferences: newSettings }).eq('id', userId);
    }
  };

  const requestFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
    }
  };

  if (!isOpen) return null;

  const videos = content.filter(c => c.type === 'video').map(c => c.data as RSLVideo);
  const currentVideo = videos[currentVideoIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden transition-all duration-300 ${
          accessibilitySettings.high_contrast ? 'bg-gray-900 text-white border-2 border-white' : ''
        }`}
      >
        <div className={`p-6 border-b flex justify-between items-center ${accessibilitySettings.high_contrast ? 'border-white' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${accessibilitySettings.large_text ? 'text-3xl' : ''} ${
            accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'
          }`}>
            Rwandan Sign Language Learning Center
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${
                accessibilitySettings.high_contrast ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Toggle accessibility settings"
            >
              <SettingsIcon size={24} />
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                accessibilitySettings.high_contrast ? 'text-white hover:bg-white/20' : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-label="Close modal"
            >
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className={`p-6 border-b ${accessibilitySettings.high_contrast ? 'border-white bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`font-semibold text-lg ${accessibilitySettings.large_text ? 'text-xl' : ''}`}>Accessibility Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={accessibilitySettings.show_captions}
                  onChange={(e) => updateAccessibilitySettings({ show_captions: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`ml-2 ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>Show Captions</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={accessibilitySettings.high_contrast}
                  onChange={(e) => updateAccessibilitySettings({ high_contrast: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`ml-2 ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>High Contrast</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={accessibilitySettings.large_text}
                  onChange={(e) => updateAccessibilitySettings({ large_text: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`ml-2 ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>Large Text</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={accessibilitySettings.auto_repeat}
                  onChange={(e) => updateAccessibilitySettings({ auto_repeat: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`ml-2 ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>Auto Repeat</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={accessibilitySettings.sign_descriptions}
                  onChange={(e) => updateAccessibilitySettings({ sign_descriptions: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className={`ml-2 ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>Sign Descriptions</span>
              </label>
              <div className="sm:col-span-2">
                <label className={`block font-medium ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>
                  Video Speed: {accessibilitySettings.video_speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={accessibilitySettings.video_speed}
                  onChange={(e) => updateAccessibilitySettings({ video_speed: parseFloat(e.target.value) })}
                  className="w-full mt-2 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading RSL content...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          ) : videos.length > 0 ? (
            <>
              <div className="relative mb-6">
                <div className="w-full bg-gray-100 rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16 / 9' }}>
                  <iframe
                    ref={videoRef}
                    className="w-full h-full"
                    src={currentVideo?.video_url.replace('watch?v=', 'embed/') + '?controls=0&rel=0'}
                    title={currentVideo?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-black/50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-white rounded-full opacity-50 cursor-not-allowed"
                        aria-label="Play/Pause video (disabled)"
                        disabled
                      >
                        <PlayIcon size={20} />
                      </button>
                      <button
                        className="p-2 text-white rounded-full opacity-50 cursor-not-allowed"
                        aria-label="Mute/Unmute video (disabled)"
                        disabled
                      >
                        <Volume2Icon size={20} />
                      </button>
                    </div>
                    <button
                      onClick={requestFullscreen}
                      className="p-2 text-white hover:bg-black/70 rounded-full"
                      aria-label="Enter fullscreen"
                    >
                      <FullscreenIcon size={20} />
                    </button>
                  </div>
                </div>
                {videos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))}
                      disabled={currentVideoIndex === 0}
                      className="absolute top-1/2 left-4 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 transition-all"
                      aria-label="Previous video"
                    >
                      <ChevronLeftIcon size={24} />
                    </button>
                    <button
                      onClick={() => setCurrentVideoIndex(Math.min(videos.length - 1, currentVideoIndex + 1))}
                      disabled={currentVideoIndex === videos.length - 1}
                      className="absolute top-1/2 right-4 -translate-y-1/2 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 transition-all"
                      aria-label="Next video"
                    >
                      <ChevronRightIcon size={24} />
                    </button>
                  </>
                )}
              </div>

              {currentVideo && (
                <div className="mb-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-4">
                      <Avatar label={getCategoryIcon(currentVideo.category)} size={48} className="bg-blue-100 text-blue-600" />
                      <div>
                        <h3 className={`font-bold ${accessibilitySettings.large_text ? 'text-2xl' : 'text-xl'} ${
                          accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'
                        }`}>
                          {currentVideo.title}
                        </h3>
                        <div className={`text-sm ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                          {getCategoryDisplayName(currentVideo.category)}
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      accessibilitySettings.high_contrast ? 'bg-white text-black' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getCategoryDisplayName(currentVideo.category)}
                    </span>
                  </div>
                  {accessibilitySettings.sign_descriptions && (
                    <p className={`text-base ${accessibilitySettings.large_text ? 'text-lg' : ''} ${
                      accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'
                    } line-clamp-3`}>
                      {currentVideo.description}
                    </p>
                  )}
                </div>
              )}

              {videos.length > 1 && (
                <div className="mb-6">
                  <h4 className={`font-semibold text-lg ${accessibilitySettings.large_text ? 'text-xl' : ''} ${
                    accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'
                  }`}>
                    Video Playlist ({currentVideoIndex + 1}/{videos.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3 max-h-48 overflow-y-auto">
                    {videos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => setCurrentVideoIndex(index)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                          index === currentVideoIndex
                            ? (accessibilitySettings.high_contrast ? 'bg-white text-black' : 'bg-blue-100 text-blue-800')
                            : (accessibilitySettings.high_contrast ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100')
                        }`}
                      >
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-16 h-9 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className={`font-medium truncate ${accessibilitySettings.large_text ? 'text-base' : 'text-sm'}`}>
                            {video.title}
                          </div>
                          <div className="text-xs opacity-75">{getCategoryDisplayName(video.category)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h4 className={`font-semibold text-lg ${accessibilitySettings.large_text ? 'text-xl' : ''} ${
                  accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'
                }`}>
                  Key Signs
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  {content.filter(c => c.type === 'sign').map(sign => (
                    <div
                      key={sign.data.id}
                      className={`p-4 rounded-lg ${
                        accessibilitySettings.high_contrast ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={(sign.data as RSLSign).image_url || '/placeholder-sign.png'}
                          alt={(sign.data as RSLSign).word}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <div>
                          <h5 className={`font-semibold ${accessibilitySettings.large_text ? 'text-lg' : 'text-base'}`}>
                            {(sign.data as RSLSign).word}
                          </h5>
                          <p className={`text-sm ${accessibilitySettings.large_text ? 'text-base' : ''} line-clamp-2`}>
                            {(sign.data as RSLSign).description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <FileTextIcon size={48} className={`mx-auto ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-400'} mb-4`} />
              <p className={`text-lg ${accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-600'}`}>
                No RSL content available at the moment. Please try again later.
              </p>
            </div>
          )}

          <div className="mt-6">
            <h3 className={`font-semibold text-lg ${accessibilitySettings.large_text ? 'text-xl' : ''} ${
              accessibilitySettings.high_contrast ? 'text-white' : 'text-gray-900'
            }`}>
              Learn with RSL
            </h3>
            <p className={`mt-2 text-base ${accessibilitySettings.large_text ? 'text-lg' : ''} ${
              accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-700'
            }`}>
              This modal provides interactive Rwandan Sign Language (RSL) resources to enhance accessibility and learning on the ScholarDorm platform.
            </p>
            <ul className={`list-disc pl-6 mt-3 text-base ${accessibilitySettings.large_text ? 'text-lg' : ''} ${
              accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <li>Master greetings and introductions</li>
              <li>Learn academic and navigational signs</li>
              <li>Practice question and answer signs</li>
              <li>Explore cultural and educational vocabulary</li>
            </ul>
            <p className={`mt-3 text-base ${accessibilitySettings.large_text ? 'text-lg' : ''} ${
              accessibilitySettings.high_contrast ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Visit the <a href="/rsl" className="text-blue-600 hover:underline">RSL Resources page</a> for more comprehensive materials.
            </p>
          </div>
        </div>

        <div className={`p-4 border-t flex justify-end ${accessibilitySettings.high_contrast ? 'border-white' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};