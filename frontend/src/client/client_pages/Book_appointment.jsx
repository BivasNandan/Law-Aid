import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from "../../common/Navbar"
import Footer from '../../common/Footer'

const Book_appointment = () => {
  const { id } = useParams()
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext)
  const [lawyer, setLawyer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dateTime, setDateTime] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!userData && !appLoading) {
      toast.error('Please login to book an appointment')
      navigate('/login')
      return
    }

    const fetchLawyer = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${backendUrl}/api/auth/lawyer-by-id/${id}`)
        setLawyer(res.data)
      } catch (err) {
        console.error('Failed to load lawyer for booking', err)
        toast.error('Failed to load lawyer')
        navigate('/find-lawyer')
      } finally {
        setLoading(false)
      }
    }

    fetchLawyer()

    if (userData) {
      setClientName(userData.userName || '')
      setClientPhone(userData.phone || '')
    }
  }, [backendUrl, id, userData, navigate, appLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!dateTime) {
      toast.error('Please select date and time')
      return
    }

    setSubmitting(true)
    try {
      const iso = new Date(dateTime).toISOString()

      const res = await axios.post(`${backendUrl}/api/appointment/create`, {
        lawyerId: id,
        dateTime: iso,
        caseDescription: caseDescription
      }, { withCredentials: true })

      toast.success(res.data?.message || 'Appointment booked successfully!')
      navigate('/profile')
    } catch (err) {
      console.error('Booking error', err)
      const msg = err.response?.data?.message || 'Failed to book appointment'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-AboutBackgroudColor flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4'></div>
          <p className='text-browntextcolor text-lg font-semibold font-inria'>Loading lawyer details...</p>
        </div>
      </div>
    )
  }

  if (!lawyer) return null

  return (
    <div className='min-h-screen bg-AboutBackgroudColor'>
      {/* ✅ Navbar - Separate, at the top */}
      <Navbar/>
      
      {/* Header Section */}
      <div className='bg-gradient-to-r from-brownBG to-browntextcolor text-creamcolor py-16 px-4 pt-32'>
        <div className='max-w-6xl mx-auto'>
          <button 
            onClick={() => navigate(-1)}
            className='flex items-center gap-2 text-creamcolor/80 hover:text-creamcolor mb-6 transition-colors font-inria'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            <span>Back</span>
          </button>
          <h1 className='text-4xl md:text-5xl font-bold mb-3 font-inria'>Book Your Appointment</h1>
          <p className='text-creamcolor/90 text-lg font-inria'>Schedule a consultation with your legal expert</p>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-4 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          
          {/* Lawyer Info Card - Left Side */}
          <div className='lg:col-span-1'>
            <div className='bg-creamcolor rounded-2xl shadow-xl overflow-hidden sticky top-24 border-2 border-brown'>
              {/* Profile Header */}
              <div className='bg-gradient-to-br from-brownBG to-browntextcolor p-6 text-creamcolor'>
                <div className='flex flex-col items-center'>
                  <div className='w-28 h-28 bg-creamcolor rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-brown2'>
                    {(() => {
                      const pic = lawyer.profilePic
                      if (pic && pic.path) {
                        return (
                          <img src={`${backendUrl}/${pic.path}`} alt={lawyer.userName} className='w-full h-full rounded-full object-cover' />
                        )
                      }
                      if (pic && pic.filename) {
                        return (
                          <img src={`${backendUrl}/uploads/profilePics/${pic.filename}`} alt={lawyer.userName} className='w-full h-full rounded-full object-cover' />
                        )
                      }
                      return (
                        <svg className='w-16 h-16 text-browntextcolor' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                        </svg>
                      )
                    })()}
                  </div>
                  <h3 className='text-2xl font-bold text-center mb-2 font-inria'>{lawyer.userName}</h3>
                  <span className='bg-brown2 px-4 py-1 rounded-full text-sm font-medium text-creamcolor font-inria'>
                    {lawyer.specialization || 'Legal Consultant'}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className='p-6 space-y-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 bg-AboutBackgroudColor rounded-lg flex items-center justify-center flex-shrink-0 border border-brown'>
                    <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Experience</p>
                    <p className='text-brownBG font-semibold font-inria'>{lawyer.experience ? `${lawyer.experience} years` : 'Not specified'}</p>
                  </div>
                </div>

                <div className='flex items-start gap-3'>
                  <div className='w-10 h-10 bg-AboutBackgroudColor rounded-lg flex items-center justify-center flex-shrink-0 border border-brown'>
                    <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Chamber</p>
                    <p className='text-brownBG font-medium text-sm leading-relaxed font-inria'>{lawyer.chamberAddress || 'Not provided'}</p>
                  </div>
                </div>

                {lawyer.email && (
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 bg-AboutBackgroudColor rounded-lg flex items-center justify-center flex-shrink-0 border border-brown'>
                      <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Email</p>
                      <p className='text-brownBG font-medium text-sm break-all font-inria'>{lawyer.email}</p>
                    </div>
                  </div>
                )}

                {lawyer.phone && (
                  <div className='flex items-start gap-3'>
                    <div className='w-10 h-10 bg-AboutBackgroudColor rounded-lg flex items-center justify-center flex-shrink-0 border border-brown'>
                      <svg className='w-5 h-5 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Phone</p>
                      <p className='text-brownBG font-medium font-inria'>{lawyer.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form - Right Side */}
          <div className='lg:col-span-2'>
            <div className='bg-creamcolor rounded-2xl shadow-xl p-8 border-2 border-brown'>
              <div className='mb-8'>
                <h2 className='text-3xl font-bold text-brownBG mb-2 font-inria'>Appointment Details</h2>
                <p className='text-browntextcolor font-inria'>Fill in the information below to schedule your consultation</p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Client Name */}
                <div>
                  <label className='block text-sm font-bold text-brownBG mb-2 font-inria'>
                    Your Name <span className='text-red-600'>*</span>
                  </label>
                  <input 
                    value={clientName} 
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className='w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:border-brown2 transition-colors text-brownBG placeholder-browntextcolor/50 bg-AboutBackgroudColor font-inria'
                    placeholder='Enter your full name'
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className='block text-sm font-bold text-brownBG mb-2 font-inria'>
                    Phone Number <span className='text-red-600'>*</span>
                  </label>
                  <input 
                    value={clientPhone} 
                    onChange={(e) => setClientPhone(e.target.value)}
                    required
                    type='tel'
                    className='w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:border-brown2 transition-colors text-brownBG placeholder-browntextcolor/50 bg-AboutBackgroudColor font-inria'
                    placeholder='Enter your phone number'
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className='block text-sm font-bold text-brownBG mb-2 font-inria'>
                    Preferred Date & Time <span className='text-red-600'>*</span>
                  </label>
                  <input 
                    value={dateTime} 
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const now = new Date();
                      
                      // Set today to start of day for comparison
                      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                      
                      // If selected date is before today
                      if (selectedDay < today) {
                        // Create new date with next year but keep month, day, and time
                        const adjustedDate = new Date(selectedDate);
                        adjustedDate.setFullYear(selectedDate.getFullYear() + 1);
                        setDateTime(adjustedDate.toISOString().slice(0, 16));
                        toast.success('Date automatically adjusted to next year as you selected a past date');
                      } else {
                        setDateTime(e.target.value);
                      }
                    }}
                    type='datetime-local'
                    required
                    className='w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:border-brown2 transition-colors text-brownBG bg-AboutBackgroudColor font-inria'
                  />
                  <p className='text-xs text-browntextcolor mt-2 flex items-center gap-1 font-inria'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                    Select your preferred consultation date and time. Past dates will be automatically scheduled for next year.
                  </p>
                </div>

                {/* Case Description (Optional) */}
                <div>
                  <label className='block text-sm font-bold text-brownBG mb-2 font-inria'>
                    Brief Case Description (Optional)
                  </label>
                  <textarea 
                    value={caseDescription}
                    onChange={(e) => setCaseDescription(e.target.value)}
                    rows={4}
                    className='w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:border-brown2 transition-colors text-brownBG placeholder-browntextcolor/50 bg-AboutBackgroudColor resize-none font-inria'
                    placeholder='Briefly describe your legal concern or the purpose of consultation...'
                  />
                </div>

                {/* Important Note */}
                <div className='bg-gradient-to-r from-AboutBackgroudColor to-brown/20 border-l-4 border-brown2 rounded-lg p-5'>
                  <div className='flex gap-3'>
                    <div className='flex-shrink-0'>
                      <svg className='w-6 h-6 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm font-bold text-brownBG mb-1 font-inria'>Important Information</p>
                      <p className='text-sm text-browntextcolor font-inria'>
                        Your appointment request will be sent to the lawyer for confirmation. You will receive a notification once your appointment is confirmed. Please ensure your contact information is correct.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-col sm:flex-row gap-4 pt-6'>
                  <button 
                    disabled={submitting} 
                    type='submit' 
                    className='flex-1 bg-gradient-to-r from-brownBG to-browntextcolor hover:from-brownforhover hover:to-brownBG text-creamcolor font-bold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-inria'
                  >
                    {submitting ? (
                      <span className='flex items-center justify-center gap-2'>
                        <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                  <button 
                    type='button' 
                    onClick={() => navigate(-1)} 
                    className='px-8 py-4 border-2 border-browntextcolor text-browntextcolor hover:bg-AboutBackgroudColor rounded-xl font-bold transition-all duration-200 font-inria'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <Footer/>
    </div>
  )
}

export default Book_appointment