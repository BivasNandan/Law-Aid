import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const SignupPage = () => {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(null)
  const navigate = useNavigate()
  const { backendUrl, setUserData } = useContext(Appcontext)

  // Get role from localStorage (set by Role.jsx page)
  useEffect(() => {
    const selectedRole = localStorage.getItem('selectedRole')
    if (!selectedRole) {
      console.warn('⚠️ No role selected. Redirecting to role selection...')
      toast.error('Please select a role first')
      navigate('/role')
      return
    }
    setRole(selectedRole)
    console.log('🎭 Role loaded from localStorage:', selectedRole)
  }, [navigate])

  const validatePassword = (pass) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass)
  }

  const handleSignup = async (e) => {
    e.preventDefault()

    if (!userName || !email || !password || !confirmPassword) {
      toast.error('All fields are required')
      return
    }

    if (!validatePassword(password)) {
      toast.error('Password must be 8+ chars with uppercase, lowercase, number, and special character')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!role) {
      toast.error('No role selected. Please go back and select a role.')
      navigate('/role')
      return
    }

    setLoading(true)
    try {
      console.log(`📝 Registering as ${role}:`, { userName, email })
      console.log(`📝 Sending role: ${role}`)
      
      const res = await axios.post(
        `${backendUrl}/api/auth/register`, 
        { userName, email, password, role },
        { withCredentials: true }
      )
      
      console.log('✅ Signup successful:', res.data)
      
      // Immediately log the user in so auth cookies are set for protected routes
      let loggedInUser = null
      try {
        const loginRes = await axios.post(
          `${backendUrl}/api/auth/login`,
          { email, password },
          { withCredentials: true }
        )
        loggedInUser = loginRes.data?.user
      } catch (loginErr) {
        console.error('❌ Auto-login after signup failed:', loginErr)
        toast.error(loginErr.response?.data?.message || 'Signup succeeded but login failed. Please login manually.')
        navigate('/login', { replace: true })
        return
      }

      if (!loggedInUser?._id) {
        toast.error('Login succeeded but no user data returned')
        return
      }

      setUserData(loggedInUser)

      toast.success('Account created! Now complete your profile')
      
      // Navigate to details page based on role
      if (role === 'lawyer') {
        console.log('👨‍⚖️ Redirecting lawyer to profile completion...')
        navigate('/lawyer-details', { state: { userId: res.data.user._id } })
      } else if (role === 'client') {
        console.log('👤 Redirecting client to profile completion...')
        navigate('/client-details', { state: { userId: res.data.user._id } })
      } else {
        console.warn('⚠️ Unknown role:', role)
        navigate('/')
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      toast.error(error.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-amber-700 mx-auto mb-4'></div>
          <p className='text-gray-700'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
      <div className='relative w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <button
            onClick={() => navigate('/')}
            aria-label="Close signup"
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-gray-100 transition"
            title="Close and return to landing page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className='text-3xl font-bold text-amber-900 mb-2 text-center'>Create Account</h2>
          <p className='text-center text-gray-600 mb-6'>Signing up as <span className='font-semibold text-amber-700'>{role.charAt(0).toUpperCase() + role.slice(1)}</span></p>
          
          <form onSubmit={handleSignup} className='space-y-5'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Username</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='Choose a username'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='Enter your email'
              />
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='Min 8 chars, 1 uppercase, 1 number, 1 special char'
              />
              <p className='text-xs text-gray-500 mt-1'>Must contain uppercase, lowercase, number & special character</p>
            </div>

            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='Confirm your password'
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className='w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-gray-600'>Already have an account? 
              <button onClick={() => navigate('/login')} className='text-amber-700 font-semibold hover:text-amber-800 ml-2'>
                Log In
              </button>
            </p>
            <button 
              onClick={() => {
                localStorage.removeItem('selectedRole')
                navigate('/role')
              }}
              className='text-gray-500 hover:text-gray-700 text-sm mt-3 underline'
            >
              Change role
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage