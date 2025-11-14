import React, { useState, useContext } from 'react'
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
  const navigate = useNavigate()
  const { backendUrl, setUserData } = useContext(Appcontext)

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

    setLoading(true)
    try {
      const res = await axios.post(
        `${backendUrl}/api/auth/register`, 
        { userName, email, password }, 
        { withCredentials: true }
      )
      
      console.log('✅ Signup successful:', res.data)
      
      // ✅ FIX: Server returns full user object; use it to populate Appcontext
      if (res.data?.user) {
        setUserData(res.data.user)
        console.log('✅ User data set in context:', res.data.user)
      } else {
        // Fallback to minimal data if server didn't return full user
        setUserData({ _id: res.data.userId, userName, role: res.data.role })
      }

      // Determine role for navigation
      const role = res.data?.user?.role || res.data?.role

      toast.success('Account created! Now complete your profile')
      
      // Navigate to details page based on role
      if (role === 'lawyer') {
        navigate('/lawyer-details')
      } else if (role === 'client') {
        navigate('/client-details')
      } else {
        // Fallback: if role is somehow missing, go to home
        console.error('⚠️ Role not found in response')
        navigate('/')
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      toast.error(error.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <h2 className='text-3xl font-bold text-amber-900 mb-8 text-center'>Create Account</h2>
          
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage