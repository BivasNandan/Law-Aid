import express from "express";
import { createLaw, deleteLaw, updateLaw, getLaw } from "../controllers/law.controller.js";
import { get } from "mongoose";

const router = express.Router();

router.post("/createLaw", createLaw);
router.patch("/update/:id", updateLaw);
router.delete("/delete/:id", deleteLaw);
router.get("/getLaw", getLaw);

export default router;

