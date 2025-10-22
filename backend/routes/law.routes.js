import express from "express";
import { createLaw, deleteLaw, updateLaw, getLaw, getLawById, filterLaws, getCategories, getCodeNumbers } from "../controllers/law.controller.js";

const router = express.Router();

router.post("/createLaw", createLaw);
router.patch("/update/:id", updateLaw);
router.delete("/delete/:id", deleteLaw);
router.get("/get/:id", getLawById);
router.get("/getLaw", getLaw);
router.get("/filterLaws", filterLaws);
router.get('/categories', getCategories);
router.get('/codes', getCodeNumbers);
export default router;

