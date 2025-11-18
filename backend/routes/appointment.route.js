import express from "express";

import { createAppointment, deleteAppointment, viewMyAppointmentsById, updateAppointmentStatus, proposeReschedule, respondToReschedule, getAppointmentById } from "../controllers/appointment.controller.js";

const router = express.Router();

router.post("/create", createAppointment);
router.delete("/delete/:appointmentId", deleteAppointment);
router.get("/user/:id", viewMyAppointmentsById);
router.get("/:appointmentId", getAppointmentById);
router.patch("/update/:appointmentId/status", updateAppointmentStatus);
router.patch("/reschedule/:appointmentId/propose", proposeReschedule);
router.patch("/reschedule/:appointmentId/respond", respondToReschedule);

export default router;