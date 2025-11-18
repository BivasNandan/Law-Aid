import React, { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const RescheduleResponseModal = ({ appointment, backendUrl, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  const handleRespond = async (response) => {
    setLoading(true)

    try {
      const res = await axios.patch(
        `${backendUrl}/api/appointment/reschedule/${appointment._id}/respond`,
        { response },
        { withCredentials: true }
      )

      toast.success(`Reschedule ${response}!`)
      onSuccess(res.data.appointment)
      onClose()
    } catch (err) {
      console.error('Response error:', err)
      toast.error(err.response?.data?.message || 'Failed to respond to reschedule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-brown">Reschedule Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">From:</span> {appointment.lawyer?.userName}
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-semibold mb-1">Current Time:</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(appointment.dateTime).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="border-t-2 border-gray-300 flex-1"></div>
              <span className="px-3 text-gray-500 text-sm">→</span>
              <div className="border-t-2 border-gray-300 flex-1"></div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-500 font-semibold mb-1">Proposed Time:</p>
              <p className="text-sm font-medium text-blue-800">
                {new Date(appointment.proposedDateTime).toLocaleString()}
              </p>
            </div>
          </div>

          {appointment.rescheduleReason && (
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-brown">
              <p className="text-xs text-gray-500 font-semibold mb-1">Reason:</p>
              <p className="text-sm text-gray-700 italic">{appointment.rescheduleReason}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleRespond('rejected')}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Decline
          </button>
          <button
            onClick={() => handleRespond('accepted')}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              'Accept'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RescheduleResponseModal
