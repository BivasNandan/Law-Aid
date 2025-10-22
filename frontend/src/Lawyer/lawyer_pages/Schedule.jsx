import React, { useContext, useEffect, useState } from 'react'
import { Appcontext } from '../../lib/Appcontext'
import axios from 'axios'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { io } from 'socket.io-client'

const Schedule = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userData) return setLoading(false)
      try {
        const res = await axios.get(`${backendUrl}/api/appointment/user/${userData._id}`, { withCredentials: true })
        setAppointments((res.data.appointments || []).filter(a => a.status === 'confirmed'))
      } catch (err) {
        console.error('Failed to load schedule', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAppointments()

    // listen for updates
    let socket
    try {
      socket = io(backendUrl, { withCredentials: true })
      socket.on('appointmentStatusUpdated', (updated) => {
        setAppointments(prev => {
          // if updated is confirmed, ensure it's present; if cancelled remove
          if (updated.status === 'confirmed') {
            const exists = prev.some(a => a._id === updated._id)
            if (exists) return prev.map(a => a._id === updated._id ? updated : a)
            return [...prev, updated]
          }
          // if cancelled or pending, remove from schedule
          return prev.filter(a => a._id !== updated._id)
        })
      })
    } catch (e) {
      console.warn('Socket init failed in Schedule', e)
    }

    return () => {
      if (socket) socket.disconnect()
    }
  }, [backendUrl, userData])

  // Sort appointments by date
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))

  return (
    <div className='min-h-screen bg-brownBG flex flex-col'>
      <Navbar />
      
      <div className="w-full px-4 py-12 md:py-20 min-h-[140px] flex items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center w-full">Your Schedules</h1>
      </div>

      <div className='flex-1 bg-creamcolor w-full px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {loading ? (
            <div className='flex items-center justify-center py-20'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
            </div>
          ) : (
            <div className='space-y-6'>
              <div>
                <h2 className='text-2xl font-semibold text-gray-800 mb-4 flex items-center'>
                  <span className="bg-green-600 w-1 h-8 mr-3"></span>
                  Confirmed Appointments
                </h2>
                
                {sortedAppointments.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className='text-gray-500 text-lg'>You have no scheduled appointments.</p>
                  </div>
                ) : (
                  <div className='grid gap-4'>
                    {sortedAppointments.map(app => (
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
                              <div className="bg-green-100 rounded-full p-3">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                <span className='text-sm'>{new Date(app.dateTime).toLocaleString()}</span>
                              </div>
                              {app.notes && (
                                <div className='flex items-start gap-2 mt-2 text-gray-500'>
                                  <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                  </svg>
                                  <span className='text-sm italic'>"{app.notes}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className='px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-2'>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Confirmed
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

export default Schedule