import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Appcontext } from '../../lib/Appcontext'
import Navbar from '../../common/Navbar'
import Footer from '../../common/Footer'

const AdminProfile = () => {
  const navigate = useNavigate()
  const { userData, setUserData, backendUrl, logout, loading } = useContext(Appcontext)

  // Local UI state
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({})
  const [previewImage, setPreviewImage] = useState(null)

  // Password change state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)

  // Wait for app context to finish hydrating before making auth decisions
  useEffect(() => {
    if (loading) return

    // If not logged in as admin, redirect to login
    if (!userData || userData.role !== 'admin') {
      navigate('/login')
      return
    }

    // Use context userData when available, otherwise fall back to env-provided values or defaults
    const fallback = {
      name: import.meta.env.VITE_ADMIN_NAME || 'Site Admin',
      email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@lawaid.local',
      phone: import.meta.env.VITE_ADMIN_PHONE || '',
      userName: import.meta.env.VITE_ADMIN_USERNAME || 'admin'
    }

    setProfile(userData || fallback)
    if (userData?.profilePic?.path) setPreviewImage(`${backendUrl}/${userData.profilePic.path}`)
    setFetching(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userData, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setProfile(prev => ({ ...prev, profilePicFile: file }))
    setPreviewImage(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!profile.name || !profile.email) return toast.error('Name and email are required')
    // Local-only save: update app context and local state, do not call backend
    setSaving(true)
    try {
      const merged = { ...profile, role: 'admin', _id: userData?._id || profile._id }
      setProfile(merged)
      setUserData(merged)
      if (merged.profilePic?.path) setPreviewImage(`${backendUrl}/${merged.profilePic.path}?t=${Date.now()}`)
      toast.success('Profile updated (local only)')
    } catch (err) {
      console.error('Local save failed', err)
      toast.error('Failed to save locally')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) return toast.error('Fill all fields')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    // Local-only password change: validate locally and show success (no backend call)
    setChangingPwd(true)
    try {
      // In a real app you'd call backend; here we accept the change locally
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed (local only)')
    } catch (err) {
      console.error('Local change password failed', err)
      toast.error('Failed to change password locally')
    } finally {
      setChangingPwd(false)
    }
  }

  if (fetching) {
    return (
      <div className='min-h-screen bg-creamcolor flex flex-col'>
        <Navbar />
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-brownBG mx-auto mb-4'></div>
            <p className='text-browntextcolor'>Loading admin profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-creamcolor font-inria'>
      <Navbar />

      <div className="relative text-creamcolor">
        <div className='bg-gradient-to-r from-brownBG to-brown2 text-white py-14 md:py-20 lg:py-24 relative overflow-hidden'>
          <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20'></div>
          <div className='absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16'></div>

          <div className='max-w-6xl mx-auto px-6 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold mb-2 font-inria'>Admin Profile</h1>
            <p className='text-md md:text-lg text-brown mt-2'>Manage your account and settings</p>
          </div>
        </div>
      </div>

      <div className='max-w-6xl mx-auto px-6 py-10'>
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-2xl shadow p-6 text-center sticky top-6'>
              <div className='mb-4'>
                {previewImage ? (
                  <img src={previewImage} alt='avatar' className='w-28 h-28 rounded-2xl object-cover mx-auto border-4 border-brownBG' />
                ) : (
                  <div className='w-28 h-28 rounded-2xl bg-AboutBackgroudColor flex items-center justify-center mx-auto border-4 border-brownBG'>
                    <span className='text-brownBG font-semibold text-2xl'>{(profile.userName || profile.name || 'A').charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <h2 className='text-xl font-bold text-brownBG'>{profile.name || profile.userName || 'Admin'}</h2>
              <p className='text-sm text-browntextcolor break-words'>{profile.email}</p>

              <div className='mt-6 space-y-3'>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className='w-full bg-browntextcolor hover:bg-brownforhover text-creamcolor font-semibold px-3 py-2 rounded-lg transition'>Edit Profile</button>
                ) : (
                  <label className='w-full block'>
                    <input type='file' accept='image/*' onChange={handleImageChange} className='hidden' id='admin-photo-input' />
                    <div onClick={() => document.getElementById('admin-photo-input')?.click()} className='cursor-pointer bg-brownBG text-creamcolor px-4 py-2 rounded-lg'>Change Photo</div>
                  </label>
                )}

                <button onClick={() => setShowChangePassword(true)} className='w-full bg-AboutBackgroudColor py-3 rounded-lg border border-brown2'>Change Password</button>
                <button onClick={() => { logout(); navigate('/') }} className='w-full  bg-browntextcolor hover:bg-brownforhover text-white py-3 rounded-lg'>Logout</button>
              </div>
            </div>
          </div>

          <div className='lg:col-span-3'>
            <div className='bg-white rounded-2xl shadow p-6'>
              <h3 className='text-2xl font-bold text-brownBG mb-4'>Account Information</h3>

              <div className='grid md:grid-cols-2 gap-6'>
                <div>
                  <label className='text-sm font-semibold text-brownBG'>Name</label>
                  <input name='name' value={profile.name || ''} onChange={handleChange} disabled={!isEditing} className='w-full px-4 py-3 border rounded-lg mt-2 disabled:bg-AboutBackgroudColor' />
                </div>

                <div>
                  <label className='text-sm font-semibold text-brownBG'>Email (read-only)</label>
                  <input name='email' value={profile.email || ''} disabled className='w-full px-4 py-3 border rounded-lg mt-2 bg-AboutBackgroudColor' />
                </div>
              </div>

              <div className='mt-6'>
                <label className='text-sm font-semibold text-brownBG'>Phone</label>
                <input name='phone' value={profile.phone || ''} onChange={handleChange} className='w-full px-4 py-3 border rounded-lg mt-2' />
              </div>

              {isEditing && (
                <div className='mt-8 flex gap-4'>
                  <button onClick={async () => { await handleSave(); setIsEditing(false) }} disabled={saving} className='bg-browntextcolor hover:bg-brownforhover text-creamcolor font-semibold px-6 py-3 rounded-lg disabled:opacity-50'>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button onClick={() => { setProfile(userData || {}); if (userData?.profilePic?.path) setPreviewImage(`${backendUrl}/${userData.profilePic.path}`); setIsEditing(false) }} className='bg-AboutBackgroudColor px-6 py-3 rounded-lg'>Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showChangePassword && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h4 className='text-xl font-bold mb-4'>Change Password</h4>
            <div className='space-y-3'>
              <input type='password' placeholder='Current password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className='w-full px-4 py-3 border rounded-lg' />
              <input type='password' placeholder='New password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='w-full px-4 py-3 border rounded-lg' />
              <input type='password' placeholder='Confirm new password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='w-full px-4 py-3 border rounded-lg' />
            </div>

            <div className='mt-4 flex gap-3'>
              <button disabled={changingPwd} onClick={handleChangePassword} className='bg-brownBG text-creamcolor px-4 py-2 rounded-lg'>
                {changingPwd ? 'Changing...' : 'Change Password'}
              </button>
              <button disabled={changingPwd} onClick={() => setShowChangePassword(false)} className='bg-AboutBackgroudColor px-4 py-2 rounded-lg'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default AdminProfile
