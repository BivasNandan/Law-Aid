import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";  
import { connectDB } from "../config/db.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import authRoutes from "../routes/auth.route.js";
import lawRoutes from "../routes/law.routes.js";
import appointmentRoutes from "../routes/appointment.route.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 5001

//middleware
app.use(express.json()); //used for req.body
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.json( { "msg": "hello!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/law", lawRoutes);
app.use("/api/appointment", appointmentRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
  });
});