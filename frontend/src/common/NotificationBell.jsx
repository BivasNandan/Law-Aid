import React, { useState, useContext, useEffect, useRef } from 'react'
import axios from 'axios'
import { Appcontext } from '../../lib/Appcontext'
import { toast } from 'react-hot-toast'

const NotificationBell = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/notifications/unread/count`, {
        withCredentials: true
      })
      setUnreadCount(res.data.unreadCount)
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userData) return

    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/notifications?limit=10`, {
        withCredentials: true
      })
      setNotifications(res.data.notifications || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and polling
  useEffect(() => {
    if (userData) {
      fetchUnreadCount()
      fetchNotifications()

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount()
      }, 30000)

      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Handle mark as read
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
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Handle delete notification
  const handleDeleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${backendUrl}/api/notifications/${notificationId}`,
        { withCredentials: true }
      )
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      toast.success('Notification deleted')
    } catch (err) {
      console.error('Error deleting notification:', err)
      toast.error('Failed to delete notification')
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      )
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  if (!userData) return null

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown)
          if (!showDropdown) fetchNotifications()
        }}
        className='relative p-2 hover:bg-AboutBackgroudColor rounded-lg transition-colors'
        title='Notifications'
      >
        <svg
          className='w-6 h-6 text-brownBG'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className='absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border-2 border-brown z-50 max-h-96 overflow-hidden flex flex-col'>
          {/* Header */}
          <div className='bg-gradient-to-r from-brownBG to-browntextcolor text-creamcolor p-4 border-b border-brown'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-bold'>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='text-sm text-creamcolor/80 hover:text-creamcolor'
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className='overflow-y-auto flex-1'>
            {loading ? (
              <div className='p-4 text-center text-browntextcolor'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-brown mx-auto'></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className='p-8 text-center text-browntextcolor/70'>
                <svg
                  className='w-12 h-12 mx-auto mb-3 text-brown/30'
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
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-brown/10 hover:bg-AboutBackgroudColor transition-colors ${
                    !notification.isRead ? 'bg-creamcolor' : 'bg-white'
                  }`}
                >
                  <div className='flex gap-3'>
                    <div className='flex-1'>
                      <div className='flex items-start justify-between gap-2'>
                        <h4 className='font-semibold text-brownBG text-sm'>{notification.title}</h4>
                        <button
                          onClick={() => handleDeleteNotification(notification._id)}
                          className='text-brown/50 hover:text-brown transition-colors'
                        >
                          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                          </svg>
                        </button>
                      </div>
                      <p className='text-xs text-browntextcolor mt-1'>{notification.message}</p>
                      <div className='flex items-center justify-between mt-2'>
                        <span className='text-xs text-browntextcolor/50'>
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification._id)}
                            className='text-xs bg-brownBG text-creamcolor px-2 py-1 rounded hover:bg-brownforhover transition-colors'
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className='p-3 border-t border-brown text-center bg-AboutBackgroudColor'>
              <a
                href='/notifications'
                className='text-sm font-semibold text-brownBG hover:text-brown transition-colors'
              >
                View all notifications →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
