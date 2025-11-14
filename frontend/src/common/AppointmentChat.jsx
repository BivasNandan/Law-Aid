import React, { useEffect, useState, useContext, useRef } from 'react'
import axios from '../lib/axiosConfig'
import { Appcontext } from '../lib/Appcontext'
import Navbar from './Navbar'
import Footer from './Footer'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { io } from 'socket.io-client'
import RescheduleModal from '../Lawyer/lawyer_components/RescheduleModal'

const AppointmentChat = () => {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const { backendUrl, userData } = useContext(Appcontext)
  const [appointment, setAppointment] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [otherPerson, setOtherPerson] = useState(null)
  const [rescheduleModal, setRescheduleModal] = useState({ open: false, appointment: null })
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const fileInputRef = useRef(null)

  // Fetch appointment and conversation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const appRes = await axios.get(`/api/appointment/user/${userData._id}`, { withCredentials: true })
        const apt = appRes.data.appointments.find(a => a._id === appointmentId)
        if (!apt) {
          toast.error('Appointment not found')
          navigate('/my-appointments')
          return
        }
        setAppointment(apt)

        // Determine otherPerson based on user role
        // If current user is client, otherPerson is lawyer; if lawyer, otherPerson is client
        const otherPersonData = userData.role === 'client' ? apt.lawyer : apt.client
        setOtherPerson(otherPersonData)

        const convRes = await axios.post(
          `/api/chat/conversation?type=appointment&appointmentId=${appointmentId}`,
          {},
          { withCredentials: true }
        )
        setConversation(convRes.data)

        const msgRes = await axios.get(
          `/api/chat/conversation/${convRes.data._id}/messages`,
          { withCredentials: true }
        )
        setMessages((msgRes.data || []).reverse())
      } catch (err) {
        console.error('Error fetching data:', err)
        toast.error('Failed to load chat')
      } finally {
        setLoading(false)
      }
    }

    if (userData && appointmentId) {
      fetchData()
    }
  }, [userData, appointmentId, navigate])

  // Setup socket listener for new messages
  useEffect(() => {
    if (!conversation) return

    try {
      socketRef.current = io(backendUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
      })

      socketRef.current.on('connect', () => {
        socketRef.current.emit('joinConversation', { conversationId: conversation._id })
      })

      socketRef.current.on('message', (msg) => {
        setMessages(prev => [...prev, msg])
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })

      socketRef.current.on('newMessage', ({ message }) => {
        setMessages(prev => [...prev, message])
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      })

      socketRef.current.on('messageEdited', (editedMsg) => {
        setMessages(prev => prev.map(m => m._id === editedMsg._id ? editedMsg : m))
      })
    } catch (err) {
      console.warn('Socket connection failed:', err)
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveConversation', { conversationId: conversation._id })
        socketRef.current.disconnect()
      }
    }
  }, [conversation, backendUrl])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!newText.trim() || !conversation) return

    try {
      setSending(true)
      await axios.post(
        '/api/chat/message',
        { conversationId: conversation._id, text: newText.trim() },
        { withCredentials: true }
      )
      setNewText('')
      setSelectedFiles([])
    } catch (err) {
      console.error('Error sending message:', err)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  // Handle file upload
  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0 || !conversation) return

    try {
      setUploading(true)
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('attachments', file)
      })

      const uploadRes = await axios.post('/api/chat/attachments', formData, {
        withCredentials: true
      })

      await axios.post(
        '/api/chat/message',
        {
          conversationId: conversation._id,
          text: newText.trim() || `Sent ${selectedFiles.length} file(s)`,
          attachments: uploadRes.data.attachments
        },
        { withCredentials: true }
      )

      setNewText('')
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast.success('Files sent successfully!')
    } catch (err) {
      console.error('Error uploading files:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || 'Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  // Handle edit message
  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) return

    try {
      await axios.patch(
        `/api/chat/message/${messageId}`,
        { text: editText.trim() },
        { withCredentials: true }
      )
      setEditingId(null)
      setEditText('')
      toast.success('Message edited!')
    } catch (err) {
      console.error('Error editing message:', err)
      toast.error('Failed to edit message')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file download
  const handleDownloadFile = async (file) => {
    try {
      const filename = file.path.split('/').pop()
      const response = await axios.get(
        `/api/chat/download/${filename}`,
        {
          responseType: 'blob',
          withCredentials: true
        }
      )
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.originalName)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch (err) {
      console.error('Error downloading file:', err)
      toast.error('Failed to download file')
    }
  }

  // Handle view file in new page
  const handleViewFile = (file) => {
    const params = new URLSearchParams({
      path: file.path,
      name: file.originalName,
      mime: file.mimetype,
      size: file.size
    })
    navigate(`/file-viewer?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brownBG flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brownBG via-brown to-brownforhover flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 mt-8 md:mt-12">
        {/* Elegant Chat Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl p-4 md:p-6 border-b border-brown/10 relative z-0">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={() => {
                  const backRoute = userData?.role === 'lawyer' ? '/manage-appointments' : '/my-appointments'
                  navigate(backRoute)
                }}
                className="p-2 hover:bg-brownforhover rounded-xl transition-all duration-200 group"
                title="Back to appointments"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-brownBG group-hover:text-brown transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                {otherPerson?.profilePic ? (
                  <div className="relative">
                    <img
                      src={
                        otherPerson.profilePic.path
                          ? `${backendUrl}/${otherPerson.profilePic.path}`
                          : `${backendUrl}/uploads/profilePics/${otherPerson.profilePic.filename}`
                      }
                      alt={otherPerson?.userName}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border-3 border-brown shadow-lg"
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-brown to-brownforhover border-3 border-white flex items-center justify-center shadow-lg">
                      <span className="text-lg md:text-xl font-bold text-white">{otherPerson?.userName?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                )}
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-brownBG">{otherPerson?.userName}</h2>
                  <p className="text-xs md:text-sm text-browntextcolor flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    {new Date(appointment?.dateTime).toLocaleDateString()} at {new Date(appointment?.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
            {/* Right-side actions (Reschedule for lawyers) */}
            <div className="flex items-center gap-2">
              {userData?.role === 'lawyer' && appointment?.status === 'confirmed' && (
                <button
                  onClick={() => setRescheduleModal({ open: true, appointment })}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Reschedule
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modern Chat Container */}
        <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden" style={{ minHeight: '60vh', maxHeight: '70vh' }}>
          {/* Messages Area with Gradient Background */}
          <div 
            className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto"
            style={{ 
              backgroundImage: 'linear-gradient(to bottom, #f5f5dc 0%, #faf8f3 50%, #f5f5dc 100%)',
              backgroundSize: '100% 200%',
              animation: 'gradient 15s ease infinite'
            }}
  >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-12">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-brown to-brownforhover rounded-full flex items-center justify-center shadow-xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <p className="text-xl font-semibold text-brownBG mb-2">Start Your Conversation</p>
                <p className="text-sm text-browntextcolor text-center max-w-md">Begin by sending a message to discuss your appointment details</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg._id}
                  className={`flex ${msg.sender._id === userData._id ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className="flex gap-2 md:gap-3 max-w-[85%] md:max-w-[75%]">
                    {msg.sender._id !== userData._id && (
                      (msg.sender?.profilePic || otherPerson?.profilePic) ? (
                        <img
                          src={
                            (msg.sender?.profilePic?.path || otherPerson?.profilePic?.path)
                              ? `${backendUrl}/${msg.sender?.profilePic?.path || otherPerson?.profilePic?.path}`
                              : `${backendUrl}/uploads/profilePics/${msg.sender?.profilePic?.filename || otherPerson?.profilePic?.filename}`
                          }
                          alt={msg.sender.userName}
                          className="flex-shrink-0 w-8 h-8 rounded-full object-cover border-2 border-brown shadow-md"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brown to-brownforhover flex items-center justify-center text-sm font-semibold text-white shadow-md">
                          {msg.sender.userName?.[0]?.toUpperCase()}
                        </div>
                      )
                    )}
                    
                    <div className={`flex flex-col ${msg.sender._id === userData._id ? 'items-end' : 'items-start'}`}>
                      {msg.sender._id !== userData._id && (
                        <span className="text-xs text-browntextcolor mb-1 ml-1 font-medium">
                          {msg.sender.userName}
                        </span>
                      )}
                      
                      <div className={`relative group ${msg.sender._id === userData._id ? 'message-sent' : 'message-received'}`}>
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${
                            msg.sender._id === userData._id
                              ? 'bg-browntextcolor text-white rounded-br-sm'
                              : 'bg-white text-brownBG rounded-bl-sm border border-brown/10'
                          }`}
                        >
                          {editingId === msg._id ? (
                            <div className="space-y-2 min-w-64">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2 bg-white border border-brown rounded-lg text-brownBG text-sm resize-none focus:ring-2 focus:ring-brown/50 focus:outline-none"
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingId(null)
                                    setEditText('')
                                  }}
                                  className="px-3 py-1.5 text-xs bg-gray-100 text-brownBG rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleEditMessage(msg._id)}
                                  className="px-3 py-1.5 text-xs bg-gradient-to-r from-brownBG to-brownforhover text-white rounded-lg hover:shadow-lg transition-all"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {msg.attachments.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md ${
                                        msg.sender._id === userData._id 
                                          ? 'bg-white/20 backdrop-blur-sm' 
                                          : 'bg-creamcolor border border-brown/10'
                                      }`}
                                    >
                                      <div className="flex-shrink-0 w-10 h-10 bg-brown/20 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📎</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.originalName}</p>
                                        <p className="text-xs opacity-70">{(file.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleViewFile(file)}
                                          className="p-2 hover:bg-brown/10 rounded-lg transition-colors"
                                          title="View"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => handleDownloadFile(file)}
                                          className="p-2 hover:bg-brown/10 rounded-lg transition-colors"
                                          title="Download"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div className={`flex items-center gap-2 mt-2 text-xs ${
                                msg.sender._id === userData._id ? 'text-white/80' : 'text-browntextcolor'
                              }`}>
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                {msg.edited && <span className="italic">(edited)</span>}
                                {msg.sender._id === userData._id && (
                                  <button
                                    onClick={() => {
                                      setEditingId(msg._id)
                                      setEditText(msg.text)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:scale-110 transition-all p-1"
                                    title="Edit"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {msg.sender._id === userData._id && (
                      userData?.profilePic ? (
                        <img
                          src={
                            userData.profilePic.path
                              ? `${backendUrl}/${userData.profilePic.path}`
                              : `${backendUrl}/uploads/profilePics/${userData.profilePic.filename}`
                          }
                          alt={msg.sender.userName}
                          className="flex-shrink-0 w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-brown to-brownforhover flex items-center justify-center text-sm font-semibold text-white shadow-md">
                          {msg.sender.userName?.[0]?.toUpperCase()}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Elegant Input Section */}
          <div className="bg-gradient-to-r from-white to-creamcolor border-t border-brown/10 p-4 md:p-5">
            {selectedFiles.length > 0 && (
              <div className="mb-3 p-3 bg-white rounded-xl border border-brown/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-brownBG flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-creamcolor rounded-lg hover:bg-AboutBackgroudColor transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-brown">📄</span>
                        <span className="truncate text-sm text-brownBG font-medium">{file.name}</span>
                        <span className="text-xs text-browntextcolor flex-shrink-0">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 p-3 md:p-3.5 bg-white hover:bg-creamcolor text-brown rounded-xl border border-brown/20 hover:border-brown/40 hover:shadow-md transition-all duration-200 group"
                title="Attach files"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  rows={2}
                  maxLength={1000}
                  className="w-full p-3 md:p-4 pr-16 bg-white border border-brown/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-brown/40 focus:border-transparent resize-none text-brownBG placeholder-browntextcolor/50 shadow-sm transition-all duration-200"
                />
                <div className="absolute bottom-2 right-2 text-xs text-browntextcolor bg-white/80 px-2 py-1 rounded-lg">
                  {newText.length}/1000
                </div>
              </div>
              
              <button
                onClick={selectedFiles.length > 0 ? handleUploadFiles : handleSendMessage}
                disabled={sending || uploading || (!newText.trim() && selectedFiles.length === 0)}
                className="flex-shrink-0 px-4 md:px-6 py-3 bg-gradient-to-r from-brownBG to-brownforhover hover:from-brownforhover hover:to-brownBG disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden md:inline">Uploading...</span>
                  </>
                ) : sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden md:inline">Sending...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="hidden md:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              accept="*"
            />
          </div>
        </div>

        {/* Rounded Bottom */}
        <div className="h-4 bg-white/95 backdrop-blur-sm rounded-b-3xl shadow-2xl"></div>
      </div>

      <Footer />

      {rescheduleModal.open && (
        <RescheduleModal
          appointment={rescheduleModal.appointment || appointment}
          backendUrl={backendUrl}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onSuccess={(updated) => {
            setAppointment(updated)
            setRescheduleModal({ open: false, appointment: null })
            toast.success('Reschedule proposal sent')
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 0%; }
          50% { background-position: 0% 100%; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .message-sent:hover {
          transform: translateX(-2px);
        }
        
        .message-received:hover {
          transform: translateX(2px);
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(139, 69, 19, 0.05);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(139, 69, 19, 0.3);
          border-radius: 10px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 69, 19, 0.5);
        }
      `}</style>
    </div>
  )
}

export default AppointmentChat