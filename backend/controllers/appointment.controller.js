import Appointment from "../models/appointment.js";
import User from "../models/user.js";
import { getIO } from "../src/socket.js";
import { generateTokenForRole, generateTokenForUserId } from "../utils/tokens.js";
import jwt from "jsonwebtoken";
import Notification from "../models/notification.js";
import sendEmail from "../utils/email.js";

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
        let apptDate = new Date(dateTime);
        if (isNaN(apptDate.getTime())) return res.status(400).json({ message: 'Invalid date/time provided.' });

        // Get current date without time for comparison
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        // Create a date from appointment date without time for comparison
        const apptDateOnly = new Date(apptDate);
        apptDateOnly.setHours(0, 0, 0, 0);

        // If appointment date is before current date, add one year
        if (apptDateOnly < currentDate) {
            apptDate.setFullYear(apptDate.getFullYear() + 1);
        }

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
    const { appointmentId } = req.params;
    const { status } = req.body;

    try {
        // Validate status
        if(!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({message: "Invalid status value!"});
        }

        // Check authentication
        const token = req.cookies.userToken;
        if(!token) {
            return res.status(401).json({message: "Authentication required"});
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const user = await User.findById(userId);
        if(!user) {
            return res.status(403).json({message: "User not found"});
        }
        
        console.log('Updating appointment status:', { appointmentId, status, userId });
        
        // Get appointment with populated fields
        const appointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');
            
        if(!appointment) {
            console.log('Appointment not found:', appointmentId);
            return res.status(404).json({message: "Appointment not found!"});
        }

        console.log('Found appointment:', {
            id: appointment._id,
            clientId: appointment.client._id,
            status: appointment.status,
            userId
        });

        // Check permissions based on status change
        if(status === 'completed') {
            // Compare string versions of both IDs
            if(appointment.client._id.toString() !== userId) {
                console.log('Permission denied:', {
                    appointmentClientId: appointment.client._id.toString(),
                    requestUserId: userId
                });
                return res.status(403).json({message: "Only the client can mark an appointment as attended"});
            }
            if(appointment.status !== 'confirmed') {
                console.log('Invalid status transition:', {
                    currentStatus: appointment.status,
                    requestedStatus: status
                });
                return res.status(400).json({message: "Only confirmed appointments can be marked as attended"});
            }
        } 
        else if(user.role !== "lawyer") {
            return res.status(403).json({message: "Only lawyers can update appointment status"});
        }

        // Update appointment status
        appointment.status = status;
        await appointment.save();

        // Get updated appointment with populated fields
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');

        // Try to emit socket event
        try {
            const io = getIO();
            io.to(`user_${updatedAppointment.client._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
            io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
        } catch (err) {
            // Socket errors shouldn't fail the request
            console.warn('Socket emit failed:', err.message);
        }

        return res.status(200).json({
            message: "Appointment status updated successfully!", 
            appointment: updatedAppointment
        });

    } catch (error) {
        // Check if it's a JWT verification error
        if(error.name === 'JsonWebTokenError') {
            console.error('JWT verification failed:', error);
            return res.status(401).json({message: "Invalid authentication token"});
        }

        console.error('Appointment status update error:', {
            error: error.message,
            stack: error.stack,
            appointmentId,
            status
        });
        
        return res.status(500).json({
            message: "Failed to update appointment status",
            error: error.message
        });
    }
};

// Lawyer proposes a reschedule with new date/time
export const proposeReschedule = async (req, res) => {
    const { appointmentId } = req.params;
    const { proposedDateTime, rescheduleReason } = req.body;

    try {
        // Validate inputs
        if (!proposedDateTime) {
            return res.status(400).json({ message: "Proposed date/time is required!" });
        }

        // Check authentication
        const token = req.cookies.userToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        // Only lawyers can propose reschedules
        if (user.role !== "lawyer") {
            return res.status(403).json({ message: "Only lawyers can propose rescheduling" });
        }

        // Get appointment and verify lawyer owns it
        const appointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');
            
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found!" });
        }

        // Check if user is the lawyer of this appointment
        if (appointment.lawyer._id.toString() !== userId) {
            return res.status(403).json({ message: "Only the lawyer can propose rescheduling" });
        }

        // Validate proposed date is in the future
        const proposedDate = new Date(proposedDateTime);
        if (isNaN(proposedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date/time format!" });
        }

        if (proposedDate < new Date()) {
            return res.status(400).json({ message: "Proposed date/time must be in the future!" });
        }

        // Check if the slot is already booked
        const existing = await Appointment.findOne({
            lawyer: appointment.lawyer._id,
            dateTime: proposedDate,
            _id: { $ne: appointmentId } // Exclude current appointment
        });

        if (existing) {
            return res.status(400).json({ message: "This time slot is already booked!" });
        }

        // Update appointment with reschedule proposal
        appointment.proposedDateTime = proposedDate;
        appointment.rescheduleReason = rescheduleReason || null;
        await appointment.save();

        // Get updated appointment
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');

                // Emit socket event to notify client
                try {
                        const io = getIO();
                        io.to(`user_${updatedAppointment.client._id.toString()}`).emit('rescheduleProposed', {
                                appointmentId: updatedAppointment._id,
                                lawyerName: updatedAppointment.lawyer.userName,
                                currentDateTime: updatedAppointment.dateTime,
                                proposedDateTime: proposedDate,
                                rescheduleReason: rescheduleReason
                        });

                        // Also create a persistent notification for the client
                        try {
                            const client = await User.findById(updatedAppointment.client._id).select('email userName')
                            const notif = new Notification({
                                recipient: updatedAppointment.client._id,
                                type: 'general',
                                title: 'Appointment Reschedule Proposed',
                                message: `${updatedAppointment.lawyer.userName} proposed a new time for your appointment.`,
                                relatedAppointment: updatedAppointment._id,
                                relatedUser: updatedAppointment.lawyer._id,
                                metadata: {
                                    appointmentDateTime: proposedDate,
                                    lawyerName: updatedAppointment.lawyer.userName,
                                    clientName: client?.userName || ''
                                }
                            })

                            await notif.save()

                            // Send an email to the client (non-blocking)
                            if (client?.email) {
                                const subject = 'Appointment Reschedule Proposed'
                                const html = `<p>Dear ${client.userName || 'Client'},</p>
                                    <p>${updatedAppointment.lawyer.userName} has proposed a new time for your appointment.</p>
                                    <p><strong>Proposed time:</strong> ${new Date(proposedDate).toLocaleString()}</p>
                                    <p>Please log in to your account to accept or decline the proposal.</p>
                                    <p>Regards,<br/>Law-Aid</p>`

                                sendEmail({ to: client.email, subject, html }).catch(e => console.warn('Email send failed:', e))
                            }
                        } catch (nerr) {
                            console.warn('Failed to create notification or send email:', nerr)
                        }
                } catch (err) {
                        console.warn('Socket emit failed:', err.message);
                }

        return res.status(200).json({
            message: "Reschedule proposal sent to client!",
            appointment: updatedAppointment
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid authentication token" });
        }

        console.error('Reschedule proposal error:', error);
        return res.status(500).json({
            message: "Failed to propose reschedule",
            error: error.message
        });
    }
};

// Client accepts or rejects reschedule proposal
export const respondToReschedule = async (req, res) => {
    const { appointmentId } = req.params;
    const { response } = req.body; // "accepted" or "rejected"

    try {
        // Validate response
        if (!["accepted", "rejected"].includes(response)) {
            return res.status(400).json({ message: "Response must be 'accepted' or 'rejected'" });
        }

        // Check authentication
        const token = req.cookies.userToken;
        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Verify token and get user
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        // Get appointment and verify client owns it
        const appointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');
            
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found!" });
        }

        // Check if user is the client of this appointment
        if (appointment.client._id.toString() !== userId) {
            return res.status(403).json({ message: "Only the client can respond to reschedule" });
        }

        // Check if there's a pending reschedule (presence of proposedDateTime indicates a pending proposal)
        if (!appointment.proposedDateTime) {
            return res.status(400).json({ message: "No pending reschedule for this appointment" });
        }

        if (response === "accepted") {
            // Accept reschedule - update the main dateTime and clear proposal
            appointment.dateTime = appointment.proposedDateTime;
            appointment.proposedDateTime = null;
            appointment.rescheduleReason = null;
        } else {
            // Reject reschedule - clear proposal fields
            appointment.proposedDateTime = null;
            appointment.rescheduleReason = null;
        }

        await appointment.save();

        // Get updated appointment
        const updatedAppointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');

        // Emit socket event to notify lawyer
        try {
            const io = getIO();
            io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('rescheduleResponded', {
                appointmentId: updatedAppointment._id,
                clientName: updatedAppointment.client.userName,
                response: response,
                newDateTime: response === "accepted" ? updatedAppointment.dateTime : null
            });
            // Also emit a general appointment update so clients and lawyers update their lists
            io.to(`user_${updatedAppointment.client._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
            io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
        } catch (err) {
            console.warn('Socket emit failed:', err.message);
        }

        return res.status(200).json({
            message: `Reschedule ${response}!`,
            appointment: updatedAppointment
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid authentication token" });
        }

        console.error('Reschedule response error:', error);
        return res.status(500).json({
            message: "Failed to respond to reschedule",
            error: error.message
        });
    }
};