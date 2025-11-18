import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  mimetype: String,
  size: Number
}, { _id: false });

attachmentSchema.add({ uploadedAt: { type: Date, default: Date.now } });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, trim: true },
  attachments: [attachmentSchema],
  status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  edited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

// export safely to avoid OverwriteModelError during hot-reload
export default mongoose.models.Message || mongoose.model("Message", messageSchema);