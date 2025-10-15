import React, { useState, useContext } from 'react'
import { Appcontext } from '../lib/Appcontext'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const Login = ({ onClose }) => {
  const { backendUrl, setToken, setUserData } = useContext(Appcontext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password },
        { withCredentials: true } // ✅ Send cookies
      )

      if (data._id) {
        localStorage.setItem('token', data._id)
        setToken(data._id)
        
        // Store user data
        if (setUserData) {
          setUserData({
            userName: data.userName,
            role: data.role,
            _id: data._id
          })
        }
        
        toast.success('Login successful!')
        if (onClose) onClose()
        navigate('/')
      } else {
        toast.error('Invalid credentials!')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Server error!'
      toast.error(errorMsg)
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupRedirect = () => {
    if (onClose) onClose()
    navigate('/role')
  }

  return (
    <div className='fixed inset-0 flex justify-center items-center backdrop-blur-sm z-50'>
      <div className='bg-creamcolor p-8 rounded-2xl shadow-lg w-full max-w-md relative'>
        {onClose && (
          <button
            onClick={onClose}
            className='absolute top-3 right-3 text-browntextcolor hover:text-brownforhover text-2xl leading-none'
          >
            ✖
          </button>
        )}

        <h2 className='text-2xl font-semibold text-browntextcolor mb-6 text-center'>
          Login to Your Account
        </h2>

        <form onSubmit={handleLogin}>
          <input
            type='email'
            placeholder='Email Address'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='w-full border border-browntextcolor p-3 rounded mb-3 focus:outline-none focus:border-brownBG'
            required
          />
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='w-full border border-browntextcolor p-3 rounded mb-3 focus:outline-none focus:border-brownBG'
            required
          />
          <button
            type='submit'
            disabled={isLoading}
            className='bg-brownBG text-white w-full py-3 rounded hover:bg-browntextcolor transition disabled:bg-brownBG disabled:cursor-not-allowed'
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className='text-center mt-5 text-browntextcolor'>
          Don't have an account?{' '}
          <span
            onClick={handleSignupRedirect}
            className='text-browntextcolor cursor-pointer hover:underline font-medium'
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login