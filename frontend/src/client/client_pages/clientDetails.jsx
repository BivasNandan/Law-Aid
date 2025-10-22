import React, { useState, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
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
  const fileInputRef = useRef(null) // Add this ref
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    console.log('File selected:', file) // For debugging
    
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

    setLoading(true)

    try {
      const data = new FormData()
      data.append('firstName', formData.firstName)
      data.append('lastName', formData.lastName)
      data.append('phone', formData.phone || '')
      data.append('age', formData.age || '')
      
      // IMPORTANT: Only append if file exists
      if (formData.profilePic) {
        data.append('profilePic', formData.profilePic)
        console.log('Uploading with image')
      } else {
        console.log('Uploading without image')
      }

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

      console.log('Profile update response:', response.data)
      toast.success('Profile completed successfully!')
      navigate('/')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
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
                      fileInputRef.current.value = ''
                    }}
                    className='absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full p-1'
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
              
              <label htmlFor="profilePicInput" className='block cursor-pointer'>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className='text-amber-700 font-semibold hover:text-amber-800 transition'
                >
                  {preview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </label>
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
              className='w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Completing...' : 'Complete Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ClientDetails
