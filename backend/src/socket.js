import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "../models/conversation.js";
import Appointment from "../models/appointment.js";
import Consultation from "../models/consultation.js";
import Message from "../models/message.js";

let io; // singleton

export function initSocket(server, options = {}) {
  if (io) return io; // avoid double-init

  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true },
    ...options
  });

  // socket auth using cookie 'userToken'
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const token = cookieHeader.split(";").map(c => c.trim()).find(c => c.startsWith("userToken="))?.split("=")[1];
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.userId, role: decoded.role };
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", socket => {
    const userId = socket.user.id;
    socket.join(`user_${userId}`);

    socket.on("joinConversation", async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit("error", "Conversation not found");

        if (conv.type === "appointment" && conv.appointmentId) {
          const appt = await Appointment.findById(conv.appointmentId);
          if (!appt || ![appt.client.toString(), appt.lawyer.toString()].includes(userId)) return socket.emit("error", "Not part of appointment");
        } else if (conv.type === "consultation" && conv.consultationId) {
          const cons = await Consultation.findById(conv.consultationId);
          if (!cons || ![cons.client.toString(), cons.lawyer.toString()].includes(userId)) return socket.emit("error", "Not part of consultation");
        } else if (!conv.participants.some(p => p.equals(userId))) {
          return socket.emit("error", "Not a participant");
        }

        socket.join(`conv_${conversationId}`);
        socket.emit("joined", { conversationId });
      } catch (err) {
        socket.emit("error", err.message);
      }
    });

    socket.on("leaveConversation", ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on("sendMessage", async ({ conversationId, text, attachments = [] }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit("error", "Conversation not found");

        if (conv.type === "appointment" && conv.appointmentId) {
          const appt = await Appointment.findById(conv.appointmentId);
          if (!appt || ![appt.client.toString(), appt.lawyer.toString()].includes(userId)) return socket.emit("error", "Not authorized");
        } else if (conv.type === "consultation" && conv.consultationId) {
          const cons = await Consultation.findById(conv.consultationId);
          if (!cons || ![cons.client.toString(), cons.lawyer.toString()].includes(userId)) return socket.emit("error", "Not authorized");
        } else if (!conv.participants.some(p => p.equals(userId))) {
          return socket.emit("error", "Not a participant");
        }

        const message = new Message({ conversation: conversationId, sender: userId, text, attachments });
        await message.save();

        conv.lastMessage = message._id;
        await conv.save();

        await message.populate("sender", "userName profilePic");
        io.to(`conv_${conversationId}`).emit("message", message);

        // notify other sockets of participants
        conv.participants.forEach(pid => {
          if (!pid.equals(userId)) io.to(`user_${pid}`).emit("newMessage", { conversationId, message });
        });
      } catch (err) {
        socket.emit("error", err.message);
      }
    });

    socket.on("typing", ({ conversationId, typing }) => {
      socket.to(`conv_${conversationId}`).emit("typing", { userId, typing });
    });

    socket.on("messageRead", async ({ conversationId, messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "read" });
        io.to(`conv_${conversationId}`).emit("messageRead", { messageId, userId });
      } catch (err) {
        socket.emit("error", err.message);
      }
    });

    socket.on("disconnect", () => {
      // optional: presence handling
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  return io;
}