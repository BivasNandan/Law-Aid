import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import { Appcontext } from '../../lib/Appcontext'

const LawDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { backendUrl, userData } = useContext(Appcontext)
  const [law, setLaw] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLaw = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${backendUrl}/api/law/get/${id}`, { withCredentials: true })
        if (res.status === 200) setLaw(res.data)
      } catch (err) {
        console.error('Failed to fetch law', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLaw()
  }, [id, backendUrl])

  

  if (loading) return (
    <div className='min-h-screen flex items-center justify-center bg-creamcolor'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4'></div>
        <p className='text-browntextcolor font-medium font-inria'>Loading law details...</p>
      </div>
    </div>
  )

  if (!law) return (
    <div className='min-h-screen flex items-center justify-center bg-creamcolor'>
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-brownBG mb-2 font-inria'>Law not found</h2>
        <p className='text-browntextcolor mb-6 font-inria'>The requested law could not be found in our database.</p>
        <button 
          onClick={() => navigate(userData?.role === 'lawyer' ? '/view-manage-law' : '/viewLaw')}
          className='px-6 py-3 bg-brownBG hover:bg-brownforhover text-creamcolor font-semibold rounded-md transition-all font-inria'
        >
          Back to Search
        </button>
      </div>
    </div>
  )



  return (
    <div className='min-h-screen bg-creamcolor'>
      <Navbar />
      
      {/* Hero Section with Law Title */}
      <div className={`bg-brownBG text-creamcolor py-16`}>
        <div className='max-w-6xl mx-auto px-6'>
          <button 
            onClick={() => navigate(userData?.role === 'lawyer' ? '/view-manage-law' : '/viewLaw')}
            className='flex items-center gap-2 text-brown hover:text-white mb-6 transition-colors group font-inria'
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Search
          </button>
          
          <div className='flex items-start gap-6'>
            
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-4'>
                <span className='inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider font-inria'>
                  {law.category || 'General Law'}
                </span>
                {law.isVerified && (
                  <span className='inline-flex items-center gap-1 bg-emerald-600 px-3 py-1 rounded-full text-xs font-bold'>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <h1 className='text-4xl font-bold mb-3 leading-tight font-inria'>{law.title}</h1>
              <div className='flex items-center gap-4 text-brown'>
                <span className='flex items-center gap-2 font-inria'>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code #{law.codeNumber}
                </span>
                <span className='flex items-center gap-2 font-inria'>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Enacted {new Date(law.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-6xl mx-auto px-6 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content Column */}
          <div className='lg:col-span-2'>
            {/* Definition/Description Card */}
              <div className='bg-creamcolor rounded-2xl shadow-xl p-8 border-2 border-brown mb-8'>
              <h2 className='text-2xl font-bold text-brownBG mb-4 flex items-center gap-3 font-inria'>
                <span className='text-3xl'>📜</span>
                Legal Definition
              </h2>
              <div className='prose prose-stone max-w-none'>
                <p className='text-browntextcolor leading-relaxed text-lg font-inria'>
                  {law.definition || law.description || 'No detailed description provided for this law.'}
                </p>
              </div>
            </div>

            {/* Bangla Explanation if available */}
            {law.banglaExplanation && (
            <div className='bg-creamcolor rounded-2xl shadow-xl p-8 border-2 border-brown mb-8'>
                <h2 className='text-2xl font-bold text-brownBG mb-4 flex items-center gap-3 font-inria'>
                  <span className='text-3xl'>📖</span>
                  বাংলা ব্যাখ্যা
                </h2>
                <div className='prose prose-stone max-w-none'>
                  <p className='text-browntextcolor leading-relaxed text-lg font-inria'>
                    {law.banglaExplanation}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Information */}
              <div className='bg-creamcolor rounded-2xl shadow-xl p-8 border-2 border-brown'>
              <h2 className='text-2xl font-bold text-brownBG mb-4 flex items-center gap-3 font-inria'>
                <span className='text-3xl'>ℹ️</span>
                Additional Information
              </h2>
              <div className='space-y-4'>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-brownBG rounded-full mt-2'></div>
                  <div>
                    <p className='font-semibold text-brownBG font-inria'>Applicability</p>
                    <p className='text-browntextcolor font-inria'>This law applies to all relevant jurisdictions unless specified otherwise.</p>
                  </div>
                </div>
                <div className='flex items-start gap-3'>
                  <div className='w-2 h-2 bg-brownBG rounded-full mt-2'></div>
                  <div>
                    <p className='font-semibold text-brownBG font-inria'>Status</p>
                    <p className='text-browntextcolor font-inria'>{law.isVerified ? 'Verified and active' : 'Pending verification'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            {/* Quick Info Card */}
              <div className='bg-creamcolor rounded-2xl shadow-xl p-6 mb-6 sticky top-24 border-2 border-brown'>
              <h3 className='text-xl font-bold text-brownBG mb-4 pb-3 border-b-2 border-brownBG font-inria'>
                Quick Information
              </h3>
              
              <div className='space-y-4'>
                <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Category</p>
                  <p className='text-base font-bold text-brownBG capitalize font-inria'>{law.category || 'General'}</p>
                </div>

                <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Code Number</p>
                  <p className='text-base font-mono font-bold text-brown2'>#{law.codeNumber}</p>
                </div>

                <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Enacted Year</p>
                  <p className='text-base font-bold text-brownBG font-inria'>{new Date(law.createdAt).getFullYear()}</p>
                </div>

                <div>
                    <p className='text-xs font-semibold text-browntextcolor/70 uppercase tracking-wider mb-1 font-inria'>Verification Status</p>
                  <div className='flex items-center gap-2'>
                    {law.isVerified ? (
                      <>
                        <div className='w-3 h-3 bg-emerald-600 rounded-full'></div>
                        <span className='text-base font-semibold text-emerald-700 font-inria'>Verified</span>
                      </>
                    ) : (
                      <>
                        <div className='w-3 h-3 bg-brown2 rounded-full'></div>
                        <span className='text-base font-semibold text-brown2 font-inria'>Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default LawDetails