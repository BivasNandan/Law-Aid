import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Common pages
import Role from './common/Role'
import Signup from './common/SignUp'
import Profile from './client/client_pages/Profile'

// Client-specific pages
import Landpage_client from './client/client_pages/Landpage_clients'
import View_law from './client/client_pages/View_law'
import Find_lawyer from './client/client_pages/Find_lawyer'
import Consultation_chat from './client/client_pages/Consultation_chat'
import Book_appointment from './client/client_pages/Book_appointment'
import clientDetails from './client/client_pages/clientDetails'

// Lawyer-specific pages 
import lawyerDetails from './Lawyer/lawyer_pages/lawyerDetails'

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<Landpage_client />} />

        {/* Auth / Signup */}
        <Route path="/role" element={<Role />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/clientDetails" element={<clientDetails />} />
        <Route path="/lawyerDetails" element={<lawyerDetails />} />


        {/* Profile */}
        <Route path="/profile" element={<Profile />} />

        {/* Client-specific pages */}
        <Route path="/view-law" element={<View_law />} />
        <Route path="/find-lawyer" element={<Find_lawyer />} />
        <Route path="/consultation-chat" element={<Consultation_chat />} />
        <Route path="/book-appointment/:id" element={<Book_appointment />} />
      </Routes>
    </>
  )
}

export default App
