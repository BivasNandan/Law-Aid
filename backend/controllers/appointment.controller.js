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

        // ✅ NOTIFICATION: Notify lawyer about new appointment request
        try {
            const timeStr = new Date(apptDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const notification = new Notification({
                recipient: lawyer._id,
                type: 'general',
                title: '📅 New Appointment Request',
                message: `${user.userName} has requested an appointment on ${timeStr}`,
                relatedAppointment: newAppointment._id,
                relatedUser: user._id,
                metadata: {
                    appointmentDateTime: apptDate,
                    clientName: user.userName,
                    lawyerName: lawyer.userName
                }
            });

            await notification.save();

            // Emit real-time notification
            try {
                const io = getIO();
                const populatedNotif = await Notification.findById(notification._id)
                    .populate('relatedUser', 'userName profilePic');
                io.to(`user_${lawyer._id.toString()}`).emit('notificationCreated', populatedNotif);
            } catch (emitErr) {
                console.warn('Failed to emit notification:', emitErr.message);
            }

            // Send email to lawyer
            if (lawyer.email) {
                const subject = 'New Appointment Request';
                const html = `<p>Dear ${lawyer.userName},</p>
                    <p><strong>${user.userName}</strong> has requested an appointment with you.</p>
                    <p><strong>Requested time:</strong> ${timeStr}</p>
                    <p>Please log in to your account to confirm or decline the request.</p>
                    <p>Regards,<br/>Law-Aid</p>`;
                sendEmail({ to: lawyer.email, subject, html }).catch(e => console.warn('Email send failed:', e));
            }
        } catch (notifErr) {
            console.warn('Failed to create appointment request notification:', notifErr);
        }

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

            const appointment = await Appointment.findById(appointmentId)
                .populate('lawyer', 'userName email profilePic')
                .populate('client', 'userName email');
            if(!appointment) return res.status(404).json({message: "Appointment not found!"});

            // appointment.client and appointment.lawyer are ObjectIds; compare as strings
            const clientId = appointment.client?._id.toString();
            const lawyerId = appointment.lawyer?._id.toString();
            if(clientId !== userId && lawyerId !== userId) return res.status(403).json({message: "You are not authorized to delete this appointment."});

            // ✅ NOTIFICATION: Notify the other party about cancellation
            try {
                const isClient = clientId === userId;
                const recipientId = isClient ? lawyerId : clientId;
                const recipientData = isClient ? appointment.lawyer : appointment.client;
                const cancellerName = isClient ? appointment.client.userName : appointment.lawyer.userName;

                const timeStr = new Date(appointment.dateTime).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const notification = new Notification({
                    recipient: recipientId,
                    type: 'appointment_cancelled',
                    title: '❌ Appointment Cancelled',
                    message: `${cancellerName} has cancelled the appointment scheduled for ${timeStr}`,
                    relatedAppointment: appointment._id,
                    relatedUser: userId,
                    metadata: {
                        appointmentDateTime: appointment.dateTime,
                        cancelledBy: isClient ? 'client' : 'lawyer',
                        cancellerName,
                        lawyerName: appointment.lawyer.userName,
                        clientName: appointment.client.userName
                    }
                });

                await notification.save();

                // Emit real-time notification
                try {
                    const io = getIO();
                    const populatedNotif = await Notification.findById(notification._id)
                        .populate('relatedUser', 'userName profilePic');
                    io.to(`user_${recipientId}`).emit('notificationCreated', populatedNotif);
                } catch (emitErr) {
                    console.warn('Failed to emit cancellation notification:', emitErr.message);
                }

                // Send email
                if (recipientData.email) {
                    const subject = 'Appointment Cancelled';
                    const html = `<p>Dear ${recipientData.userName},</p>
                        <p>Your appointment scheduled for <strong>${timeStr}</strong> has been cancelled by ${cancellerName}.</p>
                        <p>If you have any questions, please contact us.</p>
                        <p>Regards,<br/>Law-Aid</p>`;
                    sendEmail({ to: recipientData.email, subject, html }).catch(e => console.warn('Email send failed:', e));
                }
            } catch (notifErr) {
                console.warn('Failed to create cancellation notification:', notifErr);
            }

            await Appointment.findByIdAndDelete(appointmentId);

            // Emit socket event for appointment deletion
            try {
                const io = getIO();
                io.to(`user_${clientId}`).emit('appointmentStatusUpdated', { _id: appointmentId, status: 'deleted' });
                io.to(`user_${lawyerId}`).emit('appointmentStatusUpdated', { _id: appointmentId, status: 'deleted' });
            } catch (emitErr) {
                console.warn('Socket emit failed:', emitErr.message);
            }

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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');
            
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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');

        // Try to emit socket event
        try {
            const io = getIO();
            io.to(`user_${updatedAppointment.client._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
            io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
        } catch (err) {
            // Socket errors shouldn't fail the request
            console.warn('Socket emit failed:', err.message);
        }

        // ✅ NOTIFICATION: If appointment was confirmed, notify BOTH lawyer and client
        if (status === 'confirmed') {
            try {
                const timeStr = new Date(updatedAppointment.dateTime).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Notification for CLIENT
                const clientNotif = new Notification({
                    recipient: updatedAppointment.client._id,
                    type: 'appointment_confirmed',
                    title: '✅ Appointment Confirmed',
                    message: `Your appointment with ${updatedAppointment.lawyer.userName} has been confirmed for ${timeStr}`,
                    relatedAppointment: updatedAppointment._id,
                    relatedUser: updatedAppointment.lawyer._id,
                    metadata: {
                        appointmentDateTime: updatedAppointment.dateTime,
                        lawyerName: updatedAppointment.lawyer.userName,
                        clientName: updatedAppointment.client.userName
                    }
                });

                // Notification for LAWYER
                const lawyerNotif = new Notification({
                    recipient: updatedAppointment.lawyer._id,
                    type: 'appointment_confirmed',
                    title: '✅ Appointment Confirmed',
                    message: `Your appointment with ${updatedAppointment.client.userName} has been confirmed for ${timeStr}`,
                    relatedAppointment: updatedAppointment._id,
                    relatedUser: updatedAppointment.client._id,
                    metadata: {
                        appointmentDateTime: updatedAppointment.dateTime,
                        lawyerName: updatedAppointment.lawyer.userName,
                        clientName: updatedAppointment.client.userName
                    }
                });

                await Promise.all([clientNotif.save(), lawyerNotif.save()]);

                // Emit real-time notifications to both parties
                try {
                    const io = getIO();
                    const populatedClientNotif = await Notification.findById(clientNotif._id)
                        .populate('relatedUser', 'userName profilePic');
                    const populatedLawyerNotif = await Notification.findById(lawyerNotif._id)
                        .populate('relatedUser', 'userName profilePic');
                    
                    io.to(`user_${updatedAppointment.client._id.toString()}`).emit('notificationCreated', populatedClientNotif);
                    io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('notificationCreated', populatedLawyerNotif);
                } catch (emitErr) {
                    console.warn('Failed to emit confirmation notifications:', emitErr.message);
                }

                // Send emails to both parties
                if (updatedAppointment.client.email) {
                    const subject = 'Your Appointment Has Been Confirmed';
                    const html = `<p>Dear ${updatedAppointment.client.userName},</p>
                        <p>Your appointment with ${updatedAppointment.lawyer.userName} has been <strong>confirmed</strong>.</p>
                        <p><strong>Scheduled time:</strong> ${timeStr}</p>
                        <p>Please log in to your account for details.</p>
                        <p>Regards,<br/>Law-Aid</p>`;
                    sendEmail({ to: updatedAppointment.client.email, subject, html }).catch(e => console.warn('Email send failed:', e));
                }

                if (updatedAppointment.lawyer.email) {
                    const subject = 'Appointment Confirmed';
                    const html = `<p>Dear ${updatedAppointment.lawyer.userName},</p>
                        <p>Your appointment with ${updatedAppointment.client.userName} has been <strong>confirmed</strong>.</p>
                        <p><strong>Scheduled time:</strong> ${timeStr}</p>
                        <p>Please be prepared for the consultation.</p>
                        <p>Regards,<br/>Law-Aid</p>`;
                    sendEmail({ to: updatedAppointment.lawyer.email, subject, html }).catch(e => console.warn('Email send failed:', e));
                }
            } catch (nerr) {
                console.warn('Failed to create confirmation notifications:', nerr);
            }
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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');
            
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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');

        // ✅ NOTIFICATION: Notify client about reschedule proposal
        try {
            const originalTimeStr = new Date(updatedAppointment.dateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const proposedTimeStr = new Date(proposedDate).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const notif = new Notification({
                recipient: updatedAppointment.client._id,
                type: 'general',
                title: '🔄 Reschedule Proposed',
                message: `${updatedAppointment.lawyer.userName} has proposed to reschedule your appointment to ${proposedTimeStr}${rescheduleReason ? `: "${rescheduleReason}"` : ''}`,
                relatedAppointment: updatedAppointment._id,
                relatedUser: updatedAppointment.lawyer._id,
                metadata: {
                    originalAppointmentDateTime: updatedAppointment.dateTime,
                    proposedAppointmentDateTime: proposedDate,
                    proposedDateTime: proposedDate,
                    lawyerName: updatedAppointment.lawyer.userName,
                    clientName: updatedAppointment.client.userName,
                    rescheduleReason: rescheduleReason || ''
                }
            });

            await notif.save();

            // Emit socket event to notify client
            try {
                const io = getIO();
                const populatedNotif = await Notification.findById(notif._id)
                    .populate('relatedUser', 'userName profilePic');
                
                io.to(`user_${updatedAppointment.client._id.toString()}`).emit('notificationCreated', populatedNotif);
                io.to(`user_${updatedAppointment.client._id.toString()}`).emit('rescheduleProposed', {
                    appointmentId: updatedAppointment._id,
                    lawyerName: updatedAppointment.lawyer.userName,
                    currentDateTime: updatedAppointment.dateTime,
                    proposedDateTime: proposedDate,
                    rescheduleReason: rescheduleReason
                });
            } catch (emitErr) {
                console.warn('Socket emit failed:', emitErr.message);
            }

            // Send email to client
            if (updatedAppointment.client.email) {
                const subject = 'Appointment Reschedule Proposed';
                const html = `<p>Dear ${updatedAppointment.client.userName},</p>
                    <p>${updatedAppointment.lawyer.userName} has proposed a new time for your appointment.</p>
                    <p><strong>Current scheduled time:</strong> ${originalTimeStr}</p>
                    <p><strong>Proposed time:</strong> ${proposedTimeStr}</p>
                    ${rescheduleReason ? `<p><strong>Reason:</strong> ${rescheduleReason}</p>` : ''}
                    <p>Please log in to your account to accept or decline the proposal.</p>
                    <p>Regards,<br/>Law-Aid</p>`;
                sendEmail({ to: updatedAppointment.client.email, subject, html }).catch(e => console.warn('Email send failed:', e));
            }
        } catch (nerr) {
            console.warn('Failed to create reschedule notification:', nerr);
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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');
            
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found!" });
        }

        // Check if user is the client of this appointment
        if (appointment.client._id.toString() !== userId) {
            return res.status(403).json({ message: "Only the client can respond to reschedule" });
        }

        // Check if there's a pending reschedule
        if (!appointment.proposedDateTime) {
            return res.status(400).json({ message: "No pending reschedule for this appointment" });
        }

        const oldDateTime = appointment.dateTime;
        const proposedDateTime = appointment.proposedDateTime;

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
            .populate('lawyer', 'userName profilePic email')
            .populate('client', 'userName email');

        // ✅ NOTIFICATION: Notify lawyer about client's response
        try {
            const timeStr = new Date(response === "accepted" ? updatedAppointment.dateTime : oldDateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const notif = new Notification({
                recipient: updatedAppointment.lawyer._id,
                type: 'general',
                title: response === "accepted" ? '✅ Reschedule Accepted' : '❌ Reschedule Declined',
                message: response === "accepted" 
                    ? `${updatedAppointment.client.userName} has accepted the reschedule. New time: ${timeStr}`
                    : `${updatedAppointment.client.userName} has declined the reschedule proposal`,
                relatedAppointment: updatedAppointment._id,
                relatedUser: updatedAppointment.client._id,
                metadata: {
                    appointmentDateTime: updatedAppointment.dateTime,
                    originalDateTime: oldDateTime,
                    proposedDateTime: proposedDateTime,
                    response: response,
                    lawyerName: updatedAppointment.lawyer.userName,
                    clientName: updatedAppointment.client.userName
                }
            });

            await notif.save();

            // Emit socket event to notify lawyer
            try {
                const io = getIO();
                const populatedNotif = await Notification.findById(notif._id)
                    .populate('relatedUser', 'userName profilePic');
                
                io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('notificationCreated', populatedNotif);
                io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('rescheduleResponded', {
                    appointmentId: updatedAppointment._id,
                    clientName: updatedAppointment.client.userName,
                    response: response,
                    newDateTime: response === "accepted" ? updatedAppointment.dateTime : null
                });
                
                // Also emit general appointment updates
                io.to(`user_${updatedAppointment.client._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
                io.to(`user_${updatedAppointment.lawyer._id.toString()}`).emit('appointmentStatusUpdated', updatedAppointment);
            } catch (emitErr) {
                console.warn('Socket emit failed:', emitErr.message);
            }

            // Send email to lawyer
            if (updatedAppointment.lawyer.email) {
                const subject = response === "accepted" ? 'Reschedule Accepted' : 'Reschedule Declined';
                const html = response === "accepted"
                    ? `<p>Dear ${updatedAppointment.lawyer.userName},</p>
                        <p>${updatedAppointment.client.userName} has <strong>accepted</strong> your reschedule proposal.</p>
                        <p><strong>New appointment time:</strong> ${timeStr}</p>
                        <p>Regards,<br/>Law-Aid</p>`
                    : `<p>Dear ${updatedAppointment.lawyer.userName},</p>
                        <p>${updatedAppointment.client.userName} has <strong>declined</strong> your reschedule proposal.</p>
                        <p><strong>Current appointment time:</strong> ${timeStr}</p>
                        <p>You may contact the client to discuss alternative times.</p>
                        <p>Regards,<br/>Law-Aid</p>`;
                sendEmail({ to: updatedAppointment.lawyer.email, subject, html }).catch(e => console.warn('Email send failed:', e));
            }
        } catch (nerr) {
            console.warn('Failed to create reschedule response notification:', nerr);
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

// Get single appointment by id (only for authenticated participants)
export const getAppointmentById = async (req, res) => {
    const { appointmentId } = req.params;

    try {
        const token = req.cookies.userToken;
        if(!token) return res.status(401).json({message: "Authentication required"});

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const appointment = await Appointment.findById(appointmentId)
            .populate('lawyer', 'userName profilePic')
            .populate('client', 'userName');

        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Only the lawyer or client can fetch this appointment
        const clientId = appointment.client?._id?.toString();
        const lawyerId = appointment.lawyer?._id?.toString();
        if (clientId !== userId && lawyerId !== userId) return res.status(403).json({ message: 'Not authorized to view this appointment' });

        return res.status(200).json({ appointment });
    } catch (error) {
        if(error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid authentication token' });
        console.error('getAppointmentById error:', error);
        return res.status(500).json({ message: 'Failed to fetch appointment', error: error.message });
    }
}