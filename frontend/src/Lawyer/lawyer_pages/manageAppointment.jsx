import React, { useContext, useEffect, useState } from 'react'
import { Appcontext } from '../../lib/Appcontext'
import axios from 'axios'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { toast } from 'react-hot-toast'
import RescheduleModal from '../lawyer_components/RescheduleModal'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'

const ManageAppointment = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null })

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userData) return setLoading(false)
      try {
        const res = await axios.get(`${backendUrl}/api/appointment/user/${userData._id}`, { withCredentials: true })
        setAppointments(res.data.appointments || [])
      } catch (err) {
        console.error('Failed to load appointments', err)
        toast.error('Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()
    
    const interval = setInterval(fetchAppointments, 5000)
    
    return () => clearInterval(interval)
  }, [backendUrl, userData])

  useEffect(() => {
    if (!userData) return
    let socket
    try {
      socket = io(backendUrl, { withCredentials: true, transports: ['polling', 'websocket'] })
      
      socket.on('appointmentStatusUpdated', (updated) => {
        console.log('Received appointmentStatusUpdated:', updated)
        setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a))
      })

      socket.on('rescheduleProposed', (data) => {
        console.log('Received rescheduleProposed:', data)
        const fetchFresh = async () => {
          try {
            const res = await axios.get(`${backendUrl}/api/appointment/user/${userData._id}`, { withCredentials: true })
            setAppointments(res.data.appointments || [])
          } catch (err) {
            console.error('Failed to refresh appointments', err)
          }
        }
        fetchFresh()
      })
    } catch (e) {
      console.warn('Socket init failed in ManageAppointment', e)
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [backendUrl, userData])

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`${backendUrl}/api/appointment/update/${id}/status`, { status }, { withCredentials: true })
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a))
      toast.success(`Appointment ${status}`)
    } catch (err) {
      console.error('Failed to update status', err)
      toast.error('Could not update appointment')
    }
  }

  const handleRescheduleClick = (appointment) => {
    setRescheduleModal({ open: true, appointment })
  }

  const handleRescheduleSuccess = (updatedAppointment) => {
    setAppointments(prev => prev.map(a => a._id === updatedAppointment._id ? updatedAppointment : a))
  }

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to get the display date (proposed if exists, otherwise original)
  const getDisplayDateTime = (appointment) => {
    return appointment.proposedDateTime || appointment.dateTime
  }

  const pending = appointments.filter(a => a.status === 'pending')

  return (
    <div className='min-h-screen bg-AboutBackgroudColor flex flex-col'>
      <Navbar />
      
      <div className='bg-gradient-to-r from-brownBG to-brown2 text-white py-12 md:py-16 lg:py-20 relative overflow-hidden'>
        {/* Decorative background elements */}
        <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20'></div>
        <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>
        
        <div className='max-w-6xl mx-auto px-4 md:px-8 lg:px-16 relative z-10'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 leading-tight'>Manage Appointments</h1>
          <p className='text-brown mt-4 text-center text-lg md:text-xl max-w-2xl mx-auto'>View and manage all your client appointments in one place</p>
          
          {/* Stats bar */}
          <div className='flex justify-center gap-8 mt-8 pt-8 border-t border-white/10 flex-wrap'>
            <div className='text-center'>
              <div className='text-3xl md:text-4xl font-bold'>{appointments.length}</div>
              <div className='text-sm text-brown mt-1'>Total Appointments</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl md:text-4xl font-bold'>{pending.length}</div>
              <div className='text-sm text-brown mt-1'>Pending Requests</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl md:text-4xl font-bold'>
                {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className='text-sm text-brown mt-1'>Confirmed</div>
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 bg-AboutBackgroudColor w-full px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
          ) : (
            <div className='space-y-8'>
              {/* Pending Requests */}
              <div>
                <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
                  <span className="bg-yellow-500 w-1 h-8 mr-3"></span>
                  Pending Requests
                </h2>
                {pending.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className='text-gray-500 text-lg'>No pending appointment requests</p>
                  </div>
                ) : (
                  <div className='grid gap-4'>
                    {pending.map(app => (
                      <div key={app._id} className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200'>
                        <div className='flex flex-col lg:flex-row lg:items-center gap-4'>
                          <div className='flex items-start gap-4 flex-1'>
                            {app.client?.profilePic ? (
                              <img
                                src={app.client.profilePic.path ? `${backendUrl}/${app.client.profilePic.path}` : `${backendUrl}/uploads/profilePics/${app.client.profilePic.filename}`}
                                alt={app.client?.userName || 'client'}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="bg-yellow-100 rounded-full p-3">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                            <div className='flex-1'>
                              <p className='text-lg font-semibold text-gray-900'>{app.client?.userName || 'Client'}</p>
                              <div className='flex items-center gap-2 mt-2 text-gray-600'>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className='text-sm'>{new Date(getDisplayDateTime(app)).toLocaleString()}</span>
                              </div>
                              {app.notes && (
                                <p className='text-sm text-gray-500 mt-2 italic'>"{app.notes}"</p>
                              )}
                            </div>
                          </div>
                          <div className='flex gap-2 lg:flex-col xl:flex-row'>
                            <button 
                              onClick={() => updateStatus(app._id, 'confirmed')} 
                              className='bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex-1 lg:flex-none'
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => handleRescheduleClick(app)} 
                              className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex-1 lg:flex-none'
                            >
                              Reschedule
                            </button>
                            <button 
                              onClick={() => updateStatus(app._id, 'cancelled')} 
                              className='bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium transition-colors flex-1 lg:flex-none'
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Appointments */}
              <div>
                <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
                  <span className="bg-blue-600 w-1 h-8 mr-3"></span>
                  All Appointments
                </h2>
                {appointments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className='text-gray-500 text-lg'>No appointments found</p>
                  </div>
                ) : (
                  <div className='grid gap-4'>
                    {appointments.map(app => (
                      <div key={app._id} className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                          <div className='flex items-start gap-4 flex-1'>
                            {app.client?.profilePic ? (
                              <img
                                src={app.client.profilePic.path ? `${backendUrl}/${app.client.profilePic.path}` : `${backendUrl}/uploads/profilePics/${app.client.profilePic.filename}`}
                                alt={app.client?.userName || 'client'}
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
                              <p className='text-lg font-semibold text-gray-900'>{app.client?.userName || 'Client'}</p>
                              <div className='flex items-center gap-2 mt-2 text-gray-600'>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className='text-sm'>{new Date(getDisplayDateTime(app)).toLocaleString()}</span>
                              </div>
                              {app.proposedDateTime && (
                                <div className='mt-2 flex items-center gap-2 text-orange-600 text-sm'>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium">Rescheduled Time</span>
                                </div>
                              )}
                              {app.rescheduleReason && (
                                <p className='text-sm text-gray-500 mt-1 italic'>Reason: "{app.rescheduleReason}"</p>
                              )}
                            </div>
                          </div>
                          <div className='flex flex-col items-end gap-2'>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>

                            {app.status === 'confirmed' && (
                              <button
                                onClick={() => navigate(`/appointment-chat/${app._id}`)}
                                className='mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded-lg text-sm font-medium transition-colors'
                              >
                                Chat
                              </button>
                            )}

                            {userData?.role === 'lawyer' && app.status === 'confirmed' && (
                              <button
                                onClick={() => handleRescheduleClick(app)}
                                className='mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm font-medium transition-colors'
                              >
                                Reschedule
                              </button>
                            )}
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

      {rescheduleModal.open && (
        <RescheduleModal
          appointment={rescheduleModal.appointment}
          backendUrl={backendUrl}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  )
}

export default ManageAppointment