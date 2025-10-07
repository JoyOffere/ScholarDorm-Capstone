import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenIcon, MenuIcon, XIcon } from 'lucide-react'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <BookOpenIcon className="h-8 w-8 text-primary-600" />
          <span className="ml-2 text-xl font-bold text-primary-800">
            ScholarDorm
          </span>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <a
            href="#features"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#rsl"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            RSL Learning
          </a>
          <a
            href="#how-it-works"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            How It Works
          </a>
          <a
            href="#testimonials"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            Testimonials
          </a>
        </nav>
        <div className="hidden md:flex items-center space-x-4">
          <Link
            to="/login"
            onClick={() => console.log('Login link clicked from header')}
            className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/signup"
            onClick={() => console.log('Signup link clicked from header')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Sign Up
          </Link>
        </div>
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-slate-700"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <a
              href="#features"
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              Features
            </a>
            <a
              href="#rsl"
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              RSL Learning
            </a>
            <a
              href="#how-it-works"
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              Testimonials
            </a>
            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200">
              <Link
                to="/login"
                onClick={() => console.log('Login link clicked from mobile menu')}
                className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors text-left"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => console.log('Signup link clicked from mobile menu')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}