import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ['appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'feedback_request', 'message', 'general'],
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
  isRead: {
    type: Boolean,
    default: false
  },
  reminderTime: Date,
  sentTime: {
    type: Date,
    default: Date.now
  },
  metadata: {
    appointmentDateTime: Date,
    lawyerName: String,
    clientName: String
  }
}, {timestamps: true});

// Create index for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
