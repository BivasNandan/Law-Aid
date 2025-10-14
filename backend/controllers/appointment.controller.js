import Appointment from "../models/appointment.js";
import User from "../models/user.js";
import { generateTokenForRole, generateTokenForUserId } from "../utils/tokens.js";
import jwt from "jsonwebtoken";

export const createAppointment = async (req, res) => {
    try {
        const { lawyerId, dateTime } = req.body;

        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required", error: error.message});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if(!user || !user.role === "client") return res.status(400).json({message: "Client not found!"});

            if( !lawyerId || !dateTime ) return res.status(400).json({message: "All fields are required!"});

            const lawyer = await User.findById(lawyerId);
            if( !lawyer || lawyer.role === "lawyer" ) return res.status(400).json({message: "Lawyer not found!"});

            //checking if there is already an existing booked appoointment with the same lawyer
            const existing = await Appointment.findOne({ lawyerId, dateTime });
            if(existing) return res.status(400).json({ message: "This time slot is already booked." }); 

            const newAppointment = new Appointment({
                lawyerName: lawyer.userName,
                lawyerId: lawyerId,
                clientName: user.userName,
                clientId: userId,
                dateTime,
                status: "pending",
            });

            await newAppointment.save();
            res.status(201).json({ message: "Appointment booked successfully!", appointment: newAppointment });
        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.message });
        }

    } catch (error) {
        res.status(401).json({ message: "Failed to create an appointment!", error: error.message });
    }
};

export const deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required", error: error.message});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if(!user || !user.role === "client" || user.role === "lawyer") return res.status(400).json({message: "User not found!"});

            const appointment = await Appointment.findById(appointmentId);
            if(!appointment) return res.status(404).json({message: "Appointment not found!"});

            if(appointment.client._id !== userId && appointment.lawyer._id !== userId) return res.status(403).json({message: "You are not authorized to delete this appointment."});

            await Appointment.findByIdAndDelete(appointmentId);
            res.status(200).json({message: "Appointment deleted successfully!"});
        } catch (error) {
            res.status(500).json({message: "Internal server error", error: error.message});
        }

    } catch (error) {
        res.status(401).json({message: "Failed to delete appointment!", error: error.message});
    }
};

export const viewMyAppointmentsById = async (req, res) => {   
    try {
        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required", error: error.message});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if(!user) return res.status(400).json({message: "User not found!"});

            const appointments = await Appointment.find({
                $or: [
                    { clientId: userId },
                    { lawyerId: userId }
                ]
            });

            res.status(200).json({ appointments });
        } catch (error) {
            res.status(500).json({message: "Internal server error", error: error.message});
        }

    } catch (error) {
        res.status(401).json({message: "Failed to view appointments!", error: error.message});
    }
};

export const updateAppointmentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;
        if(!["pending", "confirmed", "cancelled"].includes(status)) {
            return res.status(400).json({message: "Invalid status value!"});
        }

        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required", error: error.message});
        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;
            const user = await User.findById(userId);
            if(!user || user.role !== "lawyer") return res.status(400).json({message: "Lawyer not found!"});
            
            const appointment = await Appointment.findById(appointmentId);
            if(!appointment) return res.status(404).json({message: "Appointment not found!"});

            if(appointment.lawyer._id !== userId) return res.status(403).json({message: "You are not authorized to update this appointment."});

            appointment.status = status;
            await appointment.save();
            res.status(200).json({message: "Appointment status updated successfully!", appointment});

        } catch (error) {
            res.status(500).json({message: "Internal server error", error: error.message});
        }

    } catch (error) {
        res.status(401).json({message: "Failed to update appointment status!", error: error.message});
    }
};