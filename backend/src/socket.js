import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Conversation from "../models/conversation.js";
import Appointment from "../models/appointment.js";
import Consultation from "../models/consultation.js";
import Message from "../models/message.js";

let io;

export function initSocket(server, options = {}) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
    },
    ...options
  });

  // Socket authentication using cookie 'userToken'
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const token = cookieHeader
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith("userToken="))
        ?.split("=")[1];

      if (!token) {
        console.log('❌ No userToken found in socket connection');
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.userId, role: decoded.role };
      
      console.log(`✅ Socket authenticated: userId=${decoded.userId}, role=${decoded.role}`);
      return next();
    } catch (err) {
      console.log('❌ Socket auth failed:', err.message);
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", socket => {
    const userId = socket.user.id;

    console.log(`🔌 Socket connected: socket.id=${socket.id}, userId=${userId}, role=${socket.user.role}`);
    
    // CRITICAL: Join user-specific room for notifications
    socket.join(`user_${userId}`);
    console.log(`👤 User joined room: user_${userId}`);

    socket.on("joinConversation", async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          console.log(`❌ Conversation not found: ${conversationId}`);
          return socket.emit("error", "Conversation not found");
        }

        // Validate user is participant
        let isParticipant = false;

        if (conv.type === "appointment" && conv.appointmentId) {
          const appt = await Appointment.findById(conv.appointmentId);
          if (appt && [appt.client.toString(), appt.lawyer.toString()].includes(userId)) {
            isParticipant = true;
          }
        } else if (conv.type === "consultation" && conv.consultationId) {
          const cons = await Consultation.findById(conv.consultationId);
          if (cons && [cons.client.toString(), cons.lawyer.toString()].includes(userId)) {
            isParticipant = true;
          }
        } else if (conv.type === "direct") {
          // For direct conversations (like client-admin chat)
          isParticipant = conv.participants.some(p => p.equals(userId));
        } else {
          isParticipant = conv.participants.some(p => p.equals(userId));
        }

        if (!isParticipant) {
          console.log(`❌ User ${userId} not authorized for conversation ${conversationId}`);
          return socket.emit("error", "Not authorized");
        }

        socket.join(`conv_${conversationId}`);
        console.log(`✅ Socket ${socket.id} (user ${userId}) joined conv_${conversationId}`);
        socket.emit("joined", { conversationId });
      } catch (err) {
        console.error('❌ joinConversation error:', err);
        socket.emit("error", err.message);
      }
    });

    socket.on("leaveConversation", ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
      console.log(`👋 Socket ${socket.id} left conv_${conversationId}`);
    });

    socket.on("sendMessage", async ({ conversationId, text, attachments = [] }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          return socket.emit("error", "Conversation not found");
        }

        // Validate authorization
        let isAuthorized = false;

        if (conv.type === "appointment" && conv.appointmentId) {
          const appt = await Appointment.findById(conv.appointmentId);
          isAuthorized = appt && [appt.client.toString(), appt.lawyer.toString()].includes(userId);
        } else if (conv.type === "consultation" && conv.consultationId) {
          const cons = await Consultation.findById(conv.consultationId);
          isAuthorized = cons && [cons.client.toString(), cons.lawyer.toString()].includes(userId);
        } else if (conv.type === "direct") {
          isAuthorized = conv.participants.some(p => p.equals(userId));
        } else {
          isAuthorized = conv.participants.some(p => p.equals(userId));
        }

        if (!isAuthorized) {
          return socket.emit("error", "Not authorized");
        }

        // Create and save message
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          text,
          attachments
        });
        await message.save();

        // Update conversation's last message
        conv.lastMessage = message._id;
        await conv.save();

        // Populate sender info
        await message.populate("sender", "userName profilePic");

        console.log(`📨 Message sent in conv_${conversationId} by user ${userId}`);

        // Emit to all sockets in the conversation room
        io.to(`conv_${conversationId}`).emit("message", message);

        // Notify other participants via their user rooms
        conv.participants.forEach(pid => {
          const pidStr = pid.toString();
          if (pidStr !== userId) {
            console.log(`🔔 Notifying user_${pidStr} of new message`);
            io.to(`user_${pidStr}`).emit("newMessage", {
              conversationId,
              message
            });
          }
        });
      } catch (err) {
        console.error('❌ sendMessage error:', err);
        socket.emit("error", err.message);
      }
    });

    socket.on("typing", ({ conversationId, typing }) => {
      socket.to(`conv_${conversationId}`).emit("typing", {
        userId,
        typing
      });
    });

    socket.on("messageRead", async ({ conversationId, messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { status: "read" });
        io.to(`conv_${conversationId}`).emit("messageRead", {
          messageId,
          userId
        });
      } catch (err) {
        socket.emit("error", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: socket.id=${socket.id}, userId=${userId}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  }
  return io;
}