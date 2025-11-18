import express from 'express'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createAppointmentReminder,
  createAppointmentNotification,
  sendFeedbackRequest
} from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Get all notifications for logged-in user
router.get('/', requireAuth, getNotifications)

// Get unread notification count
router.get('/unread/count', requireAuth, getUnreadCount)

// Mark specific notification as read
router.patch('/:notificationId/read', requireAuth, markAsRead)

// Mark all notifications as read
router.patch('/read-all', requireAuth, markAllAsRead)

// Delete specific notification
router.delete('/:notificationId', requireAuth, deleteNotification)

// Delete all notifications
router.delete('/', requireAuth, deleteAllNotifications)

// Internal routes (should be protected by internal API key or microservice)
router.post('/internal/appointment-reminder', createAppointmentReminder)
router.post('/internal/appointment-notification', createAppointmentNotification)
router.post('/internal/feedback-request', sendFeedbackRequest)

export default router
