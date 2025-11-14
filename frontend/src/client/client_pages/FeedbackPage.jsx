import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../../lib/axiosConfig'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'
import FeedbackForm from '../../common/FeedbackForm'
import { toast } from 'react-hot-toast'

const FeedbackPage = () => {
  const { lawyerId, appointmentId } = useParams()
  const { backendUrl } = useContext(Appcontext)
  const [lawyerName, setLawyerName] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/auth/lawyer-by-id/${lawyerId}`)
        setLawyerName(res.data?.userName || '')
      } catch (err) {
        console.warn('Could not fetch lawyer name for feedback page', err)
      } finally {
        setLoading(false)
      }
    }
    if (lawyerId) fetchLawyer()
  }, [backendUrl, lawyerId])

  const handleSuccess = () => {
    toast.success('Feedback submitted — redirecting to profile')
    navigate(`/lawyer/${lawyerName || ''}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brownBG via-brown to-brownforhover flex flex-col">
      <Navbar />
      <div className="w-full px-4 py-12 md:py-20 min-h-[140px] flex items-center">
        <h1 className="text-4xl md:text-5xl font-bold text-brownBG text-center w-full">Give Feedback</h1>
      </div>

      <div className="flex-1 w-full px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brownBG"></div>
            </div>
          ) : (
            <FeedbackForm
              lawyerId={lawyerId}
              appointmentId={appointmentId}
              lawyerName={lawyerName}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default FeedbackPage
