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

  // Fetch law data if updating
  useEffect(() => {
    if (id) {
      fetchLawData()
    }
  }, [id])

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
    <div className="min-h-screen bg-AboutBackgroudColor py-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 mt-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-brown p-8 mb-8">
          <h1 className="text-4xl font-bold text-brownBG mb-2 font-inria">
            {id ? 'Update Law' : 'Add New Law'}
          </h1>
          <p className="text-browntextcolor font-inria">
            {id ? 'Update the law information below' : 'Fill in the details to add a new law to the database'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg border border-brown p-8">
          <div className="space-y-6">
            {/* Code Number and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Code Number</label>
                <input name="codeNumber" value={formData.codeNumber} onChange={handleChange} className="w-full px-4 py-2 border rounded" placeholder="e.g. 420 or Section 5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border rounded">
                  <option value="criminal">Criminal</option>
                  <option value="civil">Civil</option>
                  <option value="family">Family</option>
                  <option value="cyber">Cyber</option>
                  <option value="property">Property</option>
                  <option value="labour">Labour</option>
                  <option value="public">Public</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Title</label>
              <input name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border rounded" placeholder="Law title" />
            </div>

            {/* Official text */}
            <div>
              <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Official Text (optional)</label>
              <textarea name="officialText" value={formData.officialText} onChange={handleChange} className="w-full px-4 py-3 border rounded" rows={4} placeholder="Full official wording or a short excerpt" />
            </div>

            {/* Definition / Bangla / English explanations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Definition / Summary</label>
                <textarea name="definition" value={formData.definition} onChange={handleChange} className="w-full px-4 py-3 border rounded" rows={6} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">Bangla Explanation</label>
                <textarea name="banglaExplanation" value={formData.banglaExplanation} onChange={handleChange} className="w-full px-4 py-3 border rounded mb-4" rows={6} />
                <label className="block text-sm font-semibold text-brownBG mb-2 font-inria">English Explanation</label>
                <textarea name="englishExplanation" value={formData.englishExplanation} onChange={handleChange} className="w-full px-4 py-3 border rounded" rows={4} />
              </div>
            </div>

            {/* Verification checkbox (show only to admin) */}
            {userData?.role === 'admin' && (
              <div className="flex items-center gap-3">
                <input name="isVerified" checked={Boolean(formData.isVerified)} onChange={handleChange} type="checkbox" id="isVerified" />
                <label htmlFor="isVerified" className="text-sm text-browntextcolor">Mark as verified (admin only)</label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-brownBG text-creamcolor rounded font-semibold">{loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Law' : 'Create Law')}</button>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  )
}

export default LawForm