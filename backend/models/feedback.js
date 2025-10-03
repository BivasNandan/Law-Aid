import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({

    lawyer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    client: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    rating: {type: Number, min: 1, max: 5, required: true},
    comment: String,
}, {timestamps: true} );

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;