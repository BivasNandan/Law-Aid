import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import LawCard from './LawCard.jsx'
import { Appcontext } from '../../../lib/Appcontext.jsx'
import law_image from "../../../assets/law_image.jpg"
import law4 from "../../../assets/law 4.jpg"

const SearchLaw = () => {
  const { backendUrl } = useContext(Appcontext)

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
      // Fallback categories based on law model enum
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
      
      // If backend search fails, try client-side filtering
      if (err.response && err.response.status === 404) {
        // No laws found
        setFiltered([])
        toast.info('No laws found matching your criteria')
      } else {
        toast.error('Search failed')
        // Fallback to client-side filter
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
    setFiltered(laws) // Show all laws when cleared
  }

  return (
    <div>
      {/* Hero Section with Search */}
      <div className="relative text-creamcolor py-20">
        {/* Background image */}
        <div
          className="absolute inset-0 -z-20"
          style={{ 
            backgroundImage: `url(${law4})`, 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'center', 
            backgroundSize: 'cover' 
          }}
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 -z-10" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />

        <div className="max-w-7xl mx-auto px-6">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-2 font-inria">SEARCH LAWS</h1>
          </div>

          {/* Search Form - Horizontal layout */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search Term */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Search</label>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Keywords..."
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                />
              </div>

              {/* Category select */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {String(c).charAt(0).toUpperCase() + String(c).slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Code Number select */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Code Number</label>
                <select
                  value={codeNumber}
                  onChange={(e) => setCodeNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                >
                  <option value="">All Codes</option>
                  {codes.map((cn) => (
                    <option key={cn} value={cn}>{cn}</option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <div className="md:col-span-1 flex items-end">
                <button 
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-browntextcolor hover:bg-brownforhover text-creamcolor font-semibold py-3 px-6 rounded transition-all duration-200 disabled:opacity-50 font-inria"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Results Count */}
        {!loading && filtered.length > 0 && (
          <div className="mb-8">
            <p className="text-lg text-browntextcolor font-inria">
              Showing {filtered.length} {filtered.length === 1 ? 'law' : 'laws'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4"></div>
              <p className="text-browntextcolor text-lg font-inria">Searching legal database...</p>
            </div>
          </div>
        )}

        {/* Results Grid - 3 column layout */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(law => (
              <LawCard key={law._id} law={law} />
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
              No laws match your current search criteria. Try adjusting your search terms.
            </p>
            <button 
              onClick={clearSearch}
              className="px-6 py-3 bg-brownBG hover:bg-brownforhover text-creamcolor font-semibold rounded transition-colors duration-200 font-inria"
            >
              Clear Search
            </button>
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
                You've got ideas.<br />We protect them.
              </h2>
              <p className="text-browntextcolor mb-8 leading-relaxed font-inria">
                Adipiscing nam neque hendrerit nec pellentesque diam a. Varius quisque odio mauris lectus consequat sed. Pretium purus feugiat volutpat pellentesque porta mauris nec vulputate.
              </p>

              {/* Stats/Progress Bars */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Successful Cases</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">98%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '98%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Criminal Law</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">96%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '96%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Banking and Finance</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">95%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '95%'}}></div>
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

export default SearchLaw;