import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { backendUrl, setUserData } = useContext(Appcontext)

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters long and contain uppercase, lowercase, a number, and a special character');
      return;
    }
    setLoading(true)

    try {
      // Ensure any lingering server-side cookies (admin roleToken/userToken) are cleared
      try {
        await axios.post(`${backendUrl}/api/auth/logout`, {}, { withCredentials: true })
      } catch (err) {
        // ignore logout errors; continue to login
        console.debug('Pre-login logout call failed (ignored):', err?.message || err)
      }
      const res = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      )

      console.log('✅ Login successful:', res.data)
      console.debug('Returned user from login:', res.data.user)

      // Extract user data from response
      const returnedUser = res.data.user
      // Token is stored in httpOnly cookie by backend; not stored in frontend

      // Clear any old userData and set new one (ensures role switches correctly)
      localStorage.removeItem('userData')
      setUserData(returnedUser)

      toast.success('Login successful!')

      // Navigate based on role from token/user object
      const role = returnedUser?.role
      
      if (role === 'admin') {
        console.log('🔐 Admin logged in - redirecting to landing page')
        navigate('/', { replace: true })
      } else if (role === 'lawyer') {
        console.log('👨‍⚖️ Lawyer logged in - redirecting to landing page')
        navigate('/', { replace: true })
      } else if (role === 'client') {
        console.log('👤 Client logged in - redirecting to landing')
        navigate('/', { replace: true })
      } else {
        console.warn('⚠️ Unknown role:', role)
        navigate('/', { replace: true })
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
      <div className='relative w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <button
            onClick={() => navigate('/')}
            aria-label="Close login"
            className="absolute top-3 right-3 p-2 rounded-md hover:bg-gray-100 transition"
            title="Close and return to landing page"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className='text-3xl font-bold text-amber-900 mb-8 text-center'>Welcome Back</h2>
          
          <form onSubmit={handleLogin} className='space-y-5'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                required
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='Enter your password'
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className='w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50'
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-gray-600'>Don't have an account? 
              <button onClick={() => navigate('/role')} className='text-amber-700 font-semibold hover:text-amber-800 ml-2'>
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage