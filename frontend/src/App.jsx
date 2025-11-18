import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './lib/ProtectedRoute'
import { Appcontext } from './lib/Appcontext'

// Common pages
import Role from './common/Role'
import Signup from './common/SignUp'
import Profile from './client/client_pages/Profile'
import Login from './common/Login'
import AppointmentChat from './common/AppointmentChat'
import FileViewer from './common/FileViewer'
import NotificationsPage from './common/NotificationsPage'

// Client-specific pages
import Landpage_client from './client/client_pages/Landpage_clients'
import ViewLaw from './client/client_pages/ViewLaw'
import LawDetails from './client/client_pages/LawDetails'
import FindLawyer from './client/client_pages/Find_lawyer'
import Consultation_chat from './client/client_pages/Consultation_chat'
import Book_appointment from './client/client_pages/Book_appointment'
import ClientDetails from './client/client_pages/clientDetails'
import LawyerProfile from './client/client_pages/LawyerProfile'
import MyAppointment from './client/client_pages/MyAppointment'
import FeedbackPage from './client/client_pages/FeedbackPage'
// RequestLegalHelp removed — handled via Services card which opens conversation directly

// Lawyer-specific pages
import LawyerDetails from './Lawyer/lawyer_pages/lawyerDetails'
import ManageAppointment from './Lawyer/lawyer_pages/manageAppointment'
import ViewManageLaw from './Lawyer/lawyer_pages/viewManageLaw'
import LawForm from './Lawyer/lawyer_pages/LawForm'
import Schedule from './Lawyer/lawyer_pages/Schedule'

import Feedback from './Lawyer/lawyer_pages/viewFeedback'

// admin-specific pages

import LegalAdviseByExpert from './admin/adminpage/legalAdviseByExpert'
import ConsultationChat from './admin/adminpage/ConsultationChat'
import AdminProfile from './admin/adminpage/adminProfile'


function App() {
  const { loading } = useContext(Appcontext)

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-brownBG via-brown to-brownforhover'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4'></div>
          <p className='text-white font-medium'>Initializing...</p>
        </div>
      </div>
    )
  }
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        {/* Home / Landing */}
        <Route path="/" element={<Landpage_client />} />

        {/* Auth Routes */}
        <Route path="/role" element={<Role />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* ========== PROTECTED CLIENT ROUTES ========== */}
        <Route path="/client-details" element={<ProtectedRoute element={<ClientDetails />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} allowedRoles={['client', 'lawyer']} fallbackPath="/login" />} />
        <Route path="/appointment-chat/:appointmentId" element={<ProtectedRoute element={<AppointmentChat />} allowedRoles={['client', 'lawyer']} fallbackPath="/login" />} />
        <Route path="/file-viewer" element={<ProtectedRoute element={<FileViewer />} allowedRoles={['client', 'lawyer', 'admin']} fallbackPath="/login" />} />
        <Route path="/notifications" element={<ProtectedRoute element={<NotificationsPage />} allowedRoles={['client', 'lawyer']} fallbackPath="/login" />} />
        <Route path="/viewLaw" element={<ProtectedRoute element={<ViewLaw />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/law/:id" element={<ProtectedRoute element={<LawDetails />} allowedRoles={["client", "lawyer", "admin"]} fallbackPath="/login" />} />
        <Route path="/find-lawyer" element={<ProtectedRoute element={<FindLawyer />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/lawyer/:userName" element={<ProtectedRoute element={<LawyerProfile />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/consultation-chat" element={<ProtectedRoute element={<Consultation_chat />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/book-appointment/:id" element={<ProtectedRoute element={<Book_appointment />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/law-details" element={<ProtectedRoute element={<LawDetails />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/my-appointments" element={<ProtectedRoute element={<MyAppointment />} allowedRoles="client" fallbackPath="/login" />} />
        <Route path="/feedback/:lawyerId/:appointmentId" element={<ProtectedRoute element={<FeedbackPage />} allowedRoles="client" fallbackPath="/login" />} />
        {/* RequestLegalHelp route removed — Services card opens admin conversation directly */}

        {/* ========== PROTECTED LAWYER ROUTES ========== */}
        <Route path="/lawyer-details" element={<ProtectedRoute element={<LawyerDetails />} allowedRoles="lawyer" fallbackPath="/login" />} />
        <Route path="/manage-appointments" element={<ProtectedRoute element={<ManageAppointment />} allowedRoles="lawyer" fallbackPath="/login" />} />
        <Route path="/view-manage-law" element={<ProtectedRoute element={<ViewManageLaw />} allowedRoles={["lawyer","admin"]} fallbackPath="/login" />} />
        <Route path="/law-form" element={<ProtectedRoute element={<LawForm />} allowedRoles={["lawyer","admin"]} fallbackPath="/login" />} />
        <Route path="/law-form/:id" element={<ProtectedRoute element={<LawForm />} allowedRoles={["lawyer","admin"]} fallbackPath="/login" />} />
        <Route path="/schedule" element={<ProtectedRoute element={<Schedule />} allowedRoles="lawyer" fallbackPath="/login" />} />
       
        <Route path="/view-feedback/:lawyerId" element={<ProtectedRoute element={<Feedback />} allowedRoles="lawyer" fallbackPath="/login" />} />

        {/* ========== PROTECTED ADMIN ROUTES ========== */}
        <Route path="/admin" element={<ProtectedRoute element={<Navigate to="/admin/manage-users" replace />} allowedRoles="admin" fallbackPath="/" />} />
        <Route path="/admin/legal-advise" element={<ProtectedRoute element={<LegalAdviseByExpert />} allowedRoles="admin" fallbackPath="/" />} />
        <Route path="/admin/profile" element={<ProtectedRoute element={<AdminProfile />} allowedRoles="admin" fallbackPath="/" />} />
        <Route path="/admin/consultation-chat/:conversationId" element={<ProtectedRoute element={<ConsultationChat />} allowedRoles="admin" fallbackPath="/" />} />

        {/* 404 - Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App