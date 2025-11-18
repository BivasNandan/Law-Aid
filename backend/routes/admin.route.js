import express from 'express';
import requireAdmin from '../middleware/adminMiddleware.js';
import { getAdminProfile, createOrUpdateAdminProfile, changeAdminPassword, getLegalAdviseRequests, startAdminClientConversation, getPublicAdminProfile } from '../controllers/admin.controller.js';
import { uploadProfilePic } from '../middleware/uploads.js';

const router = express.Router();

// Example admin-only endpoint(s)
router.get('/dashboard', requireAdmin, (req, res) => {
  return res.status(200).json({ message: 'Admin dashboard access granted' });
});

// Admin profile endpoints
router.get('/profile', requireAdmin, getAdminProfile);
router.get('/public-profile', getPublicAdminProfile);
router.put('/profile', requireAdmin, uploadProfilePic.single('profilePic'), createOrUpdateAdminProfile);
router.post('/change-password', requireAdmin, changeAdminPassword);

// Admin legal-advise endpoints
router.get('/legal-advise', requireAdmin, getLegalAdviseRequests);
router.post('/start-conversation', requireAdmin, startAdminClientConversation);

// add other admin routes here, e.g., user management, stats, etc.

export default router;
