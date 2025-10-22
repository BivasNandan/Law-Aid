import React, { useContext, useEffect, useState } from 'react'
import { Appcontext } from '../../lib/Appcontext'
import axios from 'axios'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { toast } from 'react-hot-toast'

const ManageAppointment = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

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
  }, [backendUrl, userData])

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${backendUrl}/api/appointment/status/${id}`, { status }, { withCredentials: true })
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a))
      toast.success(`Appointment ${status}`)
    } catch (err) {
      console.error('Failed to update status', err)
      toast.error('Could not update appointment')
    }
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

  const pending = appointments.filter(a => a.status === 'pending')
  const upcoming = appointments.filter(a => new Date(a.dateTime) >= new Date() && a.status !== 'pending')

  return (
    <div className='min-h-screen bg-brownBG flex flex-col'>
      <Navbar />
      
      <div className="w-full px-4 py-12 md:py-20 min-h-[140px] flex items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white text-center w-full">Manage Appointments</h1>
      </div>

      <div className='flex-1 bg-creamcolor w-full px-4 py-8'>
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
                                <span className='text-sm'>{new Date(app.dateTime).toLocaleString()}</span>
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
                                <span className='text-sm'>{new Date(app.dateTime).toLocaleString()}</span>
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
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default ManageAppointment