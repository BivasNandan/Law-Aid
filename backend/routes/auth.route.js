import express from "express";
import { assigningRole, register, setClientAdditionalInfo, setLawyerAdditionalInfo, login, logout, getAllLawyers, getAllClients, getSingularLawyer, getSingularClient, filterLawyers } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/assigningRole", assigningRole);
router.post("/register", register);
router.patch("/set-lawyer-additional-info", setLawyerAdditionalInfo);
router.patch("/set-client-additional-info", setClientAdditionalInfo);
router.post("/login", login);
router.post("/logout", logout);
router.get("/getAllLawyers", getAllLawyers);
router.get("/getAllClients", getAllClients);
router.get("/lawyer/:userName", getSingularLawyer);
router.get("/client/:userName", getSingularClient);
router.get("/filterLawyers ", filterLawyers );


export default router;