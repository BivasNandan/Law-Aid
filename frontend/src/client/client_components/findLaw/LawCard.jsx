import React from 'react'
import { useNavigate } from 'react-router-dom'

const LawCard = ({ law }) => {
  const navigate = useNavigate()

  const getLawId = () => law._id || law.id || (law._doc && (law._doc._id || law._doc.id))

  const handleNavigateToLaw = (id) => {
    if (!id) {
      navigate('/viewLaw')
      return
    }
    navigate(`/law/${id}`)
  }

  const handleClick = () => {
    const id = getLawId()
    handleNavigateToLaw(id)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const formatCategory = (cat) => {
    if (!cat) return 'General'
    return String(cat).charAt(0).toUpperCase() + String(cat).slice(1)
  }

  const snippet = (text, n = 140) => {
    if (!text) return ''
    return text.length > n ? text.slice(0, n).trim() + '...' : text
  }

  // Color scheme based on category
  const getCategoryColor = (category) => {
    const colors = {
      criminal: 'bg-red-100 text-red-800 border-red-200',
      civil: 'bg-blue-100 text-blue-800 border-blue-200',
      family: 'bg-purple-100 text-purple-800 border-purple-200',
      corporate: 'bg-green-100 text-green-800 border-green-200',
      constitutional: 'bg-orange-100 text-orange-800 border-orange-200',
      property: 'bg-teal-100 text-teal-800 border-teal-200',
      contract: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      default: 'bg-AboutBackgroudColor text-browntextcolor border-brown'
    }
    return colors[category?.toLowerCase()] || colors.default
  }

  const categoryColor = getCategoryColor(law.category)

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="group bg-white rounded-xl shadow-lg border border-brown cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
      aria-label={`View details for ${law.title || 'law'}`}
    >
      <div className="p-6 text-left">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brownBG mb-3 group-hover:text-brownforhover transition-colors duration-200 font-inria leading-tight">
              {law.title}
            </h3>
            
            {/* Category and Code */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${categoryColor} font-inria`}>
                {formatCategory(law.category)}
              </span>
              <span className="text-sm font-mono text-browntextcolor bg-AboutBackgroudColor px-3 py-1.5 rounded-lg border border-brown font-inria">
                Code: {law.codeNumber || '—'}
              </span>
            </div>
          </div>

          {/* Verification Badge */}
          {law.isVerified && (
            <div className="flex-shrink-0 ml-3">
              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-3">
          {law.officialText && (
            <p className="text-sm text-browntextcolor leading-relaxed font-inria">
              {snippet(law.officialText, 160)}
            </p>
          )}

          {law.definition && !law.officialText && (
            <p className="text-sm text-browntextcolor leading-relaxed font-inria">
              {snippet(law.definition, 180)}
            </p>
          )}

          {/* Fallback content */}
          {!law.officialText && !law.definition && (
            <p className="text-sm text-brown2 italic font-inria">
              Comprehensive legal provision details available upon viewing.
            </p>
          )}
        </div>

        {/* Footer Section */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-brown">
          <div className="flex items-center gap-2 text-sm text-brown2 font-inria">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Enacted {law.createdAt ? new Date(law.createdAt).getFullYear() : '—'}</span>
          </div>

          {/* View Details CTA */}
          
          </div>
        </div>
      </div>
    
  )
}

export default LawCard