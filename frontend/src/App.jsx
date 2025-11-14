import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Common pages
import Role from './common/Role'
import Signup from './common/SignUp'
import Profile from './client/client_pages/Profile'
import Login from './common/Login'
import AppointmentChat from './common/AppointmentChat'
import FileViewer from './common/FileViewer'

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

// Lawyer-specific pages
import LawyerDetails from './Lawyer/lawyer_pages/lawyerDetails'
import ManageAppointment from './Lawyer/lawyer_pages/manageAppointment'
import ViewManageLaw from './Lawyer/lawyer_pages/viewManageLaw'
import LawForm from './Lawyer/lawyer_pages/LawForm'
import Schedule from './Lawyer/lawyer_pages/Schedule'
import GiveConsultation from './Lawyer/lawyer_pages/giveConsultation'
import Feedback from './Lawyer/lawyer_pages/viewFeedback'



function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<Landpage_client />} />
        
    


        {/* Auth / Signup */}
        <Route path="/role" element={<Role />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/client-details" element={<ClientDetails />} />
        
        

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/appointment-chat/:appointmentId" element={<AppointmentChat />} />
        <Route path="/file-viewer" element={<FileViewer />} />

        {/* Client-specific pages */}
        <Route path="/viewLaw" element={<ViewLaw />} />
        <Route path="/law/:id" element={<LawDetails />} />
        <Route path="/find-lawyer" element={<FindLawyer />} />
        <Route path="/lawyer/:userName" element={<LawyerProfile />} />
        <Route path="/consultation-chat" element={<Consultation_chat />} />
        <Route path="/book-appointment/:id" element={<Book_appointment />} />
        <Route path="/law-details" element={<LawDetails />} />
        <Route path="/my-appointments" element={<MyAppointment />} />
  <Route path="/feedback/:lawyerId/:appointmentId" element={<FeedbackPage />} />

        {/* lawyer-specific pages */}
        <Route path="/lawyer-details" element={<LawyerDetails />} />
        <Route path="/manage-appointments" element={<ManageAppointment />} />
        <Route path="/view-manage-law" element={<ViewManageLaw />} />
        {/* Add both routes for LawForm - with and without ID parameter */}
        <Route path="/law-form" element={<LawForm />} />
        <Route path="/law-form/:id" element={<LawForm />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/give-consultation" element={<GiveConsultation />} /> 
        <Route path="/view-feedback/:lawyerId" element={<Feedback />} />
        
      </Routes>
    </>
  )
}

export default App