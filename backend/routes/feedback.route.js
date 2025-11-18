import express from 'express'
import {
  submitFeedback,
  getLawyerFeedback,
  getClientFeedback,
  updateFeedback,
  deleteFeedback,
  getLawyerFeedbackPaginated
} from '../controllers/feedback.controller.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Submit feedback for a lawyer
router.post('/submit', requireAuth, submitFeedback)

// Get feedback for a lawyer (public)
router.get('/lawyer/:lawyerId', getLawyerFeedback)

// Get feedback for a lawyer with pagination
router.get('/lawyer/:lawyerId/paginated', getLawyerFeedbackPaginated)

// Get all feedback submitted by logged-in client
router.get('/my-feedback', requireAuth, getClientFeedback)

// Update feedback
router.put('/:feedbackId', requireAuth, updateFeedback)

// Delete feedback
router.delete('/:feedbackId', requireAuth, deleteFeedback)

export default router
