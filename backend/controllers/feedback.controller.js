import Feedback from '../models/feedback.js'
import User from '../models/user.js'
import Appointment from '../models/appointment.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// Submit feedback/rating for a lawyer after consultation
export const submitFeedback = asyncHandler(async (req, res) => {
  const { lawyerId, appointmentId, rating, comment } = req.body
  const clientId = req.user.id

  // Validate inputs
  if (!lawyerId || !rating) {
    return res.status(400).json({ message: 'Lawyer ID and rating are required' })
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }

  // Verify appointment exists and belongs to this client
  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment || appointment.client.toString() !== clientId) {
      return res.status(403).json({ message: 'Unauthorized: appointment not found' })
    }
  }

  // Check if feedback already exists for this appointment
  if (appointmentId) {
    const existingFeedback = await Feedback.findOne({ appointment: appointmentId })
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback already submitted for this appointment' })
    }
  }

  // Create feedback
  const feedback = new Feedback({
    lawyer: lawyerId,
    client: clientId,
    appointment: appointmentId,
    rating,
    comment: comment || ''
  })

  await feedback.save()

  // Populate references
  await feedback.populate([
    { path: 'lawyer', select: 'userName profilePic specialization' },
    { path: 'client', select: 'userName email' }
  ])

  res.status(201).json({
    message: 'Feedback submitted successfully',
    feedback
  })
})

// Get feedback for a lawyer (average rating and all reviews)
export const getLawyerFeedback = asyncHandler(async (req, res) => {
  const { lawyerId } = req.params

  const feedbacks = await Feedback.find({ lawyer: lawyerId })
    .populate('client', 'userName profilePic')
    .sort({ createdAt: -1 })

  const averageRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(2)
    : 0

  res.status(200).json({
    lawyer: lawyerId,
    totalReviews: feedbacks.length,
    averageRating,
    feedbacks
  })
})

// Get feedback submitted by a client
export const getClientFeedback = asyncHandler(async (req, res) => {
  const clientId = req.user.id

  const feedbacks = await Feedback.find({ client: clientId })
    .populate('lawyer', 'userName profilePic specialization')
    .sort({ createdAt: -1 })

  res.status(200).json({
    message: 'Your feedback history',
    feedbacks
  })
})

// Update feedback (only by client who submitted it)
export const updateFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params
  const { rating, comment } = req.body
  const clientId = req.user.id

  const feedback = await Feedback.findById(feedbackId)
  if (!feedback) {
    return res.status(404).json({ message: 'Feedback not found' })
  }

  if (feedback.client.toString() !== clientId) {
    return res.status(403).json({ message: 'Unauthorized: cannot update this feedback' })
  }

  if (rating) {
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }
    feedback.rating = rating
  }

  if (comment !== undefined) {
    feedback.comment = comment
  }

  await feedback.save()

  await feedback.populate([
    { path: 'lawyer', select: 'userName profilePic specialization' },
    { path: 'client', select: 'userName email' }
  ])

  res.status(200).json({
    message: 'Feedback updated successfully',
    feedback
  })
})

// Delete feedback (only by client who submitted it)
export const deleteFeedback = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params
  const clientId = req.user.id

  const feedback = await Feedback.findById(feedbackId)
  if (!feedback) {
    return res.status(404).json({ message: 'Feedback not found' })
  }

  if (feedback.client.toString() !== clientId) {
    return res.status(403).json({ message: 'Unauthorized: cannot delete this feedback' })
  }

  await Feedback.findByIdAndDelete(feedbackId)

  res.status(200).json({ message: 'Feedback deleted successfully' })
})

// Get all feedback for a lawyer with pagination
export const getLawyerFeedbackPaginated = asyncHandler(async (req, res) => {
  const { lawyerId } = req.params
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10

  const skip = (page - 1) * limit

  const feedbacks = await Feedback.find({ lawyer: lawyerId })
    .populate('client', 'userName profilePic')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const totalFeedbacks = await Feedback.countDocuments({ lawyer: lawyerId })

  const averageRating = totalFeedbacks > 0
    ? (await Feedback.aggregate([
        { $match: { lawyer: lawyerId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]))[0].avgRating.toFixed(2)
    : 0

  res.status(200).json({
    lawyer: lawyerId,
    totalReviews: totalFeedbacks,
    averageRating,
    page,
    totalPages: Math.ceil(totalFeedbacks / limit),
    feedbacks
  })
})
