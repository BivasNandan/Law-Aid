import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../lib/Appcontext'
import { useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)
  const { backendUrl } = useContext(Appcontext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${backendUrl}/api/auth/forgot-password`, { email }, { withCredentials: true })
      toast.success(res.data.message || 'If account exists, token generated')
      if (res.data.token) setToken(res.data.token)
    } catch (err) {
      console.error('forgot password error', err)
      toast.error(err.response?.data?.message || 'Failed to request reset')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creamcolor p-6">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="w-full border px-3 py-2 rounded" />
          </div>
          <div className="flex gap-2">
            <button disabled={loading} className="px-4 py-2 bg-brownBG text-white rounded">{loading ? 'Sending...' : 'Send Reset Token'}</button>
            <button type="button" onClick={() => navigate('/login')} className="px-4 py-2 border rounded">Back</button>
          </div>
        </form>

        {token && (
          <div className="mt-4 p-3 bg-gray-50 border rounded">
            <p className="text-sm">Dev token (use in reset page):</p>
            <pre className="text-xs break-all mt-2">{token}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
