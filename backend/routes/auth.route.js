import express from "express";
import { getRole, register } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/getRole", getRole);
router.post("/register", register);


export default router;