import React, { useState, useContext, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { HashLink as Link } from 'react-router-hash-link'
import Login from './Login'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()
  const { token, setToken, backendUrl, userData, setUserData } = useContext(Appcontext)
  const profileRef = useRef(null)

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ✅ FIXED: Handle logout with proper cleanup
  const handleLogout = async () => {
    console.log('Logout initiated')
    
    try {
      // Try to call backend logout endpoint
      await axios.post(
        `${backendUrl}/api/auth/logout`,
        {},
        { withCredentials: true }
      )
      console.log('Backend logout successful')
    } catch (error) {
      console.error('Backend logout error:', error)
      // Continue with local cleanup even if backend fails
    }
    
    // ✅ FIXED: Clear ALL possible token storage
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('userId')
    
    // ✅ Clear context state
    setToken(null)
    if (setUserData) {
      setUserData(null)
    }
    
    // Close menus
    setShowProfileMenu(false)
    closeMobileMenu()
    
    // Show success message
    toast.success('Logged out successfully!')
    
    // Navigate to home
    navigate('/')
  }

  // Get user initials for avatar
  const getUserInitial = () => {
    if (userData?.userName) {
      return userData.userName.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <>
      <div className='absolute top-0 left-0 w-full z-10'>
        <div className='container mx-auto flex justify-between items-center py-4 px-6 md:px-20 lg:px-32 bg-transparent'>
          {/* Logo */}
          <div className='flex items-center gap-3'>
            <img src={logo} alt="logo" className='h-10' />
            <p className='text-white text-2xl font-inria font-bold'>LAW AID</p>
          </div>

          {/* Desktop Menu */}
          <ul className='hidden md:flex gap-7 text-white font-allison text-lg'>
            <Link to="/" className='cursor-pointer hover:text-brownforhover transition-colors duration-300'>Home</Link>
            <Link smooth to="/#Services" className='cursor-pointer hover:text-brownforhover transition-colors duration-300'>Service</Link>
            <Link smooth to="/#About" className='cursor-pointer hover:text-brownforhover transition-colors duration-300'>About us</Link>
            <Link smooth to="/#Footer" className='cursor-pointer hover:text-brownforhover transition-colors duration-300'>Contact us</Link>
          </ul>

          {/* Desktop Login/Profile */}
          <div className='relative' ref={profileRef}>
            {token ? (
              <div>
                {/* Profile Avatar Button */}
                <div 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className='flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity'
                >
                  <div className='w-10 h-10 rounded-full bg-brownBG flex items-center justify-center text-white font-semibold text-lg shadow-md'>
                    {getUserInitial()}
                  </div>
                  <svg 
                    className={`w-4 h-4 text-white transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className='absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50'>
                    {/* User Info */}
                    {userData?.userName && (
                      <div className='px-4 py-2 border-b border-gray-200'>
                        <p className='text-sm font-semibold text-gray-800'>{userData.userName}</p>
                        <p className='text-xs text-gray-500 capitalize'>{userData.role || 'User'}</p>
                      </div>
                    )}

                    {/* Menu Items */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowProfileMenu(false)
                        navigate('/profile')
                      }}
                      className='w-full text-left px-4 py-2 text-gray-700 hover:bg-brownBG/10 hover:text-brownBG transition-colors flex items-center gap-2'
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLogout()
                      }}
                      className='w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2'
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className='hidden md:block bg-brownBG hover:bg-brownforhover text-white font-inria font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105'
              >
                Log in
              </button>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button onClick={toggleMobileMenu} className='md:hidden text-white focus:outline-none z-50'>
            {isMobileMenuOpen ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed top-0 right-0 h-full w-64 bg-brownBG transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'} z-40`}>
          <div className='flex flex-col h-full pt-20 px-8'>
            <ul className='flex flex-col gap-6 text-white font-allison text-xl'>
              <Link to="/" onClick={closeMobileMenu} className='cursor-pointer hover:text-white/70 py-2'>Home</Link>
              <Link smooth to="/#Services" onClick={closeMobileMenu} className='cursor-pointer hover:text-white/70 py-2'>Service</Link>
              <Link smooth to="/#About" onClick={closeMobileMenu} className='cursor-pointer hover:text-white/70 py-2'>About us</Link>
              <Link smooth to="/#Footer" onClick={closeMobileMenu} className='cursor-pointer hover:text-white/70 py-2'>Contact us</Link>
            </ul>

            {/* Mobile User Section */}
            <div className='mt-auto mb-8'>
              {token ? (
                <div className='flex flex-col gap-3'>
                  {/* User Info */}
                  {userData?.userName && (
                    <div className='text-white text-center mb-2 pb-3 border-b border-white/20'>
                      <div className='w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-xl'>
                        {getUserInitial()}
                      </div>
                      <p className='font-semibold'>{userData.userName}</p>
                      <p className='text-xs text-white/70 capitalize'>{userData.role || 'User'}</p>
                    </div>
                  )}

                  <button
                    onClick={() => { 
                      closeMobileMenu()
                      navigate('/profile')
                    }}
                    className='w-full bg-white hover:bg-white/90 text-brownBG font-inria font-semibold px-8 py-3 rounded-lg transition-all'
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className='w-full bg-white/20 hover:bg-white/30 text-white font-inria font-semibold px-8 py-3 rounded-lg transition-all'
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { closeMobileMenu(); setShowLogin(true) }}
                  className='w-full bg-white hover:bg-white/90 text-brownBG font-inria font-semibold px-8 py-3 rounded-lg transition-all'
                >
                  Log in
                </button>
              )}
            </div>
          </div>
        </div>

        {isMobileMenuOpen && <div onClick={closeMobileMenu} className='fixed inset-0 bg-black/50 z-30 md:hidden'></div>}
      </div>

      {/* Login Modal */}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
    </>
  )
}

export default Navbar