import React, { useEffect, useState, useContext } from 'react'
import axios from '../../lib/axiosConfig'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { io } from 'socket.io-client'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import RescheduleResponseModal from '../client_components/RescheduleResponseModal'

const MyAppointment = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [clientFeedbacks, setClientFeedbacks] = useState([])
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null })

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userData) return setLoading(false)
      try {
        const userId = userData._id
        const res = await axios.get(`${backendUrl}/api/appointment/user/${userId}`, { withCredentials: true })
        setAppointments(res.data.appointments || [])
      } catch (err) {
        console.error('Failed to fetch appointments', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
    
    // setup socket to listen for appointment status updates
    let socket
    try {
      socket = io(backendUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        upgrade: true // Allow transport upgrade after successful connection
      })
      
      socket.on('connect', () => {
        console.log('Socket connected successfully');
      })

      socket.on('connect_error', (e) => {
        console.warn('Socket connect error', e);
        toast.error('Connection error. Some updates might be delayed.');
      })

      socket.on('appointmentStatusUpdated', (updated) => {
        setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
        toast.success('Appointment status updated!');
      })

      socket.on('rescheduleProposed', (data) => {
        setAppointments(prev => prev.map(a => 
          a._id === data.appointmentId 
            ? { ...a, proposedDateTime: data.proposedDateTime, rescheduleReason: data.rescheduleReason }
            : a
        ));
        toast.success(`${data.lawyerName} proposed a reschedule!`);
      })
    } catch (e) {
      console.warn('Socket init failed', e);
      toast.error('Failed to initialize real-time updates');
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [backendUrl, userData])

  // Fetch feedbacks submitted by this client to identify which appointments already have feedback
  useEffect(() => {
    const fetchMyFeedbacks = async () => {
      if (!userData) return
      try {
        const res = await axios.get(`${backendUrl}/api/feedback/my-feedback`, { withCredentials: true })
        setClientFeedbacks(res.data.feedbacks || [])
      } catch (err) {
        console.warn('Failed to fetch client feedbacks', err)
      }
    }
    fetchMyFeedbacks()
    
    // Check for the feedbackJustSubmitted flag and refresh if set
    const checkFeedbackRefresh = () => {
      const flag = localStorage.getItem('feedbackJustSubmitted')
      if (flag === 'true') {
        fetchMyFeedbacks()
        localStorage.removeItem('feedbackJustSubmitted')
      }
    }
    
    window.addEventListener('focus', checkFeedbackRefresh)
    checkFeedbackRefresh() // Check on initial mount
    
    return () => window.removeEventListener('focus', checkFeedbackRefresh)
  }, [backendUrl, userData])

  // Only show pending appointments that haven't been accepted
  // Helper to prefer proposedDateTime when present
  const getDisplayDateTime = (appointment) => appointment.proposedDateTime || appointment.dateTime

  const pending = appointments
    .filter(a => a.status === 'pending')
    .sort((a,b) => new Date(getDisplayDateTime(a)) - new Date(getDisplayDateTime(b)));
    
  // Show confirmed appointments
  const upcoming = appointments
    .filter(a => a.status === 'confirmed')
    .sort((a,b) => new Date(getDisplayDateTime(a)) - new Date(getDisplayDateTime(b)));
    
  // Show only appointments marked as completed (attended)
  const past = appointments
    .filter(a => a.status === 'completed')
    .sort((a,b) => new Date(getDisplayDateTime(b)) - new Date(getDisplayDateTime(a)));

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-brownBG flex flex-col">
      <Navbar />

      <div className="w-full px-4 py-12 md:py-20 min-h-[140px] flex items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center w-full">My Appointments</h1>
      </div>

      <div className="flex-1 bg-creamcolor w-full px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Appointments */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-yellow-500 w-1 h-8 mr-3"></span>
                  Pending Appointments
                </h2>
                
                {pending.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No pending appointments</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pending.map(app => (
                      <div key={app._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {app.lawyer?.profilePic ? (
                                <img
                                  src={app.lawyer.profilePic.path ? `${backendUrl}/${app.lawyer.profilePic.path}` : `${backendUrl}/uploads/profilePics/${app.lawyer.profilePic.filename}`}
                                  alt={app.lawyer?.userName || 'lawyer'}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="bg-yellow-100 rounded-full p-3">
                                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{app.lawyer?.userName || app.lawyerName || 'Lawyer'}</h3>
                                <div className="flex items-center gap-2 mt-2 text-gray-600">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{new Date(getDisplayDateTime(app)).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>
                            {app.proposedDateTime && (
                              <button
                                onClick={() => setRescheduleModal({ open: true, appointment: app })}
                                className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold mt-2 w-full transition-colors'
                              >
                                📋 View Reschedule
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-green-600 w-1 h-8 mr-3"></span>
                  Confirmed Appointments
                </h2>
                
                {upcoming.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No upcoming appointments</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {upcoming.map(app => (
                      <div key={app._id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {app.lawyer?.profilePic ? (
                                <img
                                  src={app.lawyer.profilePic.path ? `${backendUrl}/${app.lawyer.profilePic.path}` : `${backendUrl}/uploads/profilePics/${app.lawyer.profilePic.filename}`}
                                  alt={app.lawyer?.userName || 'lawyer'}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="bg-blue-100 rounded-full p-3">
                                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{app.lawyer?.userName || app.lawyerName || 'Lawyer'}</h3>
                                <div className="flex items-center gap-2 mt-2 text-gray-600">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{new Date(getDisplayDateTime(app)).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>
                            {app.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => navigate(`/appointment-chat/${app._id}`)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                                >
                                  Chat
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Did you attend this appointment? This action cannot be undone.')) {
                                      try {
                                        const res = await axios.patch(
                                          `/api/appointment/update/${app._id}/status`,
                                          { status: 'completed' }
                                        );
                                        if (res.data.appointment) {
                                          setAppointments(prev => 
                                            prev.map(a => a._id === app._id ? res.data.appointment : a)
                                          );
                                          toast.success('Appointment marked as completed!');
                                        }
                                      } catch (err) {
                                        console.error('Failed to mark appointment as completed', err);
                                        toast.error(err.response?.data?.message || 'Failed to update appointment status');
                                      }
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                                >
                                  Attend
                                </button>
                              </>
                            )}
                            {app.status === 'completed' && (
                              <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                                Done
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Appointments */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-gray-600 w-1 h-8 mr-3"></span>
                  Attended Appointments
                </h2>
                
                {past.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No attended appointments yet</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {past.map(app => (
                      <div key={app._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {app.lawyer?.profilePic ? (
                                <img
                                  src={app.lawyer.profilePic.path ? `${backendUrl}/${app.lawyer.profilePic.path}` : `${backendUrl}/uploads/profilePics/${app.lawyer.profilePic.filename}`}
                                  alt={app.lawyer?.userName || 'lawyer'}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="bg-gray-100 rounded-full p-3">
                                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <h3 className="text-lg font-semibold text-gray-700">{app.lawyer?.userName || app.lawyerName || 'Lawyer'}</h3>
                                <div className="flex items-center gap-2 mt-2 text-gray-500">
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{new Date(getDisplayDateTime(app)).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="bg-gray-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                              Done
                            </span>
                            {/* Show Give Feedback button if not already submitted for this appointment */}
                            {(() => {
                              const already = clientFeedbacks.some(f => f.appointment && String(f.appointment) === String(app._id))
                              if (already) {
                                return (
                                  <button className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium" disabled>
                                    Feedback submitted
                                  </button>
                                )
                              }
                              return (
                                <button
                                  onClick={() => navigate(`/feedback/${app.lawyer?._id || app.lawyerId}/${app._id}`)}
                                  className="bg-brownBG hover:bg-brownforhover text-creamcolor px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200"
                                >
                                  Give Feedback
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Footer />

      {rescheduleModal.open && rescheduleModal.appointment && (
        <RescheduleResponseModal
          appointment={rescheduleModal.appointment}
          backendUrl={backendUrl}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onSuccess={(updatedAppointment) => {
            setAppointments(prev => prev.map(a => a._id === updatedAppointment._id ? updatedAppointment : a));
            setRescheduleModal({ open: false, appointment: null });
          }}
        />
      )}
    </div>
  )
}

export default MyAppointment