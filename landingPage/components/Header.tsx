import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MenuIcon, XIcon, ArrowLeftIcon } from 'lucide-react'

export const Header = () => {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      // If no history, navigate to home
      navigate('/')
    }
  }

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Go back"
          >
            <ArrowLeftIcon size={16} className="text-slate-600" />
          </button>
          <div className="flex items-center">
            <img
              src="/SCHOLARDORM_LOGO.png"
              alt="ScholarDorm Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="ml-2 text-xl font-bold text-primary-800">
              ScholarDorm
            </span>
          </div>
        </div>
        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <Link
            to="/features"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            Features
          </Link>
          <Link
            to="/rsl"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            RSL Learning
          </Link>
          <Link
            to="/about"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="text-slate-700 hover:text-primary-600 transition-colors font-medium"
          >
            Contact
          </Link>
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
        <div ref={menuRef} className="md:hidden bg-white border-t border-slate-200 animate-slide-down">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/features"
              onClick={() => setIsMenuOpen(false)}
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              Features
            </Link>
            <Link
              to="/rsl"
              onClick={() => setIsMenuOpen(false)}
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              RSL Learning
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="text-slate-700 hover:text-primary-600 transition-colors font-medium py-2"
            >
              Contact
            </Link>
            <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200">
              <Link
                to="/login"
                onClick={() => {
                  console.log('Login link clicked from mobile menu');
                  setIsMenuOpen(false);
                }}
                className="px-4 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors text-left"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => {
                  console.log('Signup link clicked from mobile menu');
                  setIsMenuOpen(false);
                }}
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