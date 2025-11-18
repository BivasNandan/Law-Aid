import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Appcontext } from '../../../lib/Appcontext'
import law11 from "../../../assets/law11.jpeg"
import law10 from "../../../assets/law10.jpg"
import LawyerCard from './LawyerCard'


const SearchLawyer = () => {
  const { backendUrl, userData, loading: appLoading } = useContext(Appcontext)
  const navigate = useNavigate()

  const [lawyers, setLawyers] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Search states
  const [searchName, setSearchName] = useState('')
  const [specialization, setSpecialization] = useState('')
  // experience will be a string like 'any' or '0-2' or '3-5'
  const [experience, setExperience] = useState('any')

  const [specializations, setSpecializations] = useState([])

  useEffect(() => {
    loadInitial()
  }, [])

  const loadInitial = async () => {
    await Promise.all([fetchLawyers(), fetchSpecializations()])
  }

  const fetchLawyers = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${backendUrl}/api/auth/lawyers`)
      const list = res.data.lawyers || res.data || []
      setLawyers(list)
      setResults(list)
    } catch (err) {
      console.warn('fetchLawyers failed', err.message)
      setLawyers([])
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecializations = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/auth/lawyers`)
      const list = res.data.lawyers || res.data || []
      const specs = Array.from(new Set(list.map(l => l.specialization).filter(Boolean)))
      setSpecializations(specs.sort())
    } catch (err) {
      console.warn('fetchSpecializations failed', err.message)
      setSpecializations(['Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law', 'Constitutional Law'])
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (specialization) params.specialization = specialization
      // parse experience dropdown into min/max
      if (experience && experience !== 'any') {
        const parts = experience.split('-')
        const min = Number(parts[0]) || 0
        const max = parts[1] ? Number(parts[1]) : 50
        params.minExperience = min
        params.maxExperience = max
      }

      const res = await axios.get(`${backendUrl}/api/auth/filter-lawyers`, { params })
      let list = Array.isArray(res.data) ? res.data : (res.data.lawyers || [])

      // Client-side name filtering
      if (searchName && searchName.trim() !== '') {
        const query = searchName.trim().toLowerCase()
        list = list.filter(l => (l.userName || '').toLowerCase().includes(query))
      }

      setResults(list)
      
      if (!list.length) {
        toast('No lawyers matched your search', { icon: '🔎' })
      }
    } catch (err) {
      console.warn('Server-side search failed', err.message)
      toast.error('Search failed — showing all results')
      
      // Fallback to client-side filtering
      let filtered = lawyers
      
      if (specialization) {
        filtered = filtered.filter(l => l.specialization === specialization)
      }
      
      // apply experience range filter
      if (!experience || experience === 'any') {
        // no filtering
      } else {
        const parts = experience.split('-')
        const min = Number(parts[0]) || 0
        const max = parts[1] ? Number(parts[1]) : 50
        filtered = filtered.filter(l => {
          const exp = l.experience || 0
          return exp >= min && exp <= max
        })
      }
      
      if (searchName && searchName.trim() !== '') {
        const query = searchName.trim().toLowerCase()
        filtered = filtered.filter(l => (l.userName || '').toLowerCase().includes(query))
      }
      
      setResults(filtered)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchName('')
    setSpecialization('')
    setExperience([0, 50])
    setResults(lawyers)
  }

  const openLawyer = (lawyer) => {
    if (lawyer && lawyer.userName) {
      navigate(`/lawyer/${lawyer.userName}`)
    } else {
      navigate('/lawyer-details')
    }
  }

  return (
    <div>
      {/* Hero Section with Search */}
      <div className="relative text-creamcolor py-20">
        {/* Background image */}
        <div
          className="absolute inset-0 -z-20"
          style={{ 
            backgroundImage: `url(${law11})`, 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'center', 
            backgroundSize: 'cover' 
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 -z-10" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />

        <div className="max-w-7xl mx-auto px-6">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-2 font-inria">FIND A LAWYER</h1>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Name Search */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Lawyer Name</label>
                <input 
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by name..."
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                />
              </div>

              {/* Specialization Select */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Specialization</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Experience Dropdown */}
              <div className="md:col-span-1">
                <label className="block text-sm mb-2 font-inria">Experience</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-creamcolor text-brownBG focus:outline-none focus:ring-2 focus:ring-brown2 font-inria border border-brown"
                >
                  <option value="any">Any experience</option>
                  <option value="0-2">0 - 2 yrs</option>
                  <option value="3-5">3 - 5 yrs</option>
                  <option value="6-10">6 - 10 yrs</option>
                  <option value="11-20">11 - 20 yrs</option>
                  <option value="21-50">21+ yrs</option>
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
        {!loading && results.length > 0 && (
          <div className="mb-8">
            <p className="text-lg text-browntextcolor font-inria">
              Showing {results.length} {results.length === 1 ? 'lawyer' : 'lawyers'}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4"></div>
              <p className="text-browntextcolor text-lg font-inria">Searching lawyer database...</p>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map(lawyer => (
              <LawyerCard 
                key={lawyer._id || lawyer.id || lawyer.userName} 
                lawyer={lawyer} 
                backendUrl={backendUrl}
                userData={userData}
                onBook={(e) => {
                  e.stopPropagation()
                  if (!userData && !appLoading) {
                    toast.error('Please log in to book an appointment')
                    navigate('/login')
                    return
                  }
                  navigate(`/book-appointment/${lawyer._id || lawyer.id}`)
                }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-lg border border-brown">
            <div className="w-20 h-20 bg-AboutBackgroudColor rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-brown2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-brownBG mb-3 font-inria">No lawyers found</h3>
            <p className="text-browntextcolor max-w-md mx-auto mb-6 font-inria">
              No lawyers match your current search criteria. Try adjusting your search terms.
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
            <div className="rounded-lg overflow-hidden border border-brown">
              <img 
                src={law10}  
                alt="Expert Lawyers"
                className='w-full h-full rounded-lg shadow-lg object-cover'
                style={{ height: '21.7rem' }}
              />
            </div>

            {/* Content */}
            <div>
              <h2 className="text-4xl font-bold text-brownBG mb-4 font-inria">
                Expert lawyers.<br />Ready to help.
              </h2>
              <p className="text-browntextcolor mb-8 leading-relaxed font-inria">
                Connect with experienced legal professionals who specialize in your area of need. Our network of qualified lawyers is ready to provide expert guidance and representation.
              </p>

              {/* Stats */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Client Satisfaction</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">99%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '99%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Verified Lawyers</span>
                    <span className="text-sm font-semibold text-brownBG font-inria">97%</span>
                  </div>
                  <div className="w-full bg-AboutBackgroudColor rounded-full h-2 border border-brown">
                    <div className="bg-brown2 h-2 rounded-full" style={{width: '97%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold text-brownBG font-inria">Response Rate</span>
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

export default SearchLawyer