// ...existing code...
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadChatAttachments } from "../middleware/uploads.js";
import {
  getOrCreateConversation,
  getMessages,
  uploadAttachments,
  createMessageViaHttp
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/conversation", requireAuth, getOrCreateConversation); // query: type, appointmentId|consultationId|otherUserId|lawyerId
router.get("/conversation/:conversationId/messages", requireAuth, getMessages);

// ensure auth runs BEFORE multer so req.user is available in filename logic
router.post("/attachments", requireAuth, uploadChatAttachments.array("attachments", 5), uploadAttachments);

// create a message via HTTP (will persist + emit to sockets)
router.post("/message", requireAuth, createMessageViaHttp);

export default router;