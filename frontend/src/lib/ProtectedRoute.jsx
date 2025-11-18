import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { Appcontext } from './Appcontext'

/**
 * ProtectedRoute: Ensures only users with specific roles can access a route
 * @param {JSX.Element} element - The component to render if authorized
 * @param {string|string[]} allowedRoles - Role(s) allowed to access this route
 * @param {string} fallbackPath - Path to redirect to if unauthorized
 */
const ProtectedRoute = ({ element, allowedRoles, fallbackPath = '/login' }) => {
  const ctx = useContext(Appcontext) || {}
  const { userData, loading } = ctx

  if (ctx === undefined || Object.keys(ctx).length === 0) {
    // Defensive: context is missing — warn so we can trace provider issues
    // This prevents a crash when useContext returns undefined during HMR or bootstrapping
    // eslint-disable-next-line no-console
    console.warn('ProtectedRoute: Appcontext value is undefined or empty. Is the provider mounted?')
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-brownBG via-brown to-brownforhover'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4'></div>
          <p className='text-white font-medium'>Loading...</p>
        </div>
      </div>
    )
  }

  // If not logged in, redirect to login
  if (!userData) {
    return <Navigate to="/login" replace />
  }

  // Check if user's role is in allowed roles
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const isAuthorized = roles.includes(userData.role)

  if (!isAuthorized) {
    return <Navigate to={fallbackPath} replace />
  }

  return element
}

export default ProtectedRoute
