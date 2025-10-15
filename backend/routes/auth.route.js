import express from 'express'
import {
  assigningRole,
  register,
  login,
  logout,
  setClientAdditionalInfo,
  setLawyerAdditionalInfo,
  getAllLawyers,
  getAllClients,
  getLawyer,
  getClient,
  filterLawyers,
  getClientById,
  getLawyerById,
  editProfile,
  deleteAccount
} from '../controllers/auth.controller.js'

const router = express.Router()

// ==============================
// Authentication routes
// ==============================
router.post('/assign-role', assigningRole)           // Assign role to user
router.post('/register', register)                  // Register user
router.post('/login', login)                        // Login
router.post('/logout', logout)                      // Logout

// ==============================
// Additional info routes
// ==============================
router.post('/client-details', setClientAdditionalInfo)
router.post('/lawyer-details', setLawyerAdditionalInfo)

// ==============================
// Get all users by role
// ==============================
router.get('/lawyers', getAllLawyers)
router.get('/clients', getAllClients)

// ==============================
// Get specific user by username
// ==============================
router.get('/lawyer/:userName', getLawyer)
router.get('/client/:userName', getClient)

// ==============================
// Get specific user by ID
// ==============================
router.get('/lawyer-by-id/:id', getLawyerById)
router.get('/client-by-id/:id', getClientById)

// ==============================
// Filter routes
// ==============================
router.get('/filter-lawyers', filterLawyers)

// ==============================
// Profile management
// ==============================
router.put('/edit-profile', editProfile)
router.delete('/delete-account', deleteAccount)

export default router
