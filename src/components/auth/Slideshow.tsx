import React, { useCallback, useEffect, useState } from 'react';
// import { SlideContent } from './SlideContent';
import { PauseIcon, PlayIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
const slides = [{
  title: 'Empowering Students with Hearing Impairments',
  description: 'An inclusive education platform designed specifically for you',
  imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop',
  altText: 'Diverse group of students using sign language while learning',
  accent: 'from-blue-900 to-blue-700'
}, {
  title: 'Track Your Progress',
  description: 'Earn badges and maintain streaks to stay motivated',
  imageUrl: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efd?q=80&w=1470&auto=format&fit=crop',
  altText: 'Student achievement tracking with badges and progress bars',
  accent: 'from-blue-800 to-blue-600'
}, {
  title: 'Rwandan Sign Language Integration',
  description: 'All content is accessible with integrated RSL support',
  imageUrl: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=1470&auto=format&fit=crop',
  altText: 'Person using sign language to communicate',
  accent: 'from-blue-700 to-blue-500'
}, {
  title: 'Join Our Learning Community',
  description: 'Connect with peers and learn together in Rwanda',
  imageUrl: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?q=80&w=1470&auto=format&fit=crop',
  altText: 'Students collaborating in a classroom setting',
  accent: 'from-blue-800 to-blue-600'
}, {
  title: 'Start Your Journey Today',
  description: 'Begin your educational adventure with ScholarDorm',
  imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1470&auto=format&fit=crop',
  altText: 'Student looking motivated and ready to learn',
  accent: 'from-blue-900 to-blue-700'
}];
export const Slideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => prev === slides.length - 1 ? 0 : prev + 1);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);
  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);
  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    // Reset transition state after animation completes
    setTimeout(() => setIsTransitioning(false), 700);
  };
  const togglePlayPause = () => {
    setIsPlaying(prev => !prev);
  };
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isTransitioning) {
      interval = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, nextSlide, isTransitioning]);
  return <div className="relative h-full w-full overflow-hidden">
      {/* Logo overlay */}
      <div className="absolute top-6 left-0 right-0 z-10 flex justify-center">
        <img src="/SCHOLARDORM_LOGO.png" alt="ScholarDorm Logo" className="h-14 w-auto" />
      </div>

      {/* Slides */}
      {slides.map((slide, index) => <div key={index} className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${currentSlide === index ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`} aria-hidden={currentSlide !== index}>
          {/* Background gradient and image */}
          <div className={`absolute inset-0 bg-gradient-to-b ${slide.accent} z-0`} />
          <div className="absolute inset-0 bg-cover bg-center opacity-40 z-0" style={{
        backgroundImage: `url(${slide.imageUrl})`
      }} />
          {/* Slide content */}
          <div className="relative z-10 max-w-md mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {slide.title}
            </h2>
            <p className="text-xl text-white/90 mb-6">{slide.description}</p>
            {index === slides.length - 1 && <button className="bg-white hover:bg-gray-100 text-blue-800 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg" onClick={() => {
          // Focus on the email input in the login form
          const emailInput = document.getElementById('email');
          if (emailInput) emailInput.focus();
        }}>
                Get Started
              </button>}
          </div>
        </div>)}

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-20">
        {/* Dots */}
        <div className="flex space-x-3 mb-5" role="tablist">
          {slides.map((_, index) => <button key={index} onClick={() => goToSlide(index)} className={`w-3 h-3 rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-blue-800 transition-all ${currentSlide === index ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`} role="tab" aria-selected={currentSlide === index} aria-label={`Go to slide ${index + 1}`} />)}
        </div>
        {/* Play/Pause and Arrow Controls */}
        <div className="flex items-center space-x-4">
          <button onClick={prevSlide} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-colors" aria-label="Previous slide" disabled={isTransitioning}>
            <ChevronLeftIcon size={20} />
          </button>
          <button onClick={togglePlayPause} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-colors" aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}>
            {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button onClick={nextSlide} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white transition-colors" aria-label="Next slide" disabled={isTransitioning}>
            <ChevronRightIcon size={20} />
          </button>
        </div>
      </div>
    </div>;
};