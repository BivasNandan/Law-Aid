import React, { useState, useContext } from 'react'
import axios from '../lib/axiosConfig'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'

const FeedbackForm = ({ lawyerId, appointmentId, lawyerName, onSuccess }) => {
  const { backendUrl } = useContext(Appcontext)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setLoading(true)
      await axios.post(
        `${backendUrl}/api/feedback/submit`,
        {
          lawyerId,
          appointmentId,
          rating,
          comment
        },
        { withCredentials: true }
      )

      toast.success('Thank you! Your feedback has been submitted.')
      // Set flag so MyAppointments can refresh its feedback list
      localStorage.setItem('feedbackJustSubmitted', 'true')
      setRating(0)
      setComment('')
      if (onSuccess) onSuccess()
    } catch (err) {
      console.error('Error submitting feedback:', err)
      toast.error(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='bg-creamcolor rounded-2xl shadow-xl border-2 border-brown p-6 md:p-8'>
      <h3 className='text-2xl font-bold text-brownBG mb-2'>Rate Your Experience</h3>
      <p className='text-browntextcolor/70 mb-6'>Help us improve by sharing your feedback about {lawyerName}</p>

      <form onSubmit={handleSubmitFeedback} className='space-y-6'>
        {/* Star Rating */}
        <div>
          <label className='block text-sm font-semibold text-browntextcolor/70 uppercase tracking-wide mb-3'>
            Rating
          </label>
          <div className='flex gap-2'>
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type='button'
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className='transition-transform duration-200 hover:scale-110'
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-300 text-gray-300'
                  }`}
                  viewBox='0 0 20 20'
                >
                  <path d='M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z' />
                </svg>
              </button>
            ))}
          </div>
          <p className='text-sm text-brownBG font-semibold mt-2'>
            {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
          </p>
        </div>

        {/* Comment */}
        <div>
          <label className='block text-sm font-semibold text-browntextcolor/70 uppercase tracking-wide mb-3'>
            Comments (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder='Share your experience... (max 500 characters)'
            maxLength={500}
            rows={4}
            className='w-full p-3 bg-AboutBackgroudColor border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brown2 text-brownBG resize-none'
          />
          <p className='text-xs text-browntextcolor/70 mt-1'>
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className='flex gap-3 pt-4'>
          <button
            type='submit'
            disabled={loading || rating === 0}
            className='flex-1 bg-brownBG hover:bg-brownforhover disabled:bg-gray-400 text-creamcolor px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Submit Feedback
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default FeedbackForm
