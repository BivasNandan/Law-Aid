import express from "express";
import {
  assigningRole,
  register,
  setClientAdditionalInfo,
  setLawyerAdditionalInfo,
  login,
  logout,
  getAllLawyers,
  getAllClients,
  getLawyer,
  getClient,
  filterLawyers,
  getClientById,
  editProfile,
  deleteAccount,
  changePassword,
  getLawyerById,
  getMe
} from "../controllers/auth.controller.js";
import { uploadProfilePic, uploadBothFiles } from "../middleware/uploads.js";
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Request logging middleware for debugging
router.use((req, res, next) => {
  if (req.path.includes('set-client-additional-info') || req.path.includes('set-lawyer-additional-info')) {
    console.log(`\n🔵 ${req.method} ${req.path}`);
    console.log('   Cookies:', Object.keys(req.cookies || {}));
    console.log('   Headers Content-Type:', req.headers['content-type']);
  }
  next();
});

// Registration and login routes
router.post("/assigningRole", assigningRole);
router.post("/register", register);

// FIX: Both endpoints now use uploadBothFiles to handle both profilePic and resume
// For clients: only profilePic is used
// For lawyers: both profilePic and resume are used

// ✅ Middleware to catch Multer errors on client profile endpoint
const clientProfileMiddleware = (req, res, next) => {
  uploadProfilePic.single("profilePic")(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error on set-client-additional-info:', err.message);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
};

router.patch(
  "/set-client-additional-info",
  clientProfileMiddleware,
  setClientAdditionalInfo
);

// ✅ Middleware to catch Multer errors on lawyer profile endpoint
const lawyerProfileMiddleware = (req, res, next) => {
  uploadBothFiles.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error on set-lawyer-additional-info:', err.message);
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
};

router.patch(
  "/set-lawyer-additional-info",
  lawyerProfileMiddleware,
  setLawyerAdditionalInfo
);

router.post("/login", login);
router.post("/logout", logout);

// Get all users by role
router.get('/lawyers', getAllLawyers);
router.get('/clients', getAllClients);

// Get specific user by username
router.get('/lawyer/:userName', getLawyer);
router.get('/client/:userName', getClient);

// Get specific user by ID
router.get('/lawyer-by-id/:id', getLawyerById);
router.get('/client-by-id/:id', getClientById);

// Filter routes
router.get('/filter-lawyers', filterLawyers);

// Profile management
// Use uploadProfilePic.single to accept optional profilePic file during profile edit
router.put('/edit-profile', uploadProfilePic.single('profilePic'), editProfile);
router.delete('/delete-account', deleteAccount);
router.post('/change-password', changePassword);

// Get authenticated user's profile
router.get('/me', requireAuth, getMe);

export default router;