import Notification from '../models/notification.js';
import { getIO } from '../server/socket.js';

/**
 * Send notifications when an appointment is confirmed
 */
export async function notifyAppointmentConfirmed(appointment, clientData, lawyerData) {
  try {
    const io = getIO();
    const appointmentTime = appointment.proposedDateTime || appointment.dateTime;
    const timeStr = new Date(appointmentTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Notification for client
    const clientNotification = new Notification({
      recipient: appointment.client,
      type: 'appointment_confirmed',
      title: '✅ Appointment Confirmed',
      message: `Your appointment with ${lawyerData.userName} has been confirmed for ${timeStr}`,
      relatedAppointment: appointment._id,
      relatedUser: appointment.lawyer,
      metadata: {
        appointmentDateTime: appointmentTime,
        lawyerName: lawyerData.userName,
        lawyerSpecialization: lawyerData.specialization,
        proposedDateTime: appointment.proposedDateTime,
        originalDateTime: appointment.dateTime
      }
    });

    // Notification for lawyer
    const lawyerNotification = new Notification({
      recipient: appointment.lawyer,
      type: 'appointment_confirmed',
      title: '✅ New Appointment Confirmed',
      message: `You have a new appointment with ${clientData.userName} scheduled for ${timeStr}`,
      relatedAppointment: appointment._id,
      relatedUser: appointment.client,
      metadata: {
        appointmentDateTime: appointmentTime,
        clientName: clientData.userName,
        proposedDateTime: appointment.proposedDateTime,
        originalDateTime: appointment.dateTime
      }
    });

    // Save both notifications
    await Promise.all([
      clientNotification.save(),
      lawyerNotification.save()
    ]);

    // Populate before emitting
    await Promise.all([
      clientNotification.populate('relatedUser', 'userName profilePic specialization'),
      lawyerNotification.populate('relatedUser', 'userName profilePic')
    ]);

    // Emit real-time notifications
    io.to(`user_${appointment.client}`).emit('notificationCreated', clientNotification);
    io.to(`user_${appointment.lawyer}`).emit('notificationCreated', lawyerNotification);

    console.log(`✅ Sent confirmation notifications for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending appointment confirmation notifications:', error);
  }
}

/**
 * Send notifications when an appointment is cancelled
 */
export async function notifyAppointmentCancelled(appointment, cancelledBy, reason) {
  try {
    const io = getIO();
    const appointmentTime = appointment.proposedDateTime || appointment.dateTime;
    const timeStr = new Date(appointmentTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Determine who to notify (the other party)
    const recipientId = cancelledBy === 'client' ? appointment.lawyer : appointment.client;
    const cancellerName = cancelledBy === 'client' 
      ? appointment.client?.userName || 'Client'
      : appointment.lawyer?.userName || 'Lawyer';

    const notification = new Notification({
      recipient: recipientId,
      type: 'appointment_cancelled',
      title: '❌ Appointment Cancelled',
      message: `Your appointment scheduled for ${timeStr} has been cancelled by ${cancellerName}${reason ? `: "${reason}"` : ''}`,
      relatedAppointment: appointment._id,
      relatedUser: cancelledBy === 'client' ? appointment.client : appointment.lawyer,
      metadata: {
        appointmentDateTime: appointmentTime,
        cancelledBy,
        cancellerName,
        reason,
        proposedDateTime: appointment.proposedDateTime,
        originalDateTime: appointment.dateTime
      }
    });

    await notification.save();
    await notification.populate('relatedUser', 'userName profilePic specialization');

    io.to(`user_${recipientId}`).emit('notificationCreated', notification);

    console.log(`✅ Sent cancellation notification for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending appointment cancellation notification:', error);
  }
}

/**
 * Send notifications when a reschedule is proposed
 */
export async function notifyRescheduleProposed(appointment, proposedBy, newDateTime, reason) {
  try {
    const io = getIO();
    const newTimeStr = new Date(newDateTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Notify the other party
    const recipientId = proposedBy === 'client' ? appointment.lawyer : appointment.client;
    const proposerName = proposedBy === 'client'
      ? appointment.client?.userName || 'Client'
      : appointment.lawyer?.userName || 'Lawyer';

    const notification = new Notification({
      recipient: recipientId,
      type: 'appointment_reschedule',
      title: '🔄 Reschedule Requested',
      message: `${proposerName} has proposed to reschedule your appointment to ${newTimeStr}${reason ? `: "${reason}"` : ''}`,
      relatedAppointment: appointment._id,
      relatedUser: proposedBy === 'client' ? appointment.client : appointment.lawyer,
      metadata: {
        proposedDateTime: newDateTime,
        originalDateTime: appointment.dateTime,
        proposedBy,
        proposerName,
        rescheduleReason: reason
      }
    });

    await notification.save();
    await notification.populate('relatedUser', 'userName profilePic specialization');

    io.to(`user_${recipientId}`).emit('notificationCreated', notification);

    console.log(`✅ Sent reschedule notification for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending reschedule notification:', error);
  }
}

/**
 * Send notification when appointment time is approaching (1 hour before)
 */
export async function notifyAppointmentApproaching(appointment) {
  try {
    const io = getIO();
    const appointmentTime = appointment.proposedDateTime || appointment.dateTime;
    const timeStr = new Date(appointmentTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Notification for client
    const clientNotification = new Notification({
      recipient: appointment.client,
      type: 'appointment_approaching',
      title: '⏱️ Appointment Starting Soon',
      message: `Your appointment with ${appointment.lawyer?.userName} starts in 1 hour at ${timeStr}`,
      relatedAppointment: appointment._id,
      relatedUser: appointment.lawyer,
      metadata: {
        appointmentDateTime: appointmentTime,
        lawyerName: appointment.lawyer?.userName
      }
    });

    // Notification for lawyer
    const lawyerNotification = new Notification({
      recipient: appointment.lawyer,
      type: 'appointment_approaching',
      title: '⏱️ Appointment Starting Soon',
      message: `Your appointment with ${appointment.client?.userName} starts in 1 hour at ${timeStr}`,
      relatedAppointment: appointment._id,
      relatedUser: appointment.client,
      metadata: {
        appointmentDateTime: appointmentTime,
        clientName: appointment.client?.userName
      }
    });

    await Promise.all([
      clientNotification.save(),
      lawyerNotification.save()
    ]);

    await Promise.all([
      clientNotification.populate('relatedUser', 'userName profilePic specialization'),
      lawyerNotification.populate('relatedUser', 'userName profilePic')
    ]);

    io.to(`user_${appointment.client}`).emit('notificationCreated', clientNotification);
    io.to(`user_${appointment.lawyer}`).emit('notificationCreated', lawyerNotification);

    console.log(`✅ Sent approaching notifications for appointment ${appointment._id}`);
  } catch (error) {
    console.error('Error sending appointment approaching notifications:', error);
  }
}