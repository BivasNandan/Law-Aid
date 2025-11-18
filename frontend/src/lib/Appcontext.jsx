import React, { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const Appcontext = createContext()

export const AppcontextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [token, setToken] = useState(null) // <-- token state added
  const [loading, setLoading] = useState(true)
  
  // Ensure backendUrl matches `frontend/src/lib/axiosConfig.js` default (port 5000)
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // On mount, verify server-side session first. Do not trust localStorage alone
  // (httpOnly cookies cannot be read from JS, so we confirm session via API).
  useEffect(() => {
    let mounted = true

    const verifySession = async () => {
      try {
        setLoading(true)
        // Try to get current user from server using httpOnly cookie
        const res = await axios.get(`${backendUrl}/api/auth/me`, { withCredentials: true })
        if (!mounted) return

        // Accept either `{ user: { ... } }` or direct user object responses
        const serverUser = res?.data?.user || (res?.data && (res.data._id || res.data.email) ? res.data : null)
        if (serverUser) {
          // Server confirms active session — use server-provided user
          setUserData(serverUser)
        } else {
          // No active session on server — clear any stale local data
          localStorage.removeItem('userData')
          setUserData(null)
        }
      } catch (err) {
        // No valid server session (or endpoint missing) — clear localStorage to avoid stale auto-login
        if (mounted) {
          console.info('No active server session; clearing local userData')
          localStorage.removeItem('userData')
          setUserData(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    verifySession()

    return () => { mounted = false }
  }, [])

  // Log when provider mounts so we can verify it's present during runtime
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.info('AppcontextProvider mounted, initial userData:', userData)
  }, [])

  // If userData exists but is partial (e.g., set after login), fetch full profile
  useEffect(() => {
    const fetchFullUser = async () => {
      if (!userData) return

      console.log('🔍 Appcontext fetchFullUser - userData.role:', userData.role, 'userData._id:', userData._id)

      try {
        // Admin users are stored in a dedicated admin collection — fetch their profile from admin API
        if (userData.role === 'admin') {
          console.log('📂 Fetching admin profile...')
          const res = await axios.get(`${backendUrl}/api/admin/profile`, { withCredentials: true })
          if (res && res.data) {
            const adminObj = { ...res.data, role: 'admin', _id: userData._id || 'admin', userName: userData.userName || 'Admin' }
            console.log('✅ Admin profile fetched:', adminObj)
            setUserData(adminObj)
          }
          return
        }

        // For lawyers/clients, ensure we have an id to fetch
        const id = userData._id || userData.userId || userData.id
        if (!id) return

        // If both profilePic and email exist, assume full object already loaded
        if (userData.profilePic !== undefined && userData.email) return

        console.log('📂 Fetching', userData.role, 'profile...')
        const route = userData.role === 'lawyer' ? 'lawyer-by-id' : 'client-by-id'
        const res = await axios.get(`${backendUrl}/api/auth/${route}/${id}`, { withCredentials: true })
        if (res && res.data) {
          // Only update if profilePic was missing (to avoid unnecessary updates)
          if (!userData.profilePic) {
            console.log('✅', userData.role, 'profile fetched')
            setUserData(res.data)
          }
        }
      } catch (err) {
        console.error('Failed to fetch full user in Appcontext:', err)
      }
    }
    fetchFullUser()
  }, [userData, backendUrl])

  // Sync userData with localStorage (tokens are stored in httpOnly cookies, not localStorage)
  useEffect(() => {
    if (userData) localStorage.setItem('userData', JSON.stringify(userData))
    else localStorage.removeItem('userData')
  }, [userData])

  // Handle login - set user data (token is stored in httpOnly cookie by backend)
  const handleSetUserData = (data, tokenValue) => {
    setUserData(data)
    // tokenValue is provided by frontend but not stored in localStorage
    // Auth relies on httpOnly cookies set by the backend
  }

  // Logout function to clear everything
  const logout = () => {
    setUserData(null)
    setToken(null)
    localStorage.removeItem('userData')
    localStorage.removeItem('selectedRole')
    sessionStorage.clear()
    // Cookies are cleared by the /api/auth/logout endpoint
  }

  const value = {
    userData,
    token,          // Still exported for compatibility, but not used for auth
    setUserData: handleSetUserData,
    setToken,       // Still exported for compatibility, but not used for auth storage
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
