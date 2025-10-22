import React, { useState, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'

const LawyerDetails= () => {
  const [formData, setFormData] = useState({
    specialization: '',
    licenseNo: '',
    chamberAddress: '',
    experience: '',
    visitingHours: '',
    phone: '',
    age: '',
    profilePic: null,
    resume: null
  })
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const profilePicRef = useRef(null)
  const resumeRef = useRef(null)
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)

  const specializations = [
    "Civil Law", "Criminal Law", "Family Law", "Corporate & Commercial Law",
    "Constitutional & Administrative Law", "International Law", "Intellectual Property Law",
    "Labour & Employment Law", "Environmental Law", "Human Rights Law",
    "Health & Medical Law", "Arbitration & ADR", "Maritime & Admiralty Law"
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      setFormData(prev => ({ ...prev, profilePic: file }))
      setPreview(URL.createObjectURL(file))
      toast.success('Profile picture selected!')
    }
  }

  const handleResumeChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file for resume')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Resume size must be less than 10MB')
        return
      }
      setFormData(prev => ({ ...prev, resume: file }))
      toast.success('Resume selected!')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.specialization || !formData.licenseNo || !formData.chamberAddress) {
      toast.error('Specialization, License No., and Chamber Address are required')
      return
    }

    setLoading(true)

    try {
      const data = new FormData()
      data.append('specialization', formData.specialization)
      data.append('licenseNo', formData.licenseNo)
      data.append('chamberAddress', formData.chamberAddress)
      data.append('experience', formData.experience || 0)
      data.append('visitingHours', formData.visitingHours || 0)
      data.append('phone', formData.phone || '')
      data.append('age', formData.age || '')

      // Append files only if they exist
      if (formData.profilePic) {
        data.append('profilePic', formData.profilePic)
      }
      if (formData.resume) {
        data.append('resume', formData.resume)
      }

      const response = await axios.patch(
        `${backendUrl}/api/auth/set-lawyer-additional-info`,
        data,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

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
      <div className='w-full max-w-2xl'>
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <h2 className='text-3xl font-bold text-amber-900 mb-8 text-center'>Complete Your Lawyer Profile</h2>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Profile Picture */}
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
                      profilePicRef.current.value = ''
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
                ref={profilePicRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className='hidden'
                id="profilePicInput"
              />
              
              <button 
                type="button"
                onClick={() => profilePicRef.current?.click()}
                className='text-amber-700 font-semibold hover:text-amber-800 transition'
              >
                {preview ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* Specialization */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Specialization *</label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
              >
                <option value="">Select specialization</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* License No and Chamber Address */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>License No. *</label>
                <input
                  type="text"
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='Your license number'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Chamber Address *</label>
                <input
                  type="text"
                  name="chamberAddress"
                  value={formData.chamberAddress}
                  onChange={handleChange}
                  required
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='Chamber address'
                />
              </div>
            </div>

            {/* Experience and Visiting Hours */}
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='0'
                />
              </div>
              <div>
                <label className='block text-sm font-semibold text-gray-700 mb-2'>Visiting Hours</label>
                <input
                  type="number"
                  name="visitingHours"
                  value={formData.visitingHours}
                  onChange={handleChange}
                  min="0"
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600'
                  placeholder='Hours per week'
                />
              </div>
            </div>

            {/* Phone and Age */}
            <div className='grid grid-cols-2 gap-4'>
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
              </div>
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
            </div>

            {/* Resume Upload */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Resume (PDF)</label>
              <input
                ref={resumeRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeChange}
                className='hidden'
                id="resumeInput"
              />
              
              <button 
                type="button"
                onClick={() => resumeRef.current?.click()}
                className='w-full px-4 py-3 border-2 border-dashed border-amber-700 text-amber-700 font-semibold rounded-lg hover:bg-amber-50 transition'
              >
                {formData.resume ? `Resume: ${formData.resume.name}` : 'Upload Resume (PDF)'}
              </button>
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

export default LawyerDetails