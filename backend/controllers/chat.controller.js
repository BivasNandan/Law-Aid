// ...existing code...
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Appointment from "../models/appointment.js";
import Consultation from "../models/consultation.js";
import User from "../models/user.js";
import Admin from "../models/admin.js";
import { getIO } from "../src/socket.js";
import bcrypt from 'bcryptjs';
import fs from "fs";
import path from "path";

const isParticipantForConversation = async (userId, conv, userRole) => {
  if (!conv) return false;
  
  // Admins can access any consultation conversation
  if (userRole === 'admin' && conv.type === 'consultation') {
    return true;
  }
  
  if (conv.type === "appointment" && conv.appointmentId) {
    const appt = await Appointment.findById(conv.appointmentId);
    if (!appt) return false;
    return [appt.client.toString(), appt.lawyer.toString()].includes(userId.toString());
  }
  if (conv.type === "consultation" && conv.consultationId) {
    const cons = await Consultation.findById(conv.consultationId);
    if (!cons) return false;
    return [cons.client.toString(), cons.lawyer.toString()].includes(userId.toString());
  }
  return conv.participants.some(p => p.equals(userId));
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const me = req.user?.id;
    if (!me) return res.status(401).json({ message: "Authentication required" });

    const { type } = req.query;
    if (!type) return res.status(400).json({ message: "type required" });

    if (type === "appointment") {
      const { appointmentId } = req.query;
      if (!appointmentId) return res.status(400).json({ message: "appointmentId required" });
      const appt = await Appointment.findById(appointmentId);
      if (!appt) return res.status(404).json({ message: "Appointment not found" });
      if (![appt.client.toString(), appt.lawyer.toString()].includes(me)) return res.status(403).json({ message: "Not part of appointment" });

      let conv = await Conversation.findOne({ type: "appointment", appointmentId });
      if (!conv) {
        conv = new Conversation({ type: "appointment", appointmentId, participants: [appt.client, appt.lawyer] });
        await conv.save();
        appt.conversationId = conv._id;
        await appt.save();
        // emit conversationCreated
        try { const io = getIO(); io.to(`user_${appt.client}`).emit("conversationCreated", conv); io.to(`user_${appt.lawyer}`).emit("conversationCreated", conv); } catch (e) { /* socket not initialized */ }
      }
      return res.status(200).json(conv);
    }

    if (type === "consultation") {
      const { consultationId, lawyerId } = req.query;
      if (consultationId) {
        const cons = await Consultation.findById(consultationId);
        if (!cons) return res.status(404).json({ message: "Consultation not found" });
        if (![cons.client.toString(), cons.lawyer.toString()].includes(me)) return res.status(403).json({ message: "Not part of consultation" });
        let conv = await Conversation.findOne({ type: "consultation", consultationId });
        if (!conv) {
          conv = new Conversation({ type: "consultation", consultationId, participants: [cons.client, cons.lawyer] });
          await conv.save();
          cons.conversationId = conv._id; await cons.save();
          try { const io = getIO(); io.to(`user_${cons.client}`).emit("conversationCreated", conv); io.to(`user_${cons.lawyer}`).emit("conversationCreated", conv); } catch (e) {}
        }
        return res.status(200).json(conv);
      }
      if (lawyerId) {
        let conv = await Conversation.findOne({ type: "consultation", participants: { $all: [me, lawyerId] } });
        if (!conv) {
          conv = new Conversation({ type: "consultation", participants: [me, lawyerId] });
          await conv.save();
        }
        return res.status(200).json(conv);
      }
      return res.status(400).json({ message: "consultationId or lawyerId required" });
    }

    if (type === "direct") {
      const { otherUserId } = req.query;
      if (!otherUserId) return res.status(400).json({ message: "otherUserId required" });
      let conv = await Conversation.findOne({ type: "direct", participants: { $all: [me, otherUserId] } });
      if (!conv) { conv = new Conversation({ type: "direct", participants: [me, otherUserId] }); await conv.save(); }
      return res.status(200).json(conv);
    }

    return res.status(400).json({ message: "invalid type" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// FIXED: Create conversation with admin
export const getOrCreateConversationWithAdmin = async (req, res) => {
  try {
    const me = req.user?.id;
    if (!me) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find admin user by role
    let adminUser = await User.findOne({ role: 'admin' });

    // If not found, create admin user
    if (!adminUser) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        return res.status(500).json({ message: 'Admin configuration missing' });
      }

      const adminProfile = await Admin.findOne({ email: adminEmail });
      const pwd = process.env.ADMIN_PASSWORD || 'Admin@1234';
      
      // Hash password
      const hashedPassword = await bcrypt.hash(pwd, 10);
      
      let userName = 'admin';
      const existingUser = await User.findOne({ userName });
      if (existingUser) {
        userName = `admin_${Date.now()}`;
      }

      adminUser = new User({
        userName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        firstName: 'Site',
        lastName: 'Admin'
      });
      await adminUser.save();
      console.log('✅ Admin user created for conversation');
    }

    if (!adminUser) {
      return res.status(500).json({ message: 'Admin user not available' });
    }

    // Find existing direct conversation between user and admin
    let conv = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [adminUser._id, me] }
    });

    if (!conv) {
      // Create new conversation
      conv = new Conversation({
        type: 'direct',
        participants: [adminUser._id, me]
      });
      await conv.save();
      console.log(`✅ New conversation created: ${conv._id} between user ${me} and admin ${adminUser._id}`);

      // Emit via socket if available
      try {
        const io = getIO();
        io.to(`user_${me}`).emit("conversationCreated", conv);
        io.to(`user_${adminUser._id}`).emit("conversationCreated", conv);
      } catch (e) {
        console.warn('Socket emit failed:', e);
      }
    }

    return res.status(200).json(conv);
  } catch (err) {
    console.error('Error creating conversation with admin:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { conversationId } = req.params;
    const { before, limit = 20 } = req.query;

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    if (!await isParticipantForConversation(userId, conv, userRole)) return res.status(403).json({ message: "Forbidden" });

    const q = { conversation: conversationId };
    if (before) q.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(q).sort({ createdAt: -1 }).limit(Number(limit)).populate("sender", "userName profilePic");
    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const me = req.user?.id;
    const role = req.user?.role;
    if (!me) return res.status(401).json({ message: "Authentication required" });

    const { type, limit = 100 } = req.query;
    const query = {};

    if (role === 'admin') {
      if (type) query.type = type;
      else query.type = { $in: ['consultation', 'direct'] };
    } else {
      query.participants = me;
      if (type) query.type = type;
    }

    const convs = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .populate('participants', 'userName profilePic email')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'userName' } })
      .limit(Number(limit));

    return res.status(200).json(convs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete conversations' });
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId required' });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    await Message.deleteMany({ conversation: conversationId });
    await conv.deleteOne();

    try {
      const io = getIO();
      io.to(`conv_${conversationId}`).emit('conversationDeleted', { conversationId });
    } catch (e) {
      // ignore socket errors
    }

    return res.status(200).json({ message: 'Conversation deleted' });
  } catch (err) {
    console.error('deleteConversation error:', err);
    return res.status(500).json({ message: err.message });
  }
};

export const getConversationDetail = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { conversationId } = req.params;
    const conv = await Conversation.findById(conversationId)
      .populate('participants', 'userName profilePic email role')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'userName' } });

    if (!conv) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const allowed = await isParticipantForConversation(userId, conv, userRole);
    if (!allowed) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(conv);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const uploadAttachments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files" });
    }
    const attachments = req.files.map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      path: f.path.replace(/\\/g, "/"),
      mimetype: f.mimetype,
      size: f.size,
      uploadedAt: new Date()
    }));
    return res.status(200).json({ attachments });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const createMessageViaHttp = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { conversationId, text, attachments = [] } = req.body;
    if (!conversationId) return res.status(400).json({ message: "conversationId required" });

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    if (!await isParticipantForConversation(userId, conv, userRole)) return res.status(403).json({ message: "Forbidden" });

    const message = new Message({ conversation: conversationId, sender: userId, text, attachments });
    await message.save();
    conv.lastMessage = message._id; await conv.save();
    await message.populate("sender", "userName profilePic");

    try {
      const io = getIO();
      io.to(`conv_${conversationId}`).emit("message", message);
      conv.participants.forEach(pid => {
        try {
          if (!pid.equals(userId)) {
            io.to(`user_${pid.toString()}`).emit("newMessage", { conversationId, message });
          }
        } catch (e) {
          console.warn('Failed to emit newMessage to participant', pid, e);
        }
      });
    } catch (e) {
      // socket not initialized — ignore
    }

    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { messageId } = req.params;
    const { text, attachments = [] } = req.body;
    if (!text && attachments.length === 0) return res.status(400).json({ message: "text or attachments required" });

    const message = await Message.findById(messageId).populate("sender", "userName profilePic");
    if (!message) return res.status(404).json({ message: "Message not found" });
    
    if (message.sender._id.toString() !== userId) return res.status(403).json({ message: "Can only edit own messages" });

    message.text = text;
    if (attachments.length > 0) {
      message.attachments = attachments;
    }
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    try {
      const io = getIO();
      io.to(`conv_${message.conversation}`).emit("messageEdited", message);
    } catch (e) {
      // socket not initialized — ignore
    }

    return res.status(200).json({ message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const downloadAttachment = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { filename } = req.params;
    if (!filename) return res.status(400).json({ message: "Filename required" });

    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const filePath = path.join(process.cwd(), 'uploads/chat', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Download error" });
      }
    });
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ message: err.message });
  }
};