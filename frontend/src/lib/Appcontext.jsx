import React, { createContext, useState, useEffect } from 'react'

export const Appcontext = createContext()

export const AppcontextProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || false)
  const [userData, setUserData] = useState(null)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // Sync token with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const value = {
    token,
    setToken,
    userData,
    setUserData,
    backendUrl
  }

  return <Appcontext.Provider value={value}>{children}</Appcontext.Provider>
}