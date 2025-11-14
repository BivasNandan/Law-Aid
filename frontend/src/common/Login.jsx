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
  const { backendUrl, setUserData } = useContext(Appcontext) // Remove setToken

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await axios.post(
        `${backendUrl}/api/auth/login`, 
        { email, password }, 
        { withCredentials: true }
      )
      
      console.log('✅ Login successful:', res.data)
      
      // Set user data - now includes full user object
      setUserData(res.data.user)
      
      toast.success('Login successful!')
      // After login, always go to the landing page. New lawyers still go to /lawyer-details from signup flow.
      navigate('/')
    } catch (error) {
      console.error('❌ Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
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