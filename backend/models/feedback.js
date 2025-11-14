import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    lawyer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    client: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    appointment: {type: mongoose.Schema.Types.ObjectId, ref: "Appointment"},
    rating: {type: Number, min: 1, max: 5, required: true},
    comment: {type: String, default: ''},
    isVerified: {type: Boolean, default: false}
}, {timestamps: true} );

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;