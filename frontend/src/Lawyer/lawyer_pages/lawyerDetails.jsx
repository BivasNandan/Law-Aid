import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Appcontext } from '../../lib/Appcontext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const LawyerDetails = () => {
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    specialization: '',
    licenseNo: '',
    chamberAddress: '',
    resume: '',
    visitingHours: '',
    experience: '',
    phone: '',
    age: ''
  })

  const specializations = [
    "Civil Law", "Criminal Law", "Family Law", "Corporate & Commercial Law",
    "Constitutional & Administrative Law", "International Law",
    "Intellectual Property Law", "Labour & Employment Law",
    "Environmental Law", "Human Rights Law", "Health & Medical Law",
    "Arbitration & ADR", "Maritime & Admiralty Law"
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await axios.post(
        `${backendUrl}/api/users/lawyer-details`,
        formData,
        { withCredentials: true }
      )
      
      toast.success('Lawyer profile completed!')
      navigate('/')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save details!'
      toast.error(errorMsg)
      console.error('Lawyer details error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4'>
      <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-2xl'>
        <h2 className='text-2xl font-semibold text-gray-800 mb-2 text-center'>
          Complete Your Lawyer Profile
        </h2>
        <p className='text-gray-500 text-center mb-6'>
          Fill in your professional details
        </p>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-gray-700 mb-2 font-medium'>Specialization *</label>
              <select
                name='specialization'
                value={formData.specialization}
                onChange={handleChange}
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
                required
              >
                <option value=''>Select Specialization</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div>
              <label className='block text-gray-700 mb-2 font-medium'>License Number *</label>
              <input
                type='text'
                name='licenseNo'
                value={formData.licenseNo}
                onChange={handleChange}
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
                required
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-gray-700 mb-2 font-medium'>Chamber Address *</label>
              <textarea
                name='chamberAddress'
                value={formData.chamberAddress}
                onChange={handleChange}
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
                rows='2'
                required
              />
            </div>

            <div>
              <label className='block text-gray-700 mb-2 font-medium'>Phone (10-15 digits)</label>
              <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleChange}
                pattern='[0-9]{10,15}'
                placeholder='e.g., 01712345678'
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
              />
            </div>

            <div>
              <label className='block text-gray-700 mb-2 font-medium'>Age (18-120)</label>
              <input
                type='number'
                name='age'
                value={formData.age}
                onChange={handleChange}
                min='18'
                max='120'
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
              />
            </div>

            <div>
              <label className='block text-gray-700 mb-2 font-medium'>Experience (Years)</label>
              <input
                type='number'
                name='experience'
                value={formData.experience}
                onChange={handleChange}
                min='0'
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
              />
            </div>

            <div>
              <label className='block text-gray-700 mb-2 font-medium'>Visiting Hours/Week</label>
              <input
                type='number'
                name='visitingHours'
                value={formData.visitingHours}
                onChange={handleChange}
                min='0'
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
              />
            </div>

            <div className='md:col-span-2'>
              <label className='block text-gray-700 mb-2 font-medium'>Resume URL</label>
              <input
                type='url'
                name='resume'
                value={formData.resume}
                onChange={handleChange}
                placeholder='https://...'
                className='w-full border border-gray-300 p-3 rounded focus:outline-none focus:border-blue-500'
              />
            </div>
          </div>

          <div className='flex gap-4 mt-6'>
            <button
              type='button'
              onClick={() => navigate('/')}
              className='flex-1 bg-gray-200 text-gray-700 py-3 rounded hover:bg-gray-300 transition font-medium'
            >
              Skip for Now
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:bg-blue-400 font-medium'
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LawyerDetails