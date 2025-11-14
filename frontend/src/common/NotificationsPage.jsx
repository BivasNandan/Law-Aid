import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../Navbar'
import Footer from '../Footer'
import { toast } from 'react-hot-toast'

const NotificationsPage = () => {
  const { backendUrl } = useContext(Appcontext)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/notifications?page=${page}&limit=20`, {
        withCredentials: true
      })
      let filteredNotifications = res.data.notifications || []

      if (filter === 'unread') {
        filteredNotifications = filteredNotifications.filter(n => !n.isRead)
      } else if (filter === 'read') {
        filteredNotifications = filteredNotifications.filter(n => n.isRead)
      }

      setNotifications(filteredNotifications)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      )
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${backendUrl}/api/notifications/${notificationId}`, {
        withCredentials: true
      })
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      toast.success('Notification deleted')
    } catch (err) {
      console.error('Error deleting notification:', err)
      toast.error('Failed to delete notification')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      )
      fetchNotifications()
      toast.success('All notifications marked as read')
    } catch (err) {
      console.error('Error marking all as read:', err)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return

    try {
      await axios.delete(`${backendUrl}/api/notifications`, {
        withCredentials: true
      })
      setNotifications([])
      toast.success('All notifications deleted')
    } catch (err) {
      console.error('Error deleting all:', err)
      toast.error('Failed to delete notifications')
    }
  }

  return (
    <div className='min-h-screen bg-creamcolor'>
      <Navbar />

      {/* Hero Section */}
      <div className='bg-gradient-to-r from-brownBG to-browntextcolor text-creamcolor py-12'>
        <div className='max-w-6xl mx-auto px-6'>
          <h1 className='text-4xl font-bold mb-2'>Notifications</h1>
          <p className='text-creamcolor/80'>Stay updated with your appointments and messages</p>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-6 py-12'>
        {/* Filter Tabs */}
        <div className='flex gap-3 mb-6'>
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                filter === f
                  ? 'bg-brownBG text-creamcolor'
                  : 'bg-AboutBackgroudColor text-brownBG border-2 border-brown'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {notifications.length > 0 && (
          <div className='flex gap-3 mb-6'>
            <button
              onClick={handleMarkAllAsRead}
              className='px-4 py-2 bg-brownBG text-creamcolor rounded-lg font-semibold hover:bg-brownforhover transition-all'
            >
              Mark All as Read
            </button>
            <button
              onClick={handleDeleteAll}
              className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all'
            >
              Delete All
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className='space-y-3'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-4 border-brown mx-auto'></div>
              <p className='text-browntextcolor mt-4'>Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className='text-center py-12 bg-creamcolor rounded-2xl shadow-lg border-2 border-brown'>
              <svg
                className='w-16 h-16 mx-auto mb-4 text-brown/30'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                />
              </svg>
              <p className='text-browntextcolor/70 text-lg'>No notifications</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification._id}
                className={`p-4 rounded-xl border-2 border-brown shadow-md transition-all ${
                  !notification.isRead
                    ? 'bg-creamcolor border-brown'
                    : 'bg-white border-brown/10'
                }`}
              >
                <div className='flex gap-4'>
                  {/* Icon */}
                  <div className='flex-shrink-0 w-10 h-10 bg-AboutBackgroudColor rounded-lg flex items-center justify-center border border-brown'>
                    {notification.type === 'appointment_reminder' && (
                      <svg className='w-6 h-6 text-brown2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                    {notification.type === 'appointment_confirmed' && (
                      <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    )}
                    {notification.type === 'feedback_request' && (
                      <svg className='w-6 h-6 text-yellow-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                    {notification.type === 'message' && (
                      <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='font-bold text-brownBG'>{notification.title}</h3>
                      {!notification.isRead && (
                        <span className='flex-shrink-0 w-3 h-3 bg-brown rounded-full'></span>
                      )}
                    </div>
                    <p className='text-sm text-browntextcolor mt-1'>{notification.message}</p>
                    <div className='flex items-center justify-between mt-3 gap-2'>
                      <span className='text-xs text-browntextcolor/50'>
                        {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <div className='flex gap-2'>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className='text-xs bg-brownBG text-creamcolor px-3 py-1 rounded hover:bg-brownforhover transition-all'
                          >
                            Mark Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className='text-xs bg-AboutBackgroudColor text-brownBG px-3 py-1 rounded hover:bg-red-100 transition-all border border-brown'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex justify-center gap-2 mt-8'>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className='px-4 py-2 bg-brownBG text-creamcolor rounded-lg disabled:opacity-50'
            >
              Previous
            </button>
            <span className='px-4 py-2 text-brownBG font-semibold'>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className='px-4 py-2 bg-brownBG text-creamcolor rounded-lg disabled:opacity-50'
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default NotificationsPage
