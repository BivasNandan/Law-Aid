import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Common pages
import Role from './common/Role'
import Signup from './common/SignUp'
import Profile from './client/client_pages/Profile'
import Login from './common/Login'

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

// Lawyer-specific pages
import LawyerDetails from './Lawyer/lawyer_pages/lawyerDetails'
import ManageAppointment from './Lawyer/lawyer_pages/manageAppointment'
import ViewManageLaw from './Lawyer/lawyer_pages/viewManageLaw'
import LawForm from './Lawyer/lawyer_pages/LawForm'
import Schedule from './Lawyer/lawyer_pages/Schedule'




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

        {/* Client-specific pages */}
        <Route path="/viewLaw" element={<ViewLaw />} />
        <Route path="/law/:id" element={<LawDetails />} />
        <Route path="/find-lawyer" element={<FindLawyer />} />
        <Route path="/lawyer/:userName" element={<LawyerProfile />} />
        <Route path="/consultation-chat" element={<Consultation_chat />} />
        <Route path="/book-appointment/:id" element={<Book_appointment />} />
        <Route path="/law-details" element={<LawDetails />} />
        <Route path="/my-appointments" element={<MyAppointment />} />

        {/* lawyer-specific pages */}
        <Route path="/lawyer-details" element={<LawyerDetails />} />
        <Route path="/manage-appointments" element={<ManageAppointment />} />
        <Route path="/view-manage-law" element={<ViewManageLaw />} />
        <Route path="/law-form/" element={<LawForm />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </>
  )
}

export default App