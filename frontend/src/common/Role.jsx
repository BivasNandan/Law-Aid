import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const RolePage = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { backendUrl } = useContext(Appcontext)

  const handleRoleSelect = async (role) => {
    setLoading(true)
    try {
      console.log('🎭 Selecting role:', role)
      
      const res = await axios.post(
        `${backendUrl}/api/auth/assigningRole`, 
        { role }, 
        { withCredentials: true }
      )
      
      console.log('✅ Role selection successful:', res.data)
      
      // Store selected role for signup page to use
      localStorage.setItem('selectedRole', role)
      
      toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} role selected`)
      navigate('/signup')
    } catch (error) {
      console.error('❌ Role selection error:', error)
      toast.error(error.response?.data?.message || 'Failed to select role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-2xl'>
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-bold text-amber-900 mb-3'>Choose Your Role</h2>
          <p className='text-gray-600 text-lg'>Select whether you're looking for legal services or providing them</p>
        </div>

        <div className='grid md:grid-cols-2 gap-8'>
          <button
            onClick={() => handleRoleSelect('client')}
            disabled={loading}
            className='bg-white rounded-xl shadow-lg hover:shadow-xl p-8 text-center group hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-amber-500'
          >
            <div className='mb-4'>
              <svg className='w-16 h-16 text-amber-700 mx-auto group-hover:scale-110 transition' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className='text-2xl font-bold text-amber-900 mb-2'>I'm a Client</h3>
            <p className='text-gray-600'>Looking for legal services and professional advice</p>
            {loading && <p className='text-amber-600 text-sm mt-2'>Setting up client role...</p>}
          </button>

          <button
            onClick={() => handleRoleSelect('lawyer')}
            disabled={loading}
            className='bg-white rounded-xl shadow-lg hover:shadow-xl p-8 text-center group hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent hover:border-amber-500'
          >
            <div className='mb-4'>
              <svg className='w-16 h-16 text-amber-700 mx-auto group-hover:scale-110 transition' fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className='text-2xl font-bold text-amber-900 mb-2'>I'm a Lawyer</h3>
            <p className='text-gray-600'>Offering legal services and expertise</p>
            {loading && <p className='text-amber-600 text-sm mt-2'>Setting up lawyer role...</p>}
          </button>
        </div>

        <div className='text-center mt-8'>
          <p className='text-gray-600'>
            Already have an account?{' '}
            <button 
              onClick={() => navigate('/login')} 
              className='text-amber-700 font-semibold hover:text-amber-800 underline'
            >
              Log in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RolePage