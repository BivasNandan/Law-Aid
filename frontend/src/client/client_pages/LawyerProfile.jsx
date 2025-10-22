import React, { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { useNavigate } from 'react-router-dom'

const LawyerProfile = () => {
  const { userName } = useParams()
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext)
  const [lawyer, setLawyer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [appointmentStatus, setAppointmentStatus] = useState(null)
  const navigate = useNavigate()

  const getProfilePicUrl = (pic) => {
    if (!pic) return null
    // if it's already a full URL
    if (pic.path && (pic.path.startsWith('http://') || pic.path.startsWith('https://'))) return pic.path
    if (pic.path) {
      // Normalize backslashes (Windows) to forward slashes
      let p = pic.path.replace(/\\/g, '/').replace(/\\+/g, '/')
      // If path contains 'uploads/', extract that portion (so we can serve it via static route)
      const idx = p.indexOf('uploads/')
      if (idx !== -1) {
        p = p.substring(idx)
      } else {
        // If we don't see 'uploads', maybe path is an absolute filesystem path; try to fallback to filename
        if (pic.filename) return `${backendUrl}/uploads/profilePics/${pic.filename}`
        // Last resort: strip leading slashes and use as-is
        p = p.replace(/^\/+/, '')
      }
      return `${backendUrl}/${p}`
    }
    if (pic.filename) return `${backendUrl}/uploads/profilePics/${pic.filename}`
    return null
  }

  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/auth/lawyer/${userName}`)
        // Log response for debugging
        console.debug('GET /api/auth/lawyer/:userName response:', res.data)

        // Some server versions may return a partial object; if profilePic is missing, try fetching by id
        if (res.data && !res.data.profilePic && res.data._id) {
          try {
            const full = await axios.get(`${backendUrl}/api/auth/lawyer-by-id/${res.data._id}`)
            console.debug('Fallback GET /api/auth/lawyer-by-id response:', full.data)
            setLawyer(full.data)
          } catch (err) {
            console.warn('Fallback by-id fetch failed', err)
            setLawyer(res.data)
          }
        } else {
          setLawyer(res.data)
        }
        setNotFound(false)
        setErrorMessage(null)
      } catch (err) {
        console.error('Failed to load lawyer', err)
        if (err.response && err.response.status === 404) {
          setNotFound(true)
          setErrorMessage('Lawyer profile does not exist.')
        } else {
          setErrorMessage('Failed to load lawyer. Please try again later.')
          toast.error('Failed to load lawyer')
        }
      } finally {
        setLoading(false)
      }
    }
    
    const checkAppointment = async () => {
      if (!userData || !lawyer) return
      
      try {
        // backend exposes GET /api/appointment/user/:id
        const userId = userData?._id
        if (!userId) return
        const res = await axios.get(`${backendUrl}/api/appointment/user/${userId}`, { withCredentials: true })
        const appointments = res.data?.appointments || []
        
        // Find appointment with this lawyer
        const appointment = appointments.find(apt => 
          apt.lawyerId === lawyer._id && apt.status !== 'cancelled'
        )
        
        if (appointment) {
          setAppointmentStatus(appointment.status)
        }
      } catch (err) {
        console.warn('Could not check appointment status', err)
      }
    }
    
    if (userName) {
      fetchLawyer().then(() => {
        if (userData) checkAppointment()
      })
    }
  }, [backendUrl, userName, userData, lawyer])

  if (loading) {
    return (
      <div className='min-h-screen bg-AboutBackgroudColor flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4'></div>
          <p className='text-browntextcolor text-lg font-inria'>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || (!lawyer && errorMessage)) {
    return (
      <div className='min-h-screen bg-AboutBackgroudColor flex items-center justify-center px-4 py-12'>
        <div className='max-w-md bg-white rounded-lg shadow-lg border border-brown p-8 text-center'>
          <div className='w-20 h-20 bg-AboutBackgroudColor rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg className='w-10 h-10 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1} d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <h3 className='text-2xl font-bold mb-4 text-brownBG font-inria'>Lawyer profile not found</h3>
          <p className='text-browntextcolor mb-6 font-inria'>{errorMessage || 'This lawyer profile does not exist.'}</p>
          <div className='flex justify-center gap-4'>
            <button 
              onClick={() => navigate('/find-lawyer')} 
              className='px-6 py-2 bg-browntextcolor hover:bg-brownforhover text-creamcolor rounded-lg font-semibold transition-all font-inria'
            >
              Back to search
            </button>
            <button 
              onClick={() => navigate('/')} 
              className='px-6 py-2 border-2 border-brown text-brownBG hover:bg-AboutBackgroudColor rounded-lg font-semibold transition-all font-inria'
            >
              Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      {/* Top hero section */}
      <div className='w-full bg-brownBG text-creamcolor py-14 md:py-20 flex items-center'>
        <div className='max-w-7xl mx-auto px-6'>
          <h2 className='text-4xl md:text-5xl font-bold font-inria'>Lawyer Profile</h2>
        </div>
      </div>
      <div className='min-h-screen bg-AboutBackgroudColor px-4 py-12 pt-8'>
        <div className='max-w-5xl mx-auto'>
        {/* Header Card */}
        <div className='bg-white rounded-lg shadow-lg border border-brown p-8 mb-6'>
          <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
            {/* Profile Picture */}
            <div className='w-32 h-32 rounded-full overflow-hidden bg-AboutBackgroudColor border-4 border-brown2 flex-shrink-0'>
              {(() => {
                const url = getProfilePicUrl(lawyer.profilePic)
                if (url) {
                  return <img src={url} alt={lawyer.userName} className='w-full h-full object-cover' />
                }
                return (
                  <div className='w-full h-full flex items-center justify-center'>
                    <svg className='w-16 h-16 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                    </svg>
                  </div>
                )
              })()}
            </div>

            {/* Basic Info */}
            <div className='flex-1 text-center md:text-left'>
              <div className='flex flex-col md:flex-row md:items-center gap-3 mb-3'>
                <h1 className='text-3xl font-bold text-brownBG font-inria'>{lawyer.userName}</h1>
                {lawyer.verified && (
                  <span className='inline-flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full'>
                    <svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                    </svg>
                    <span className='text-xs font-semibold text-green-700 font-inria'>Verified</span>
                  </span>
                )}
              </div>
              
              <p className='text-lg text-browntextcolor mb-2 font-inria'>{lawyer.specialization || 'Legal Consultant'}</p>
              <p className='text-sm text-browntextcolor font-inria'>{lawyer.email}</p>
              
              {/* Quick Stats */}
              <div className='flex flex-wrap gap-4 mt-4'>
                <div className='flex items-center gap-2 bg-AboutBackgroudColor px-4 py-2 rounded-lg border border-brown'>
                  <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                  </svg>
                  <span className='text-sm font-semibold text-brownBG font-inria'>
                    {lawyer.experience ? `${lawyer.experience} years` : 'N/A'}
                  </span>
                </div>
                
                <div className='flex items-center gap-2 bg-AboutBackgroudColor px-4 py-2 rounded-lg border border-brown'>
                  <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span className='text-sm font-semibold text-brownBG font-inria'>
                    {lawyer.availability ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Button - Desktop */}
            <div className='hidden md:block'>
              {appointmentStatus ? (
                <div className='bg-AboutBackgroudColor border-2 border-brown2 text-brownBG font-semibold px-6 py-3 rounded-lg font-inria text-center'>
                  {appointmentStatus === 'pending' && (
                    <div className='flex items-center gap-2'>
                      <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                      <span>Appointment Pending</span>
                    </div>
                  )}
                  {appointmentStatus === 'confirmed' && (
                    <div className='flex items-center gap-2'>
                      <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                      </svg>
                      <span>Appointment Confirmed</span>
                    </div>
                  )}
                </div>
              ) : (
                <button 
                  onClick={() => {
                    if (!userData && !appLoading) {
                      toast.error('Please log in to book an appointment')
                      navigate('/login')
                      return
                    }
                    navigate(`/book-appointment/${lawyer._id}`)
                  }} 
                  className='bg-browntextcolor hover:bg-brownforhover text-creamcolor px-6 py-3 rounded-lg font-semibold transition-all font-inria whitespace-nowrap'
                >
                  Book Appointment
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
          {/* Contact Information */}
          <div className='bg-white rounded-lg shadow-lg border border-brown p-6'>
            <h2 className='text-xl font-bold text-brownBG mb-4 font-inria flex items-center gap-2'>
              <svg className='w-6 h-6 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
              </svg>
              Contact Information
            </h2>
            
            <div className='space-y-4'>
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Phone Number</div>
                <div className='text-brownBG font-inria'>{lawyer.phone || 'Not provided'}</div>
              </div>
              
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Email Address</div>
                <div className='text-brownBG font-inria break-all'>{lawyer.email}</div>
              </div>
              
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Chamber Address</div>
                <div className='text-brownBG font-inria'>{lawyer.chamberAddress || 'Not provided'}</div>
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className='bg-white rounded-lg shadow-lg border border-brown p-6'>
            <h2 className='text-xl font-bold text-brownBG mb-4 font-inria flex items-center gap-2'>
              <svg className='w-6 h-6 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
              </svg>
              Professional Details
            </h2>
            
            <div className='space-y-4'>
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>License Number</div>
                <div className='text-brownBG font-inria'>{lawyer.licenseNo || 'Not provided'}</div>
              </div>
              
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Specialization</div>
                <div className='text-brownBG font-inria'>{lawyer.specialization || 'General Practice'}</div>
              </div>
              
              <div>
                <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Years of Experience</div>
                <div className='text-brownBG font-inria'>{lawyer.experience ? `${lawyer.experience} years` : 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Card */}
        <div className='bg-white rounded-lg shadow-lg border border-brown p-6 mb-6'>
          <h2 className='text-xl font-bold text-brownBG mb-4 font-inria flex items-center gap-2'>
            <svg className='w-6 h-6 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            Availability & Visiting Hours
          </h2>
          
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Current Status</div>
              <div className='flex items-center gap-2'>
                <span className={`inline-block w-3 h-3 rounded-full ${lawyer.availability ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className='text-brownBG font-inria font-semibold'>
                  {lawyer.availability ? 'Available for Consultation' : 'Currently Unavailable'}
                </span>
              </div>
            </div>
            
            <div>
              <div className='text-xs text-browntextcolor font-semibold mb-1 font-inria'>Visiting Hours</div>
              <div className='text-brownBG font-inria'>{lawyer.visitingHours || 'Contact for appointment'}</div>
            </div>
          </div>
        </div>

        {/* Book Button - Mobile */}
        <div className='md:hidden'>
          {appointmentStatus ? (
            <div className='w-full bg-AboutBackgroudColor border-2 border-brown2 text-brownBG font-semibold px-6 py-3 rounded-lg font-inria text-center'>
              {appointmentStatus === 'pending' && (
                <div className='flex items-center justify-center gap-2'>
                  <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span>Appointment Pending</span>
                </div>
              )}
              {appointmentStatus === 'confirmed' && (
                <div className='flex items-center justify-center gap-2'>
                  <svg className='w-5 h-5 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                  <span>Appointment Confirmed</span>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => {
        if (!userData && !appLoading) {
          toast.error('Please log in to book an appointment')
          navigate('/login')
          return
        }
                navigate(`/book-appointment/${lawyer._id}`)
              }} 
              className='w-full bg-browntextcolor hover:bg-brownforhover text-creamcolor px-6 py-3 rounded-lg font-semibold transition-all font-inria'
            >
              Book Appointment
            </button>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default LawyerProfile