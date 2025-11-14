import React, { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'

const ViewFeedback = () => {
  const { lawyerId } = useParams()
  const { backendUrl } = useContext(Appcontext)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${backendUrl}/api/feedback/lawyer/${lawyerId}`)
        setFeedbacks(res.data.feedbacks || [])
      } catch (err) {
        console.error('Failed to load feedbacks', err)
      } finally {
        setLoading(false)
      }
    }
    if (lawyerId) fetch()
  }, [backendUrl, lawyerId])

  return (
    <div className='min-h-screen bg-AboutBackgroudColor'>
      <Navbar />
      <div className='bg-gradient-to-r from-brownBG to-brown2 text-white py-12 md:py-16 lg:py-20 relative overflow-hidden'>
        {/* Decorative background elements */}
        <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20'></div>
        <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>
        
        <div className='max-w-5xl mx-auto px-8 md:px-16 lg:px-28 relative z-10'>
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 leading-tight'>Client Feedback</h1>
          <p className='text-brown mt-4 text-center text-lg md:text-xl max-w-2xl mx-auto'>See what your clients think about your services and expertise</p>
          
          {/* Stats bar */}
          <div className='flex justify-center gap-8 mt-8 pt-8 border-t border-white/10'>
            <div className='text-center'>
              <div className='text-3xl md:text-4xl font-bold'>{feedbacks.length}</div>
              <div className='text-sm text-brown mt-1'>Total Feedback</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl md:text-4xl font-bold'>
                {feedbacks.length > 0 
                  ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                  : '0'}
              </div>
              <div className='text-sm text-brown mt-1'>Average Rating</div>
            </div>
          </div>
        </div>
      </div>
      <div className='max-w-5xl mx-auto px-4 py-12'>

        {loading ? (
          <div className='text-center py-8'>Loading feedbacks...</div>
        ) : feedbacks.length === 0 ? (
          <div className='bg-white rounded-lg p-8 shadow'>No feedback yet for this lawyer.</div>
        ) : (
          <div className='space-y-4'>
            {feedbacks.map(f => (
              <div key={f._id} className='bg-white rounded-lg p-4 shadow'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-AboutBackgroudColor flex items-center justify-center text-brown2 font-semibold'>
                      {f.client?.userName ? f.client.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className='text-sm font-semibold text-brownBG'>{f.client?.userName || 'Client'}</div>
                      <div className='text-xs text-browntextcolor'>{new Date(f.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-1' aria-label={`${f.rating} out of 5 stars`}>
                    {[1,2,3,4,5].map(i => (
                      <svg key={i} className={`w-4 h-4 ${i <= f.rating ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill={i <= f.rating ? 'currentColor' : 'none'} stroke={i <= f.rating ? 'none' : 'currentColor'}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                      </svg>
                    ))}
                  </div>
                </div>
                {f.comment && <p className='mt-3 text-browntextcolor'>{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default ViewFeedback