import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'appointment_reminder',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_request',
      'appointment_reschedule',
      'appointment_approaching',
      'feedback_request',
      'message',
      'consultation_request',
      'general'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  relatedConsultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation"
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  reminderTime: Date,
  sentTime: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  actionUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ relatedAppointment: 1, type: 1 });

// Auto-delete notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Delete expired notifications based on expiresAt field
notificationSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { expiresAt: { $exists: true } }
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;