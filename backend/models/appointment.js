import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({

    lawyer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    client: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    dateTime: {type: Date, required: true},
    status: {type: String, enum: ["pending", "confirmed", "cancelled", "completed"], default: "pending"},
    
    // Rescheduling fields
    proposedDateTime: {type: Date, default: null}, // Lawyer proposes new time
    rescheduleReason: {type: String, default: null} // Reason for rescheduling

}, {timestamps: true});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;