import Notification from '../models/notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// Get all notifications for logged-in user
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20

  const skip = (page - 1) * limit

  const notifications = await Notification.find({ recipient: userId })
    .populate('relatedUser', 'userName profilePic specialization')
    .populate('relatedAppointment', 'dateTime status lawyer client')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const totalNotifications = await Notification.countDocuments({ recipient: userId })
  const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })

  res.status(200).json({
    message: 'Notifications retrieved',
    totalNotifications,
    unreadCount,
    page,
    totalPages: Math.ceil(totalNotifications / limit),
    notifications
  })
})

// Get unread notifications count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false
  })

  res.status(200).json({
    unreadCount
  })
})

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params
  const userId = req.user.id

  const notification = await Notification.findById(notificationId)

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' })
  }

  if (notification.recipient.toString() !== userId) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  notification.isRead = true
  await notification.save()

  res.status(200).json({
    message: 'Notification marked as read',
    notification
  })
})

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  )

  res.status(200).json({
    message: 'All notifications marked as read'
  })
})

// Delete a notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params
  const userId = req.user.id

  const notification = await Notification.findById(notificationId)

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' })
  }

  if (notification.recipient.toString() !== userId) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  await Notification.findByIdAndDelete(notificationId)

  res.status(200).json({
    message: 'Notification deleted'
  })
})

// Delete all notifications
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id

  await Notification.deleteMany({ recipient: userId })

  res.status(200).json({
    message: 'All notifications deleted'
  })
})

// Create appointment reminder notification (internal use)
export const createAppointmentReminder = asyncHandler(async (req, res) => {
  const { userId, appointmentId, appointmentDateTime, lawyerName, clientName } = req.body

  const reminderTime = new Date(appointmentDateTime)
  reminderTime.setHours(reminderTime.getHours() - 24) // 24 hours before

  const notification = new Notification({
    recipient: userId,
    type: 'appointment_reminder',
    title: 'Appointment Reminder',
    message: `Reminder: You have an appointment tomorrow at ${new Date(appointmentDateTime).toLocaleTimeString()}`,
    relatedAppointment: appointmentId,
    reminderTime,
    metadata: {
      appointmentDateTime,
      lawyerName,
      clientName
    }
  })

  await notification.save()

  res.status(201).json({
    message: 'Reminder notification created',
    notification
  })
})

// Create appointment confirmation notification (internal use)
export const createAppointmentNotification = asyncHandler(async (req, res) => {
  const { userId, appointmentId, type, message, lawyerName, clientName } = req.body

  const notification = new Notification({
    recipient: userId,
    type: type || 'appointment_confirmed',
    title: type === 'appointment_cancelled' ? 'Appointment Cancelled' : 'Appointment Confirmed',
    message: message || 'Your appointment has been confirmed',
    relatedAppointment: appointmentId,
    metadata: {
      lawyerName,
      clientName
    }
  })

  await notification.save()

  res.status(201).json({
    message: 'Notification created',
    notification
  })
})

// Send feedback request notification after appointment completion
export const sendFeedbackRequest = asyncHandler(async (req, res) => {
  const { clientId, lawyerId, appointmentId, lawyerName } = req.body

  const notification = new Notification({
    recipient: clientId,
    type: 'feedback_request',
    title: 'Share Your Feedback',
    message: `Please rate your consultation with ${lawyerName}`,
    relatedAppointment: appointmentId,
    relatedUser: lawyerId,
    metadata: {
      lawyerName
    }
  })

  await notification.save()

  res.status(201).json({
    message: 'Feedback request notification sent',
    notification
  })
})
