import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import multer from "multer";
import path from "path";  
import { connectDB } from "../config/db.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.route.js";
import lawRoutes from "../routes/law.routes.js";
import appointmentRoutes from "../routes/appointment.route.js";
import chatRoutes from "../routes/chat.route.js";
import feedbackRoutes from "../routes/feedback.route.js";
import notificationRoutes from "../routes/notification.route.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ✅ CORS configuration to allow credentials
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Accept']
}));


// Middleware
app.use(express.json()); // for JSON request bodies
app.use(bodyParser.urlencoded({ extended: false })); // for URL-encoded bodies
app.use(bodyParser.json()); // parse JSON bodies
app.use(cookieParser()); // parse cookies

// Test route
app.get("/", (req, res) => {
    res.json({ msg: "hello!" });
});
//  Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/law", lawRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);

// Initialize socket.io
import { initSocket } from './socket.js';
const io = initSocket(server);

// Connect to database and start server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server and Socket.IO are running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
});
