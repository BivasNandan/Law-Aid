import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Appcontext } from '../../lib/Appcontext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const ClientDetails = () => {
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    age: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await axios.post(
        `${backendUrl}/api/users/client-details`,
        formData,
        { withCredentials: true }
      )
      
      toast.success('Profile completed!')
      navigate('/')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save details!'
      toast.error(errorMsg)
      console.error('Client details error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4'>
      <div className='bg-white p-8 rounded-2xl shadow-lg w-full max-w-md'>
        <h2 className='text-2xl font-semibold text-gray-800 mb-2 text-center'>
          Complete Your Profile
        </h2>
        <p className='text-gray-500 text-center mb-6'>
          Add your personal details
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type='text'
            name='firstName'
            placeholder='First Name'
            value={formData.firstName}
            onChange={handleChange}
            className='w-full border border-gray-300 p-3 rounded mb-3 focus:outline-none focus:border-blue-500'
          />

          <input
            type='text'
            name='lastName'
            placeholder='Last Name'
            value={formData.lastName}
            onChange={handleChange}
            className='w-full border border-gray-300 p-3 rounded mb-3 focus:outline-none focus:border-blue-500'
          />

          <input
            type='tel'
            name='phone'
            placeholder='Phone Number (10-15 digits)'
            value={formData.phone}
            onChange={handleChange}
            pattern='[0-9]{10,15}'
            className='w-full border border-gray-300 p-3 rounded mb-3 focus:outline-none focus:border-blue-500'
          />

          <input
            type='number'
            name='age'
            placeholder='Age (18+)'
            value={formData.age}
            onChange={handleChange}
            min='18'
            max='120'
            className='w-full border border-gray-300 p-3 rounded mb-3 focus:outline-none focus:border-blue-500'
          />

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

export default ClientDetails
