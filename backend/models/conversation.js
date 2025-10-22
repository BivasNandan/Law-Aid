import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  type: { type: String, enum: ["appointment", "consultation", "direct"], default: "direct" },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation" },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { timestamps: true });

conversationSchema.index({ participants: 1 });

// export safely to avoid OverwriteModelError during hot-reload
export default mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);