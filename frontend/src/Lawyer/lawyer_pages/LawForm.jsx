import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate, useParams } from 'react-router-dom'
import { Appcontext } from '../../lib/Appcontext.jsx'
import Navbar from "../../common/Navbar"
import Footer from "../../common/Footer"

const LawForm = () => {
  const { backendUrl, userData } = useContext(Appcontext)
  const navigate = useNavigate()
  const { id } = useParams() // Get law ID from URL if updating

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    codeNumber: '',
    title: '',
    definition: '',
    category: 'other',
    officialText: '',
    banglaExplanation: '',
    englishExplanation: '',
    isVerified: true
  })

  const fetchLawData = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/law/get/${id}`, { 
        withCredentials: true 
      })
      if (res.status === 200) {
        setFormData({
          codeNumber: res.data.codeNumber || '',
          title: res.data.title || '',
          definition: res.data.definition || '',
          category: res.data.category || 'other',
          officialText: res.data.officialText || '',
          banglaExplanation: res.data.banglaExplanation || '',
          englishExplanation: res.data.englishExplanation || '',
          isVerified: res.data.isVerified || false
        })
      }
    } catch (err) {
      console.error('Failed to fetch law data', err)
      toast.error('Failed to load law data')
      navigate('/admin/manage-laws')
    } finally {
      setLoading(false)
    }
  }

  // Fetch law data if updating
  useEffect(() => {
    if (id) {
      fetchLawData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    try {
      setLoading(true)
      
      // Prepare data
      const dataToSend = {
        ...formData,
        createdBy: userData?._id
      }

      let res
      if (id) {
        // Update existing law (backend uses PATCH /update/:id)
        res = await axios.patch(`${backendUrl}/api/law/update/${id}`, dataToSend, { withCredentials: true })
      } else {
        res = await axios.post(`${backendUrl}/api/law/createLaw`, dataToSend, { withCredentials: true })
      }

      if (res.status === 200 || res.status === 201) {
        toast.success(id ? 'Law updated successfully' : 'Law created successfully')
        navigate('/view-manage-law')
      }
    } catch (err) {
      console.error('Submit failed', err)
      toast.error(err.response?.data?.message || 'Failed to save law')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
  navigate('/view-manage-law')
  }

  if (loading && id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4"></div>
          <p className="text-browntextcolor text-lg font-inria">Loading law data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-AboutBackgroudColor">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-brownBG text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4 font-inria">
            {id ? 'Update Law' : 'Add New Law'}
          </h1>
          <p className="text-xl text-white/80 font-inria max-w-2xl mx-auto">
            {id ? 'Update the law information below' : 'Fill in the details to add a new law to the database'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl border border-brown p-8 mb-16">
          <div className="space-y-8">
            {/* Code Number and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="form-group">
                <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Code Number</label>
                <input 
                  name="codeNumber" 
                  value={formData.codeNumber} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200" 
                  placeholder="e.g. 420 or Section 5" 
                />
              </div>
              <div className="form-group">
                <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Category</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG appearance-none bg-white transition-all duration-200"
                >
                  <option value="criminal">Criminal Law</option>
                  <option value="civil">Civil Law</option>
                  <option value="family">Family Law</option>
                  <option value="cyber">Cyber Law</option>
                  <option value="property">Property Law</option>
                  <option value="labour">Labour Law</option>
                  <option value="public">Public Law</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Title</label>
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200" 
                placeholder="Enter the law title" 
              />
            </div>

            {/* Official text */}
            <div className="form-group">
              <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Official Text (optional)</label>
              <textarea 
                name="officialText" 
                value={formData.officialText} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200 min-h-[120px] resize-y" 
                placeholder="Full official wording or a short excerpt" 
              />
            </div>

            {/* Definition / Bangla / English explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="form-group">
                  <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Definition / Summary</label>
                  <textarea 
                    name="definition" 
                    value={formData.definition} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200 min-h-[180px] resize-y" 
                    placeholder="Provide a clear and concise definition"
                  />
                </div>
              </div>
              <div className="space-y-8">
                <div className="form-group">
                  <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">Bangla Explanation</label>
                  <textarea 
                    name="banglaExplanation" 
                    value={formData.banglaExplanation} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200 min-h-[180px] resize-y" 
                    placeholder="বাংলা ব্যাখ্যা"
                  />
                </div>
                <div className="form-group">
                  <label className="block text-lg font-semibold text-brownBG mb-3 font-inria">English Explanation</label>
                  <textarea 
                    name="englishExplanation" 
                    value={formData.englishExplanation} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 border-2 border-brown rounded-lg focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG transition-all duration-200 min-h-[120px] resize-y" 
                    placeholder="Simplified English explanation"
                  />
                </div>
              </div>
            </div>

            {/* Verification checkbox (show only to admin) */}
            {userData?.role === 'admin' && (
              <div className="flex items-center gap-3 border-t border-brown pt-6">
                <input 
                  name="isVerified" 
                  checked={formData.isVerified === true || formData.isVerified === 'true'} 
                  onChange={handleChange} 
                  type="checkbox" 
                  id="isVerified"
                  className="w-5 h-5 text-brownBG border-2 border-brown rounded focus:ring-brownBG" 
                />
                <label htmlFor="isVerified" className="text-lg text-browntextcolor font-inria">
                  Mark as verified (admin only)
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 border-t border-brown pt-8">
              <button 
                type="button" 
                onClick={handleCancel} 
                className="px-8 py-3 border-2 border-brown text-brownBG hover:bg-brown2 rounded-lg font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="px-8 py-3 bg-brownBG hover:bg-brownforhover text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {id ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  id ? 'Update Law' : 'Create Law'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  )
}

export default LawForm