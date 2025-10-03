import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Succesfully connected to the database!");
    } catch(err) {
        console.log('Failed to connect to  the database! ', err);
        process.exit(1);
    }
}