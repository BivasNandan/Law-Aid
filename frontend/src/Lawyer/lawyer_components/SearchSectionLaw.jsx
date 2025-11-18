import React, { useState, useEffect, useContext } from 'react'
import axios from '../../lib/axiosConfig'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Appcontext } from '../../lib/Appcontext.jsx'
import law_image from "../../assets/law_image.jpg"
import law4 from "../../assets/law 4.jpg"
import LawCardLawyer from './LawCardLawyer.jsx'

const SearchSectionLaw = () => {
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext)
  const navigate = useNavigate()

  const [laws, setLaws] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState('')
  const [codeNumber, setCodeNumber] = useState('')

  const [categories, setCategories] = useState([])
  const [codes, setCodes] = useState([])

  useEffect(() => {
    loadInitial()
  }, [])

  const loadInitial = async () => {
    await Promise.all([fetchLaws(), fetchCategories(), fetchCodes()])
  }

  // Fetch all laws using getLaw endpoint
  const fetchLaws = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/law/getLaw`, { withCredentials: true })
      if (res.status === 200 && Array.isArray(res.data)) {
        setLaws(res.data)
        setFiltered(res.data)
      }
    } catch (err) {
      console.warn('fetchLaws failed', err.message)
      toast.error('Failed to load laws')
      setLaws([])
      setFiltered([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories using getCategories endpoint
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/law/categories`, { withCredentials: true })
      if (res.status === 200 && Array.isArray(res.data)) {
        setCategories(res.data)
      }
    } catch (err) {
      console.warn('fetchCategories failed', err.message)
      setCategories(['criminal', 'civil', 'family', 'cyber', 'property', 'labour', 'public', 'other'])
    }
  }

  // Fetch code numbers using getCodeNumbers endpoint
  const fetchCodes = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/law/codes`, { withCredentials: true })
      if (res.status === 200 && Array.isArray(res.data)) {
        setCodes(res.data)
      }
    } catch (err) {
      console.warn('fetchCodes failed', err.message)
      setCodes([])
    }
  }

  // Handle search - if no filters, show all laws using getLaw
  const handleSearch = async () => {
    try {
      setLoading(true)
      
      // If no search criteria, fetch all laws
      if (!searchTerm && !category && !codeNumber) {
        await fetchLaws()
        return
      }

      // Build query params for filterLaws endpoint
      const params = {}
      if (searchTerm) params.title = searchTerm
      if (category) params.category = category
      if (codeNumber) params.codeNumber = codeNumber

      const res = await axios.get(`${backendUrl}/api/law/filterLaws`, { 
        params, 
        withCredentials: true 
      })
      
      if (res.status === 200 && Array.isArray(res.data)) {
        setFiltered(res.data)
      }
    } catch (err) {
      console.warn('Search failed', err.message)
      
      if (err.response && err.response.status === 404) {
        setFiltered([])
        toast.info('No laws found matching your criteria')
      } else {
        toast.error('Search failed')
        const results = laws.filter((law) => {
          const matchesSearch = !searchTerm ||
            law.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (law.definition && law.definition.toLowerCase().includes(searchTerm.toLowerCase()))

          const matchesCategory = !category || law.category?.toLowerCase() === category.toLowerCase()

          const matchesCode = !codeNumber || String(law.codeNumber).toLowerCase() === String(codeNumber).toLowerCase()

          return matchesSearch && matchesCategory && matchesCode
        })

        setFiltered(results)
      }
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setCategory('')
    setCodeNumber('')
    setFiltered(laws)
  }

  // Handle delete law
  const handleDelete = async (lawId) => {
    if (!window.confirm('Are you sure you want to delete this law?')) return

    try {
      // backend route is /api/law/delete/:id
      const res = await axios.delete(`${backendUrl}/api/law/delete/${lawId}`, { 
        withCredentials: true 
      })
      
      if (res.status === 200) {
        toast.success('Law deleted successfully')
        // Remove from both arrays
        setLaws(prev => prev.filter(l => l._id !== lawId))
        setFiltered(prev => prev.filter(l => l._id !== lawId))
        
        // Refresh categories and codes dropdowns to reflect deletion
        await Promise.all([fetchCategories(), fetchCodes()])
      }
    } catch (err) {
      console.error('Delete failed', err)
      toast.error(err.response?.data?.message || 'Failed to delete law')
    }
  }

  // Navigate to add law form
  const handleAddLaw = () => {
    navigate('/law-form')
  }

  // Navigate to update law form
  const handleUpdate = (lawId) => {
    navigate(`/law-form/${lawId}`)
  }

  // Navigate to law details
  const handleViewDetails = (lawId) => {
    // navigate to client-facing law details route
    if (!lawId) return navigate('/viewLaw')
    navigate(`/law/${lawId}`)
  }

  return (
    <div>
      {/* Redesigned Hero Section with Search */}
      <div className="relative text-creamcolor">
        <div className='bg-gradient-to-r from-brownBG to-brown2 text-white py-14 md:py-20 lg:py-24 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>

          <div className='max-w-7xl mx-auto px-6'>
            <div className='text-center mb-6'>
              <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold mb-2 font-inria'>MANAGE LAWS</h1>
              <p className='text-md md:text-lg text-brown mt-2'>Add, Update, Delete and Search Laws</p>
            </div>

            {/* Search controls (no background card) */}
            <div className='max-w-5xl mx-auto -mt-4'>
              <div className='p-2 md:p-3'>
                <div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-end'>
                  <div className='md:col-span-1'>
                    <label className='block text-sm mb-2 font-inria text-white'>Search</label>
                    <input 
                      type='text'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder='Keywords...'
                      className='w-full px-4 py-3 rounded-lg bg-white text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown'
                    />
                  </div>

                  <div className='md:col-span-1'>
                    <label className='block text-sm mb-2 font-inria text-white'>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className='w-full px-4 py-3 rounded-lg bg-white text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown'
                    >
                      <option value=''>All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {String(c).charAt(0).toUpperCase() + String(c).slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='md:col-span-1'>
                    <label className='block text-sm mb-2 font-inria text-white'>Code Number</label>
                    <select
                      value={codeNumber}
                      onChange={(e) => setCodeNumber(e.target.value)}
                      className='w-full px-4 py-3 rounded-lg bg-white text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown'
                    >
                      <option value=''>All Codes</option>
                      {codes.map((cn) => (
                        <option key={cn} value={cn}>{cn}</option>
                      ))}
                    </select>
                  </div>

                  <div className='md:col-span-1 flex items-end'>
                    <button 
                      onClick={handleSearch}
                      disabled={loading}
                      className='w-full bg-browntextcolor hover:bg-brownforhover text-creamcolor font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 font-inria'
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  <div className='md:col-span-1 flex items-end'>
                    {(userData?.role === 'admin' || userData?.role === 'lawyer') ? (
                      <button 
                        onClick={handleAddLaw}
                        className='w-full  bg-browntextcolor hover:bg-brownforhover text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 font-inria flex items-center justify-center gap-2'
                      >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                        </svg>
                        Add Law
                      </button>
                    ) : (
                      <button 
                        onClick={() => navigate('/login')}
                        className='w-full bg-gray-200 text-brownBG font-semibold py-3 px-6 rounded-lg transition-all duration-200 font-inria'
                      >
                        Login to add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Results Count */}
        {!loading && filtered.length > 0 && (
          <div className="mb-8 flex justify-between items-center">
            <p className="text-lg text-browntextcolor font-inria">
              Showing {filtered.length} {filtered.length === 1 ? 'law' : 'laws'}
            </p>
            {(searchTerm || category || codeNumber) && (
              <button 
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-brownBG rounded font-inria transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4"></div>
              <p className="text-browntextcolor text-lg font-inria">Loading laws...</p>
            </div>
          </div>
        )}

        {/* Results Grid - 3 column layout */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(law => (
              <LawCardLawyer 
                key={law._id} 
                law={law}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-lg border border-brown">
            <div className="w-20 h-20 bg-AboutBackgroudColor rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brown2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brownBG mb-3 font-inria">No laws found</h3>
            <p className="text-browntextcolor max-w-md mx-auto mb-6 font-inria">
              {(searchTerm || category || codeNumber) 
                ? 'No laws match your current search criteria. Try adjusting your search terms.'
                : 'No laws in the database yet. Click the "Add Law" button to create one.'}
            </p>
            <div className="flex gap-4 justify-center">
              {(searchTerm || category || codeNumber) && (
                <button 
                  onClick={clearSearch}
                  className="px-6 py-3 bg-brownBG hover:bg-brownforhover text-creamcolor font-semibold rounded transition-colors duration-200 font-inria"
                >
                  Clear Search
                </button>
              )}
              <button 
                onClick={handleAddLaw}
                className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold rounded transition-colors duration-200 font-inria"
              >
                Add New Law
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="bg-AboutBackgroudColor py-16 border-t border-brown">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Image */}
            <div className="bg-AboutBackgroudColor rounded-lg flex items-center justify-center border border-brown overflow-hidden">
              <img 
                src={law_image} 
                alt="Law Aid About Us" 
                className='w-full rounded-lg shadow-lg object-cover' 
                style={{ height: '21.7rem' }} 
              />
            </div>

            {/* Content */}
            <div>
              <h2 className="text-4xl font-bold text-brownBG mb-4 font-inria">
                Manage Legal Knowledge<br />Database
              </h2>
              <p className="text-browntextcolor mb-8 leading-relaxed font-inria">
                Add, update, and organize laws in the database. Keep the legal information accurate and accessible for everyone who needs it.
              </p>

              {/* Stats/Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Database Coverage</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">98%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Accuracy Rate</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">99%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '99%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Regular Updates</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">100%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchSectionLaw;