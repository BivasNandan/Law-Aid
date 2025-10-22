import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { io } from 'socket.io-client'

const MyAppointment = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

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
      socket = io(backendUrl, { withCredentials: true })
      socket.on('connect_error', (e) => console.warn('Socket connect error', e))
      socket.on('appointmentStatusUpdated', (updated) => {
        setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a))
      })
    } catch (e) {
      console.warn('Socket init failed', e)
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [backendUrl, userData])

  const upcoming = appointments.filter(a => new Date(a.dateTime) >= new Date()).sort((a,b)=> new Date(a.dateTime)-new Date(b.dateTime))
  const past = appointments.filter(a => new Date(a.dateTime) < new Date()).sort((a,b)=> new Date(b.dateTime)-new Date(a.dateTime))

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
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
              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-blue-600 w-1 h-8 mr-3"></span>
                  Upcoming Appointments
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
                                  <span>{new Date(app.dateTime).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>
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
                  Past Appointments
                </h2>
                
                {past.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No previous appointments</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {past.map(app => (
                      <div key={app._id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 opacity-75">
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
                                  <span>{new Date(app.dateTime).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                              {app.status || 'Completed'}
                            </span>
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
    </div>
  )
}

export default MyAppointment