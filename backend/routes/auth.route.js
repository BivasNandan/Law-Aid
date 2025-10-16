import express from "express";
import { assigningRole, register, setClientAdditionalInfo, setLawyerAdditionalInfo, login, logout, getAllLawyers, getAllClients, getLawyer, getClient, filterLawyers, getClientById, editProfile, deleteAccount, getLawyerById } from "../controllers/auth.controller.js";
import { uploadProfilePic, uploadLawyerResume, uploadBothFiles } from "../middleware/uploads.js";

const router = express.Router()

//starting of registration and login routes
router.post("/assigningRole", assigningRole);
router.post("/register", register);

router.patch("/set-lawyer-additional-info", uploadProfilePic.single("profilePic"), setLawyerAdditionalInfo);
router.patch("/set-client-additional-info",
    uploadBothFiles.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]),setClientAdditionalInfo);

router.post("/login", login);
router.post("/logout", logout);
//end of registration and login routes

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
