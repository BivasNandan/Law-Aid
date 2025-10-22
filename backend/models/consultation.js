import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  active: { type: Boolean, default: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
  notes: String
}, { timestamps: true });

const Consultation = mongoose.model("Consultation", consultationSchema);
export default Consultation;