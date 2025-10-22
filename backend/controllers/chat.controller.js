// ...existing code...
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import Appointment from "../models/appointment.js";
import Consultation from "../models/consultation.js";
import { getIO } from "../src/socket.js";

const isParticipantForConversation = async (userId, conv) => {
  if (!conv) return false;
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

export const getMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { conversationId } = req.params;
    const { before, limit = 20 } = req.query;

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    if (!await isParticipantForConversation(userId, conv)) return res.status(403).json({ message: "Forbidden" });

    const q = { conversation: conversationId };
    if (before) q.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(q).sort({ createdAt: -1 }).limit(Number(limit)).populate("sender", "userName profilePic");
    return res.status(200).json(messages);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const uploadAttachments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: "No files" });
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
    return res.status(500).json({ message: err.message });
  }
};

//allow creating a message via HTTP and emit over sockets
export const createMessageViaHttp = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { conversationId, text, attachments = [] } = req.body;
    if (!conversationId) return res.status(400).json({ message: "conversationId required" });

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    if (!await isParticipantForConversation(userId, conv)) return res.status(403).json({ message: "Forbidden" });

    const message = new Message({ conversation: conversationId, sender: userId, text, attachments });
    await message.save();
    conv.lastMessage = message._id; await conv.save();
    await message.populate("sender", "userName profilePic");

    // emit via sockets if available
    try {
      const io = getIO();
      io.to(`conv_${conversationId}`).emit("message", message);
      conv.participants.forEach(pid => {
        if (!pid.equals(userId)) io.to(`user_${pid}`).emit("newMessage", { conversationId, message });
      });
    } catch (e) {
      // socket not initialized — ignore
    }

    return res.status(201).json({ message });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
// ...existing code...