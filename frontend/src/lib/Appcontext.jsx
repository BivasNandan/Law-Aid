import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const Appcontext = createContext()

export const AppcontextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [token, setToken] = useState(null) // <-- token state added
  const [loading, setLoading] = useState(true)
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const storedUserData = localStorage.getItem('userData')
      const storedToken = localStorage.getItem('token') // <-- get token from storage
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
      // If both profilePic and email exist, assume full object already loaded
      if (userData.profilePic !== undefined && userData.email) return

      try {
        const route = userData.role === 'lawyer' ? 'lawyer-by-id' : 'client-by-id'
        const res = await axios.get(`${backendUrl}/api/auth/${route}/${userData._id}`, { withCredentials: true })
        if (res && res.data) {
          // Only update if profilePic was missing (to avoid unnecessary updates)
          if (!userData.profilePic) {
            setUserData(res.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch full user in Appcontext:', err)
      }
    }
    fetchFullUser()
  }, [userData?._id, backendUrl]) // Only trigger when userId or backend changes

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
    token,          // <-- expose token
    setUserData: handleSetUserData,
    setToken,       // <-- optional, can be used in login page
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
