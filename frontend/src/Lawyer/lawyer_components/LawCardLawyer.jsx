import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Appcontext } from '../../lib/Appcontext'

const LawCardLawyer= ({ law, onDelete, onUpdate, onViewDetails }) => {
  const navigate = useNavigate()

  const handleView = (id) => {
    if (onViewDetails && typeof onViewDetails === 'function') return onViewDetails(id)
    if (id) navigate(`/law/${id}`)
    else navigate('/viewLaw')
  }

  const { userData } = useContext(Appcontext)
  const canEdit = userData?.role === 'admin' || userData?.role === 'lawyer'

  return (
    <div className="bg-white rounded-lg shadow-lg border border-brown overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Card Header - Clickable */}
      <div 
        onClick={() => handleView(law._id)}
        className="cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="bg-brownBG text-creamcolor px-6 py-4">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold font-inria">
              {law.codeNumber || 'N/A'}
            </span>
            <span className="bg-brown2 text-white text-xs px-3 py-1 rounded-full font-inria">
              {law.category ? String(law.category).charAt(0).toUpperCase() + String(law.category).slice(1) : 'Other'}
            </span>
          </div>
          <h3 className="text-xl font-bold font-inria line-clamp-2">
            {law.title || 'Untitled Law'}
          </h3>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {law.definition && (
            <p className="text-browntextcolor text-sm mb-4 font-inria line-clamp-3">
              {law.definition}
            </p>
          )}

          {law.banglaExplanation && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-brownBG mb-1 font-inria">বাংলা ব্যাখ্যা:</h4>
              <p className="text-browntextcolor text-sm font-inria line-clamp-2">
                {law.banglaExplanation}
              </p>
            </div>
          )}

          {/* Verification Badge */}
          {law.isVerified && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-inria mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer - Action Buttons */}
      <div className="px-6 pb-6 flex gap-3">
        {/* View Details Button */}
        <button
          onClick={() => handleView(law._id)}
          className="flex-1 bg-brownBG hover:bg-brownforhover text-creamcolor font-semibold py-2 px-4 rounded transition-colors duration-200 font-inria text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>

        {/* Update Button (visible only to admin/lawyer) */}
        {canEdit ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUpdate && onUpdate(law._id)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 font-inria text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete && onDelete(law._id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 font-inria text-sm flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default LawCardLawyer