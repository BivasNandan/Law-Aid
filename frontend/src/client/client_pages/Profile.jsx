import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from "../../common/Navbar"
import Footer from '../../common/Footer'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { token, userData, setUserData, backendUrl, logout } = useContext(Appcontext)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [profileData, setProfileData] = useState({})
  const [previewImage, setPreviewImage] = useState(null)

  // Load profile from context on mount
  useEffect(() => {
    const fetchFullProfile = async () => {
      // Wait for Appcontext to finish initializing before deciding to redirect.
      // If loading is true, the context may still be hydrating from localStorage.
      if (loading) return

      if (!userData) {
        navigate('/login')
        return
      }
      try {
        setFetching(true)
        const id = userData._id || userData.userId || userData.id
        if (!id) {
          setProfileData(userData)
          if (userData.profilePic?.path) setPreviewImage(`${backendUrl}/${userData.profilePic.path}`)
          return
        }

        const route = userData.role === 'lawyer' ? 'lawyer-by-id' : 'client-by-id'
        const res = await axios.get(`${backendUrl}/api/auth/${route}/${id}`, { withCredentials: true })
        const data = res.data
        setProfileData(data)
        if (data.profilePic?.path) setPreviewImage(`${backendUrl}/${data.profilePic.path}`)
      } catch (error) {
        console.error('Failed to fetch full profile:', error)
        setProfileData(userData)
        if (userData?.profilePic?.path) setPreviewImage(`${backendUrl}/${userData.profilePic.path}`)
      } finally {
        setFetching(false)
      }
    }
    fetchFullProfile()
  }, [userData, navigate, backendUrl])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image size must be <5MB')
    setProfileData(prev => ({ ...prev, profilePicFile: file }))
    setPreviewImage(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!profileData.userName || !profileData.email) {
      return toast.error('Username and email are required')
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('userName', profileData.userName)
      formData.append('email', profileData.email)
      formData.append('firstName', profileData.firstName || '')
      formData.append('lastName', profileData.lastName || '')
      formData.append('phone', profileData.phone || '')
      formData.append('age', profileData.age || '')

      if (profileData.profilePicFile) {
        formData.append('profilePic', profileData.profilePicFile)
      }

      const res = await axios.put(
        `${backendUrl}/api/auth/edit-profile`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, withCredentials: true }
      )

      const updated = res.data
      setUserData(updated)
      setProfileData(updated)
      if (updated.profilePic?.path) setPreviewImage(`${backendUrl}/${updated.profilePic.path}`)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return

    setLoading(true)
    try {
      await axios.delete(`${backendUrl}/api/auth/delete-account`, { withCredentials: true })
      toast.success('Account deleted successfully')
      logout()
      navigate('/')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    } finally {
      setLoading(false)
    }
  }

  // Change password UI state and handler
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Please fill all password fields')
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match')
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters')

    try {
      setChangingPwd(true)
      const res = await axios.post(
        `${backendUrl}/api/auth/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true }
      )
      toast.success(res.data?.message || 'Password changed')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('change password failed', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPwd(false)
    }
  }

  if (fetching) return (
    <div className='min-h-screen bg-creamcolor flex flex-col'>
      <Navbar />
      <div className='flex-1 flex items-center justify-center font-inria'>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4"></div>
          <p className="text-browntextcolor text-lg font-inria">Loading your profile...</p>
        </div>
      </div>
      <Footer />
    </div>
  )

  const isLawyer = profileData.role === 'lawyer'

  // Compute years active safely
  const getYearsActive = () => {
    if (!profileData?.createdAt) return 0
    const createdYear = new Date(profileData.createdAt).getFullYear()
    const currentYear = new Date().getFullYear()
    return Math.max(0, currentYear - createdYear)
  }

  const yearsActive = getYearsActive()

  return (
    <div className='min-h-screen bg-creamcolor font-inria'>
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-brownBG text-creamcolor py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4 font-inria">My Profile</h1>
          <p className="text-xl text-brown max-w-2xl mx-auto font-inria">
            Manage your personal information and account settings
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Profile Card - Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-brown p-8 text-center sticky top-6">
              {/* Profile Image */}
              <div className="relative mb-6">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt='profile' 
                    className='w-32 h-32 rounded-2xl object-cover border-4 border-brownBG shadow-lg mx-auto' 
                  />
                ) : (
                  <div className='w-32 h-32 rounded-2xl bg-AboutBackgroudColor flex items-center justify-center border-4 border-brownBG shadow-lg mx-auto'>
                    <svg className='w-12 h-12 text-brownBG' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'/>
                    </svg>
                  </div>
                )}

                {isEditing && (
                  <label className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <input type='file' accept='image/*' onChange={handleImageChange} className='hidden' />
                    <div className='bg-brownBG hover:bg-brownforhover text-creamcolor px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors duration-200 shadow-lg'>
                      Change Photo
                    </div>
                  </label>
                )}
              </div>

              {/* User Info */}
              <h2 className='text-2xl font-bold text-brownBG mb-3'>{profileData.userName || 'User'}</h2>
              <div className="mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  isLawyer ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {profileData.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'User'}
                </span>
              </div>
              <p className='text-browntextcolor text-sm break-words mb-6'>{profileData.email}</p>

              {/* Member Since */}
              <div className="border-t border-brown pt-4">
                <p className="text-sm text-brown2 font-semibold">Member Since</p>
                <p className="text-brownBG font-bold">
                  {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '—'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-3">
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="w-full bg-brownBG hover:bg-brownforhover text-creamcolor py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
                
                <button 
                  onClick={logout} 
                  className="w-full bg-AboutBackgroudColor hover:bg-brown text-brownBG py-3 rounded-xl font-semibold transition-all duration-200 border border-brown2 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Personal Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-brown p-8 mb-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-brownBG font-inria">Personal Information</h2>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-brownBG hover:bg-brownforhover text-creamcolor px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {/* Username & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">Username</label>
                    <input 
                      type="text" 
                      name="userName" 
                      value={profileData.userName || ''} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={profileData.email || ''} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                </div>

                {/* First & Last Name */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">First Name</label>
                    <input 
                      type="text" 
                      placeholder="First Name" 
                      value={profileData.firstName || ''} 
                      disabled={!isEditing}
                      onChange={(e) => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">Last Name</label>
                    <input 
                      type="text" 
                      placeholder="Last Name" 
                      value={profileData.lastName || ''} 
                      disabled={!isEditing}
                      onChange={(e) => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Phone & Age */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">Phone</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={profileData.phone || ''} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brownBG mb-3 uppercase tracking-wide">Age</label>
                    <input 
                      type="number" 
                      name="age" 
                      value={profileData.age || ''} 
                      onChange={handleChange} 
                      disabled={!isEditing} 
                      min={18} 
                      max={120}
                      className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none focus:ring-2 focus:ring-brownBG focus:border-brownBG disabled:bg-AboutBackgroudColor text-brownBG font-inria transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-4 pt-8 border-t border-brown">
                    <button 
                      onClick={handleSave} 
                      disabled={loading}
                      className="bg-brownBG hover:bg-brownforhover text-creamcolor px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => { 
                        setIsEditing(false); 
                        setProfileData(userData); 
                        setPreviewImage(userData.profilePic?.path ? `${backendUrl}/${userData.profilePic.path}` : null) 
                      }}
                      className="bg-AboutBackgroudColor hover:bg-brown text-brownBG px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg border-2 border-brown2"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Actions */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Account Management */}
              <div className="bg-white rounded-2xl shadow-xl border border-brown p-6">
                <h3 className="text-xl font-bold text-brownBG mb-4 font-inria">Account Management</h3>
                <div className="space-y-4">
                  {!showChangePassword ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowChangePassword(true)} className="flex-1 w-full bg-AboutBackgroudColor hover:bg-brown text-brownBG py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg border border-brown2 flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-brownBG mb-2">Current Password</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brownBG mb-2">New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brownBG mb-2">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-brown rounded-xl focus:outline-none" />
                      </div>

                      <div className="flex gap-2">
                        <button disabled={changingPwd} onClick={handleChangePassword} className="flex-1 bg-brownBG hover:bg-brownforhover text-creamcolor py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50">
                          {changingPwd ? 'Changing...' : 'Change Password'}
                        </button>
                        <button disabled={changingPwd} onClick={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }} className="flex-1 bg-AboutBackgroudColor hover:bg-brown text-brownBG py-3 rounded-xl font-semibold transition-all duration-200 border border-brown2">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Role-specific button: My Appointments for clients, Schedule for lawyers */}
                  <div className="mt-4">
                    {profileData.role === 'client' && (
                      <button onClick={() => navigate('/my-appointments')} className="w-full bg-brownBG hover:bg-brownforhover text-creamcolor py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg">
                        My Appointments
                      </button>
                    )}
                    {profileData.role === 'lawyer' && (
                      <button onClick={() => navigate('/schedule')} className="w-full bg-brownBG hover:bg-brownforhover text-creamcolor py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg">
                        Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white rounded-2xl shadow-xl border border-red-300 p-6">
                
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ProfilePage