import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { connectDB } from "../config/db.js";
import authRoutes from "../routes/auth.route.js";
import lawRoutes from "../routes/law.routes.js";
import appointmentRoutes from "../routes/appointment.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ✅ CORS configuration to allow credentials
app.use(cors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/law", lawRoutes);
app.use("/api/appointment", appointmentRoutes);

// Connect to DB and start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server started on PORT: ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to connect to DB:", err);
});
