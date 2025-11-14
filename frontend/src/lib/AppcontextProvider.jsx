import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Appcontext } from './Appcontext.jsx'

export const AppcontextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData')
      const storedToken = localStorage.getItem('token')
      if (storedUserData) setUserData(JSON.parse(storedUserData))
      if (storedToken) setToken(storedToken)
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // If userData exists but is partial (e.g., set after login), fetch full profile
  useEffect(() => {
    const fetchFullUser = async () => {
      if (!userData || !userData._id) return
      // If profilePic already present, assume full object
      if (userData.profilePic && userData.email) return

      try {
        const route = userData.role === 'lawyer' ? 'lawyer-by-id' : 'client-by-id'
        const res = await axios.get(`${backendUrl}/api/auth/${route}/${userData._id}`, { withCredentials: true })
        if (res && res.data) {
          setUserData(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch full user in Appcontext:', err)
      }
    }
    fetchFullUser()
  }, [userData, backendUrl])

  // Sync userData and token with localStorage
  useEffect(() => {
    if (userData) localStorage.setItem('userData', JSON.stringify(userData))
    else localStorage.removeItem('userData')

    if (token) localStorage.setItem('token', token)
    else localStorage.removeItem('token')
  }, [userData, token])

  // Handle login - set user data + token
  const handleSetUserData = (data, tokenValue) => {
    setUserData(data)
    if (tokenValue) setToken(tokenValue)
  }

  // Logout function to clear everything
  const logout = () => {
    setUserData(null)
    setToken(null)
    localStorage.removeItem('userData')
    localStorage.removeItem('token')
    localStorage.removeItem('selectedRole')
    sessionStorage.clear()
  }

  const value = {
    userData,
    token,
    setUserData: handleSetUserData,
    setToken,
    backendUrl,
    logout,
    loading
  }

  return (
    <Appcontext.Provider value={value}>
      {children}
    </Appcontext.Provider>
  )
}
