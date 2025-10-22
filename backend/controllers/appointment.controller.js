import Appointment from "../models/appointment.js";
import User from "../models/user.js";
import { getIO } from "../src/socket.js";
import { generateTokenForRole, generateTokenForUserId } from "../utils/tokens.js";
import jwt from "jsonwebtoken";

export const createAppointment = async (req, res) => {
    const { lawyerId, dateTime } = req.body;

    // Basic validation
    if (!lawyerId || !dateTime) return res.status(400).json({ message: 'All fields are required!' });

    const token = req.cookies.userToken;
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const user = await User.findById(userId);
        if (!user || user.role !== 'client') return res.status(400).json({ message: 'Client not found or not authorized.' });

        const lawyer = await User.findById(lawyerId);
        if (!lawyer || lawyer.role !== 'lawyer') return res.status(400).json({ message: 'Lawyer not found.' });

        // normalize dateTime to Date
        const apptDate = new Date(dateTime);
        if (isNaN(apptDate.getTime())) return res.status(400).json({ message: 'Invalid date/time provided.' });

        // check if slot already booked for this lawyer at exact time
        const existing = await Appointment.findOne({ lawyer: lawyer._id, dateTime: apptDate });
        if (existing) return res.status(400).json({ message: 'This time slot is already booked.' });

        const newAppointment = new Appointment({
            lawyer: lawyer._id,
            client: user._id,
            dateTime: apptDate,
            status: 'pending'
        });

        await newAppointment.save();
        return res.status(201).json({ message: 'Appointment booked successfully!', appointment: newAppointment });
    } catch (error) {
        console.error('createAppointment error:', error);
        return res.status(500).json({ message: 'Failed to create an appointment.', error: error.message });
    }
};

export const deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required"});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if(!user) return res.status(400).json({message: "User not found!"});

            const appointment = await Appointment.findById(appointmentId);
            if(!appointment) return res.status(404).json({message: "Appointment not found!"});

            // appointment.client and appointment.lawyer are ObjectIds; compare as strings
            const clientId = appointment.client?.toString();
            const lawyerId = appointment.lawyer?.toString();
            if(clientId !== userId && lawyerId !== userId) return res.status(403).json({message: "You are not authorized to delete this appointment."});

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
        if(!token) return res.status(401).json({message: "Authentication required"});

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;

            const user = await User.findById(userId);
            if(!user) return res.status(400).json({message: "User not found!"});

            // Find appointments where the user is either the client or the lawyer
            const appointments = await Appointment.find({
                $or: [
                    { client: userId },
                    { lawyer: userId }
                ]
            }).populate('lawyer', 'userName profilePic').populate('client', 'userName');

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
        if(!token) return res.status(401).json({message: "Authentication required"});
        try {

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.userId;
            const user = await User.findById(userId);
            if(!user || user.role !== "lawyer") return res.status(403).json({message: "Only lawyers can update appointment status."});
            
            const appointment = await Appointment.findById(appointmentId);
            if(!appointment) return res.status(404).json({message: "Appointment not found!"});

            // appointment.lawyer can be either an ObjectId or a populated document
            const lawyerId = appointment.lawyer?.toString ? appointment.lawyer.toString() : appointment.lawyer?._id?.toString();
            if(lawyerId !== userId) return res.status(403).json({message: "You are not authorized to update this appointment."});

            appointment.status = status;
            await appointment.save();
                        // Emit socket event to notify the client (and lawyer) about status change
                        try {
                            const io = getIO();
                            // Emit to both participants' rooms
                            io.to(`user_${appointment.client.toString()}`).emit('appointmentStatusUpdated', appointment);
                            io.to(`user_${appointment.lawyer.toString()}`).emit('appointmentStatusUpdated', appointment);
                        } catch (err) {
                            // Socket not initialized or emit failed - ignore silently
                        }

                        res.status(200).json({message: "Appointment status updated successfully!", appointment});

        } catch (error) {
            res.status(500).json({message: "Internal server error", error: error.message});
        }

    } catch (error) {
        res.status(401).json({message: "Failed to update appointment status!", error: error.message});
    }
};