import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Appcontext } from '../lib/Appcontext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Signup = () => {
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role')
  const navigate = useNavigate()
  const { backendUrl, setToken, setUserData } = useContext(Appcontext)

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!role || !['client', 'lawyer'].includes(role)) {
      toast.error('Please select a role first')
      navigate('/')
    }
  }, [role, navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters!')
      return
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character!')
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Assign role
      await axios.post(
        `${backendUrl}/api/auth/assign-role`,
        { role },
        { withCredentials: true }
      )

      // Step 2: Register
      const { data } = await axios.post(
        `${backendUrl}/api/auth/register`,
        {
          userName: formData.userName,
          email: formData.email,
          password: formData.password
        },
        { withCredentials: true }
      )

      if (data.userId) {
        localStorage.setItem('token', data.userId)
        setToken(data.userId)
        
        // Store user data in context
        if (setUserData) {
          setUserData({
            userName: formData.userName,
            role: role,
            _id: data.userId
          })
        }
        
        toast.success('Account created successfully!')
        
        // Redirect based on role
        if (role === 'lawyer') {
          navigate('/lawyerDetails')
        } else {
          navigate('/')
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed!'
      toast.error(errorMsg)
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/')
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm'>
      <div 
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className='flex flex-col gap-3 p-8 bg-white min-w-[340px] sm:min-w-96 border rounded-xl text-browntextcolor-600 text-sm shadow-2xl relative'>
          {/* Close Button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Title */}
          <p className='text-2xl font-semibold text-browntextcolor-600 mt-2'>
            Create an Account
          </p>

          {/* Role Badge */}
          {role && (
            <div className='mb-1 p-2 bg-brownBG/10 text-brownBG rounded-lg text-center text-sm font-semibold'>
              Signing up as: {role === 'lawyer' ? 'Lawyer' : 'Client'}
            </div>
          )}

          {/* Subtitle */}
          <p className='text-browntextcolor-600'>
            Please fill in your details to create your account
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
            {/* Username Input */}
            <div className='w-full'>
              <p className='text-browntextcolor-600 mb-1'>Username</p>
              <input
                className='border border-browntextcolor-300 rounded w-full p-2 mt-1 focus:outline-none focus:border-brownBG'
                type='text'
                name='userName'
                value={formData.userName}
                onChange={handleChange}
                placeholder='Enter your username'
                required
              />
            </div>

            {/* Email Input */}
            <div className='w-full'>
              <p className='text-browntextcolor-600 mb-1'>Email</p>
              <input
                className='border border-browntextcolor-300 rounded w-full p-2 mt-1 focus:outline-none focus:border-brownBG'
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='Enter your email'
                required
              />
            </div>

            {/* Password Input */}
            <div className='w-full'>
              <p className='text-browntextcolor-600 mb-1'>Password</p>
              <input
                className='border border-browntextcolor-300 rounded w-full p-2 mt-1 focus:outline-none focus:border-brownBG'
                type='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Create a strong password'
                required
              />
              <p className='text-xs text-gray-500 mt-1'>
                Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
              </p>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading}
              className='bg-brownBG hover:bg-brownforhover text-white w-full p-2 rounded-md text-base font-semibold mt-2 transition-colors duration-300 disabled:bg-brownBG/50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Back to Login */}
          <p className='text-center text-browntextcolor-600'>
            Already have an account?{' '}
            <span
              className='text-brownBG cursor-pointer underline hover:text-brownforhover font-semibold'
              onClick={handleBackToLogin}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup