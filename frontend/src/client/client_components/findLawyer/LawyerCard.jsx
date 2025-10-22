import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const LawyerCard = ({ lawyer, backendUrl, onBook, userData }) => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [appointmentStatus, setAppointmentStatus] = useState(null)

  useEffect(() => {
    // Check if user has appointment with this lawyer
    const checkAppointment = async () => {
      if (!userData || !lawyer) return
      
      try {
        const res = await axios.get(`${backendUrl}/api/appointment/my-appointments`, { withCredentials: true })
        const appointments = res.data?.appointments || []
        
        // Find appointment with this lawyer
        const appointment = appointments.find(apt => 
          apt.lawyerId === (lawyer._id || lawyer.id) && apt.status !== 'cancelled'
        )
        
        if (appointment) {
          setAppointmentStatus(appointment.status)
        }
      } catch (err) {
        console.warn('Could not check appointment status', err)
      }
    }
    
    checkAppointment()
  }, [backendUrl, lawyer, userData])

  const openProfile = async () => {
    if (checking) return
    setChecking(true)
    try {
      // Prefer username lookup
      if (lawyer?.userName) {
        const uname = encodeURIComponent(lawyer.userName)
        try {
          await axios.get(`${backendUrl}/api/auth/lawyer/${uname}`)
          navigate(`/lawyer/${uname}`)
          return
        } catch (err) {
          if (err.response && err.response.status === 404) {
            toast.error('Lawyer profile does not exist')
            navigate('/find-lawyer')
            return
          }
          throw err
        }
      }

      // Fallback: lookup by id
      const id = lawyer?._id || lawyer?.id
      if (id) {
        try {
          const res = await axios.get(`${backendUrl}/api/auth/lawyer-by-id/${id}`)
          const uname = res.data?.userName
          if (uname) {
            navigate(`/lawyer/${encodeURIComponent(uname)}`)
            return
          }
          toast.error('Lawyer profile does not exist')
          navigate('/find-lawyer')
          return
        } catch (err) {
          if (err.response && err.response.status === 404) {
            toast.error('Lawyer profile does not exist')
            navigate('/find-lawyer')
            return
          }
          throw err
        }
      }

      // No identifier available
      toast.error('Lawyer information unavailable')
      navigate('/find-lawyer')
    } catch (err) {
      console.error('openProfile error', err)
      toast.error('Failed to open profile')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={`Open profile for ${lawyer?.userName || lawyer?.email || 'lawyer'}`}
      className='bg-white rounded-lg shadow-lg border border-brown overflow-hidden hover:shadow-xl transition-all duration-300 group relative min-h-[30rem]'
    >
      {/* Lawyer Image */}
      <div 
        className='h-72 md:h-80 bg-AboutBackgroudColor flex items-center justify-center overflow-hidden cursor-pointer'
        onClick={openProfile}
      >
        {(() => {
          const pic = lawyer?.profilePic
          if (pic && pic.path) {
            return (
              <img src={`${backendUrl}/${pic.path}`} alt={lawyer.userName} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
            )
          }
          if (pic && pic.filename) {
            return (
              <img src={`${backendUrl}/uploads/profilePics/${pic.filename}`} alt={lawyer.userName} className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
            )
          }
          return (
            <svg className='w-24 h-24 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
            </svg>
          )
        })()}
      </div>

  {/* Lawyer Info */}
  <div className='p-10'>
        <div className='flex justify-between items-start mb-3'>
          <div className='flex-1'>
            <h3 className='text-xl font-bold text-brownBG mb-1 font-inria group-hover:text-brown2 transition-colors'>
              {lawyer.userName || 'Unknown'}
            </h3>
            <p className='text-browntextcolor text-sm font-inria'>
              {lawyer.specialization || 'General Practice'}
            </p>
          </div>
          
          {lawyer.verified && (
            <div className='flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full'>
              <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
              </svg>
              <span className='text-xs font-semibold text-green-700 font-inria'>Verified</span>
            </div>
          )}
        </div>

        {/* Experience and Location */}
        <div className='space-y-2 mb-4'>
          <div className='flex items-center gap-2 text-sm text-browntextcolor font-inria'>
            <svg className='w-4 h-4 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
            </svg>
            <span>{lawyer.experience ? `${lawyer.experience} years experience` : 'Experience not specified'}</span>
          </div>

          {(lawyer.chamberAddress || lawyer.email) && (
            <div className='flex items-start gap-2 text-sm text-browntextcolor font-inria'>
              <svg className='w-4 h-4 text-brown2 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
              <span className='line-clamp-2'>{lawyer.chamberAddress || lawyer.email}</span>
            </div>
          )}
        </div>

        {/* View Profile and Book Button */}
          <div className='pt-4 border-t border-brown space-y-3'>
          <div className='flex justify-between items-center cursor-pointer' onClick={openProfile}>
            <span className='text-sm font-semibold text-brown2 font-inria group-hover:text-brownforhover transition-colors'>
              View Profile
            </span>
            <svg className='w-5 h-5 text-brown2 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </div>
          
          {onBook && (
            <button
              onClick={onBook}
              className='w-full bg-browntextcolor hover:bg-brownforhover text-creamcolor font-semibold py-3 px-4 rounded-lg transition-all duration-200 font-inria'
            >
              Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {checking && (
        <div className='absolute inset-0 bg-brownBG bg-opacity-50 flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-creamcolor'></div>
        </div>
      )}
    </div>
  )
}

export default LawyerCard