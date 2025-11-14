import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const RescheduleModal = ({ appointment, backendUrl, onClose, onSuccess }) => {
  const [proposedDateTime, setProposedDateTime] = useState('')
  const [rescheduleReason, setRescheduleReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!proposedDateTime) {
      toast.error('Please select a date and time')
      return
    }

    setLoading(true)

    try {
      const res = await axios.patch(
        `${backendUrl}/api/appointment/reschedule/${appointment._id}/propose`,
        {
          proposedDateTime,
          rescheduleReason: rescheduleReason || null
        },
        { withCredentials: true }
      )

      toast.success('Reschedule proposal sent to client!')
      onSuccess(res.data.appointment)
      onClose()
    } catch (err) {
      console.error('Reschedule error:', err)
      toast.error(err.response?.data?.message || 'Failed to propose reschedule')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (current date and time)
  const now = new Date()
  const minDateTime = now.toISOString().slice(0, 16)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brown">Reschedule Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Current Time:</span>{' '}
            {new Date(appointment.dateTime).toLocaleString()}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Proposed Date & Time
            </label>
            <input
              type="datetime-local"
              value={proposedDateTime}
              onChange={(e) => setProposedDateTime(e.target.value)}
              min={minDateTime}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown/40 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Reschedule (Optional)
            </label>
            <textarea
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              placeholder="e.g., Emergency, Schedule conflict, etc."
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown/40 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{rescheduleReason.length}/300</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brown hover:bg-brownforhover text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </>
              ) : (
                'Propose Reschedule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RescheduleModal
