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
  getLawyerById
} from "../controllers/auth.controller.js";
import { uploadProfilePic, uploadBothFiles } from "../middleware/uploads.js";

const router = express.Router();

// Registration and login routes
router.post("/assigningRole", assigningRole);
router.post("/register", register);

// FIX: Both endpoints now use uploadBothFiles to handle both profilePic and resume
// For clients: only profilePic is used
// For lawyers: both profilePic and resume are used
router.patch(
  "/set-client-additional-info",
  uploadProfilePic.single("profilePic"),
  setClientAdditionalInfo
);

router.patch("/set-lawyer-additional-info",
  uploadBothFiles.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]),
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

export default router;