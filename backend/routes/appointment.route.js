import express from "express";

import { createAppointment, deleteAppointment, viewMyAppointmentsById, updateAppointmentStatus } from "../controllers/appointment.controller.js";

const router = express.Router();

router.post("/create", createAppointment);
router.delete("/delete/:appointmentId", deleteAppointment);
router.put("/update/:appointmentId", updateAppointmentStatus);
router.get("/user/:id", viewMyAppointmentsById);
router.put("/status/:appointmentId", updateAppointmentStatus);

export default router;