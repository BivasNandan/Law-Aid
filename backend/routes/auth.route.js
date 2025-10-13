import express from "express";
import { assigningRole, register, setClientAdditionalInfo, setLawyerAdditionalInfo, login, logout, getAllLawyers, getAllClients, getLawyer, getClient, filterLawyers, getClientById, editProfile, deleteAccount, getLawyerById } from "../controllers/auth.controller.js";

const router = express.Router();

//starting of registration and login routes
router.post("/assigningRole", assigningRole);
router.post("/register", register);
router.patch("/set-lawyer-additional-info", setLawyerAdditionalInfo);
router.patch("/set-client-additional-info", setClientAdditionalInfo);
router.post("/login", login);
router.post("/logout", logout);
//end of registration and login routes

//routes for getting all lawyers and clients
router.get("/getAllLawyers", getAllLawyers);
router.get("/getAllClients", getAllClients);

//routes for getting individual lawyer and client profiles(we will use it to search)
router.get("/lawyer/:userName", getLawyer);
router.get("/client/:userName", getClient);

router.get("/lawyers", filterLawyers);

// routes for getting lawyers and clients by ID
router.get("/client/:id", getClientById);
router.get("/lawyer/:id", getLawyerById);

// routes for editing profile and deleting account
router.patch("/profile/:id", editProfile);
router.delete("/profile/:id", deleteAccount);

export default router;