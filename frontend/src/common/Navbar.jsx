import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { HashLink as Link } from 'react-router-hash-link'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { userData, backendUrl, logout } = useContext(Appcontext)
  const [avatarError, setAvatarError] = useState(false)

  const isLoggedIn = !!userData
  const serviceLink = userData?.role === 'lawyer' ? '/#ServicesLawyer' : '/#Services'

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // no dropdown: avatar click navigates directly to profile

  const handleLogout = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (e && e.stopPropagation) e.stopPropagation()

    // Clear client-side session immediately and navigate to landing page
    logout()
    setIsMobileMenuOpen(false)
    navigate('/')

    // Send logout to backend in background to clear httpOnly cookies
    axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true })
      .then(() => {
        toast.success('Logged out successfully!')
      })
      .catch(() => {
        toast.error('Backend logout failed (cookies may remain).')
      })
  }

  const handleProfileDirect = () => {
    setIsMobileMenuOpen(false)
    if (userData?.role === 'admin') {
      navigate('/admin/profile')
    } else {
      navigate('/profile')
    }
  }

  const getUserInitial = () => {
    return userData?.userName ? userData.userName.charAt(0).toUpperCase() : 'U'
  }

  return (
    <>
      <div className="absolute top-0 left-0 w-full z-10">
        <div className="container mx-auto flex justify-between items-center py-4 px-6 md:px-20 lg:px-32 bg-transparent">
          <div className="flex items-center gap-3">
            <p className="text-white text-2xl font-bold">LAW AID</p>
          </div>

          <ul className="hidden md:flex gap-7 text-white text-lg">
            <Link to="/" className="cursor-pointer hover:text-amber-600 transition-colors">Home</Link>
            <Link smooth to={serviceLink} className="cursor-pointer hover:text-amber-600 transition-colors">Service</Link>
            <Link smooth to="/#About" className="cursor-pointer hover:text-amber-600 transition-colors">About us</Link>
            <Link smooth to="/#Footer" className="cursor-pointer hover:text-amber-600 transition-colors">Contact us</Link>
          </ul>

          <div className="relative">
            {isLoggedIn ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div
                    onClick={handleProfileDirect}
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 border-white"
                    title="View profile"
                  >
                    {userData?.profilePic?.path && !avatarError ? (
                      <img
                        src={`${backendUrl}/${userData.profilePic.path}`}
                        alt='avatar'
                        className='w-full h-full object-cover'
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="bg-amber-700 w-full h-full flex items-center justify-center text-white font-semibold">{getUserInitial()}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:block bg-amber-700 hover:bg-amber-800 text-white font-semibold px-8 py-3 rounded-lg transition"
              >
                Log in
              </button>
            )}
          </div>

          <button onClick={toggleMobileMenu} className="md:hidden text-white focus:outline-none z-50">
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

        {/* Mobile Menu */}
        <div
          className={`fixed top-0 right-0 h-full w-64 bg-amber-700 transform transition-transform duration-300 md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } z-40`}
        >
          <div className="flex flex-col h-full pt-20 px-8">
            <ul className="flex flex-col gap-6 text-white text-xl">
              <Link to="/" onClick={closeMobileMenu} className="cursor-pointer hover:text-white/70">Home</Link>
              <Link smooth to={serviceLink} onClick={closeMobileMenu} className="cursor-pointer hover:text-white/70">Service</Link>
              <Link smooth to="/#About" onClick={closeMobileMenu} className="cursor-pointer hover:text-white/70">About us</Link>
              <Link smooth to="/#Footer" onClick={closeMobileMenu} className="cursor-pointer hover:text-white/70">Contact us</Link>
            </ul>

            <div className="mt-auto mb-8">
              {isLoggedIn ? (
                <div className="flex flex-col gap-3">
                  {userData?.userName && (
                    <div className="text-white text-center mb-2 pb-3 border-b border-white/20">
                      <p className="font-semibold">{userData.userName}</p>
                      <p className="text-xs text-white/70 capitalize">{userData.role}</p>
                    </div>
                  )}

                  <button
                    onClick={handleProfileDirect}
                    className="w-full bg-white hover:bg-white/90 text-amber-700 font-semibold px-8 py-3 rounded-lg"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-lg"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-white hover:bg-white/90 text-amber-700 font-semibold px-8 py-3 rounded-lg"
                >
                  Log in
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Background overlay for mobile menu */}
        {isMobileMenuOpen && <div onClick={closeMobileMenu} className="fixed inset-0 bg-black/50 z-30 md:hidden"></div>}
      </div>
    </>
  )
}

export default Navbar
