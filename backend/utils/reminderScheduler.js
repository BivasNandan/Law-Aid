import Appointment from "../models/appointment.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";
import sendEmail from "./email.js";

/**
 * Start the reminder scheduler which scans for confirmed appointments
 * occurring ~24 hours from now and creates/sends reminder notifications.
 *
 * @param {import('socket.io').Server} io - Socket.IO server instance
 * @param {Object} options - scheduler options
 */
// core scan function - exported so it can be invoked on-demand for testing
export async function runRemindersNow(io, intervalMinutes = 15) {
  try {
    console.log('[reminderScheduler] running scan for upcoming appointments')
    const now = new Date();
    const windowMs = intervalMinutes * 60 * 1000;
    const target = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const start = new Date(target.getTime() - windowMs);
    const end = new Date(target.getTime() + windowMs);

    const appts = await Appointment.find({
      status: 'confirmed',
      dateTime: { $gte: start, $lt: end }
    }).populate('lawyer', 'userName email profilePic').populate('client', 'userName email profilePic');

    let createdCount = 0
    console.log(`[reminderScheduler] found ${appts.length} appointment(s) in target window`)
    
    for (const appt of appts) {
      try {
        // Use proposedDateTime if it exists, otherwise use dateTime
        const appointmentTime = appt.proposedDateTime || appt.dateTime;
        const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
        const recipients = [appt.client, appt.lawyer].filter(Boolean);

        for (const r of recipients) {
          // Check if THIS specific recipient already has a reminder for THIS appointment
          const exists = await Notification.findOne({ 
            relatedAppointment: appt._id, 
            type: 'appointment_reminder',
            recipient: r._id
          });
          
          if (exists) {
            console.log(`[reminderScheduler] reminder already exists for user ${r._id} on appointment ${appt._id}`)
            continue;
          }

          // Determine if this recipient is the client or lawyer
          const isClient = r._id.toString() === appt.client._id.toString();
          const otherParty = isClient ? appt.lawyer : appt.client;

          const notif = new Notification({
            recipient: r._id,
            type: 'appointment_reminder',
            title: '⏰ Appointment Reminder',
            message: isClient 
              ? `Reminder: You have an appointment with ${otherParty.userName} tomorrow at ${new Date(appointmentTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}`
              : `Reminder: You have an appointment with your client ${otherParty.userName} tomorrow at ${new Date(appointmentTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}`,
            relatedAppointment: appt._id,
            relatedUser: otherParty._id,
            reminderTime,
            metadata: {
              appointmentDateTime: appointmentTime,
              proposedDateTime: appt.proposedDateTime,
              originalDateTime: appt.dateTime,
              lawyerName: appt.lawyer?.userName || '',
              clientName: appt.client?.userName || '',
              recipientRole: isClient ? 'client' : 'lawyer',
              otherPartyName: otherParty.userName
            }
          });

          await notif.save();
          createdCount++;

          // Populate the relatedUser before emitting
          await notif.populate('relatedUser', 'userName profilePic');

          try {
            io.to(`user_${r._id.toString()}`).emit('notificationCreated', notif);
            console.log(`[reminderScheduler] ✅ sent reminder to ${isClient ? 'client' : 'lawyer'} ${r.userName}`)
          } catch (emitErr) {
            console.warn('Failed to emit reminder notification:', emitErr.message);
          }

          try {
            const toEmail = r.email;
            if (toEmail) {
              const timeStr = new Date(appointmentTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              const subject = '⏰ Appointment Reminder - Tomorrow';
              const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4A5568;">Appointment Reminder</h2>
                <p>Dear ${r.userName || 'User'},</p>
                <p>This is a reminder that you have an appointment scheduled for <strong>tomorrow</strong>:</p>
                <div style="background-color: #FFF5E1; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>With:</strong> ${otherParty.userName}</p>
                  <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${timeStr}</p>
                  ${appt.proposedDateTime ? '<p style="margin: 5px 0; color: #F59E0B;"><em>Note: This is a rescheduled time</em></p>' : ''}
                </div>
                <p>Please be prepared and log in a few minutes before your appointment.</p>
                <p style="margin-top: 30px;">Regards,<br/><strong>Law-Aid Team</strong></p>
              </div>`;
              
              sendEmail({ to: toEmail, subject, html }).catch(e => console.warn('Reminder email failed:', e));
            }
          } catch (e) {
            console.warn('Failed to send reminder email:', e);
          }
        }
      } catch (innerErr) {
        console.warn('Failed handling appointment reminder for', appt._id, innerErr);
      }
    }

    if (createdCount > 0) {
      console.log(`[reminderScheduler] ✅ created ${createdCount} reminder notification(s)`)
    } else {
      console.log('[reminderScheduler] no new reminders to send')
    }
  } catch (err) {
    console.error('Reminder scheduler error:', err);
  }
}

export function startReminderScheduler(io, options = {}) {
  const intervalMinutes = options.intervalMinutes || 15;
  console.log(`[reminderScheduler] starting scheduler - checking every ${intervalMinutes} minutes`)
  
  // Run once immediately, then schedule
  runRemindersNow(io, intervalMinutes);
  const intervalId = setInterval(() => runRemindersNow(io, intervalMinutes), intervalMinutes * 60 * 1000);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log('[reminderScheduler] stopped');
  };
}

export default startReminderScheduler;