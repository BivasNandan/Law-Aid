import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({

    lawyer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    client: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    dateTime: {type: Date, required: true},
    status: {type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending"}

}, {timestamps: true});

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;