// ...existing code...
import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { uploadChatAttachments } from "../middleware/uploads.js";
import {
  getOrCreateConversation,
  getMessages,
  getMyConversations,
  uploadAttachments,
  createMessageViaHttp,
  editMessage,
  downloadAttachment
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/conversation", requireAuth, getOrCreateConversation); // query: type, appointmentId|consultationId|otherUserId|lawyerId
router.get("/conversations", requireAuth, getMyConversations); // list conversations for the authenticated user; optional query ?type=consultation
router.get("/conversation/:conversationId/messages", requireAuth, getMessages);

// ensure auth runs BEFORE multer so req.user is available in filename logic
router.post("/attachments", requireAuth, uploadChatAttachments.array("attachments", 5), uploadAttachments);

// create a message via HTTP (will persist + emit to sockets)
router.post("/message", requireAuth, createMessageViaHttp);

// edit a message
router.patch("/message/:messageId", requireAuth, editMessage);

// download attachment with proper headers
router.get("/download/:filename", requireAuth, downloadAttachment);

export default router;