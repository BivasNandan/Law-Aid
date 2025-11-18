import React, { useState, useContext, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from '../../lib/axiosConfig' // Use your configured axios
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'

const ClientDetails = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    profilePic: null
  })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { backendUrl, setUserData, userData } = useContext(Appcontext)

  // Get userId from location state or userData
  const userId = location.state?.userId || userData?._id || userData?.userId || userData?.id

  useEffect(() => {
    console.log('ClientDetails mounted')
    console.log('userData:', userData)
    console.log('userId resolved:', userId)
    
    // Redirect if no user data available
    if (!userData && !userId) {
      console.warn('⚠️ No user data found, redirecting to login')
      toast.error('Please login first')
      navigate('/login')
    }
  }, [userData, userId, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    console.log('File selected:', file)
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      
      setFormData(prev => ({ ...prev, profilePic: file }))
      setPreview(URL.createObjectURL(file))
      toast.success('Image selected!')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required')
      return
    }

    if (!userId) {
      toast.error('User ID not found. Please login again.')
      navigate('/login')
      return
    }

    setLoading(true)

    try {
      console.log('📤 Submitting client details for userId:', userId)
      
      const data = new FormData()
      
      // ✅ CRITICAL: Always include userId
      data.append('_id', userId)
      data.append('firstName', formData.firstName)
      data.append('lastName', formData.lastName)
      data.append('phone', formData.phone || '')
      data.append('age', formData.age || '')
      
      if (formData.profilePic) {
        data.append('profilePic', formData.profilePic)
        console.log('📎 Uploading with image:', formData.profilePic.name)
      }

      // Debug log
      console.log('FormData contents:')
      for (const pair of data.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`)
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`)
        }
      }

      // ✅ Send request with credentials
      const response = await axios.patch(
        `${backendUrl}/api/auth/set-client-additional-info`,
        data,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      console.log('✅ Profile update response:', response.data)
      
      // Update context with new user data
      if (response.data?.user) {
        setUserData(response.data.user)
        console.log('✅ User data updated in context')
        
        // Update preview with server URL if profile pic exists
        if (response.data.user.profilePic?.path) {
          const picPath = response.data.user.profilePic.path.replace(/\\/g, '/')
          setPreview(`${backendUrl}/${picPath}`)
        }
      }
      
      toast.success('Profile completed successfully!')
      
      // Navigate to home page
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 500)
      
    } catch (error) {
      console.error('❌ Profile update error:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to update profile'
      
      toast.error(errorMessage)
      
      // If authentication error, redirect to login
      if (error.response?.status === 401 || error.response?.status === 404) {
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12 pt-24'>
      <div className='w-full max-w-md'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <h2 className='text-3xl font-bold text-amber-900 mb-8 text-center'>Complete Your Profile</h2>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Profile Picture Upload Section */}
            <div className='text-center'>
              {preview ? (
                <div className='relative inline-block'>
                  <img 
                    src={preview} 
                    alt="preview" 
                    className='w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-amber-700' 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null)
                      setFormData(prev => ({ ...prev, profilePic: null }))
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className='absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg'
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className='w-24 h-24 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center'>
                  <svg className='w-12 h-12 text-gray-400' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className='hidden'
                id="profilePicInput"
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className='text-amber-700 font-semibold hover:text-amber-800 transition'
              >
                {preview ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* Name Fields */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='John'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='Doe'
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                pattern="[0-9]{10,15}"
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='1234567890'
              />
              <p className='text-xs text-gray-500 mt-1'>10-15 digits only</p>
            </div>

            {/* Age Field */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="120"
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                placeholder='18'
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className='w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Completing...
                </>
              ) : (
                'Complete Profile'
              )}
            </button>
          </form>

          {/* Skip for now option */}
          <div className='mt-4 text-center'>
            <button
              onClick={() => navigate('/')}
              className='text-gray-600 hover:text-gray-800 text-sm underline'
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDetails