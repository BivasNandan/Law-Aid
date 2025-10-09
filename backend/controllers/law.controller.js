import jwt from "jsonwebtoken";
import Law from "../models/law.js";

const isAdminOrLawyer = (req) => {
    const token = req.cookies.userToken;
    if (!token) return false;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded.role === "admin" || decoded.role === "lawyer";
    } catch (error){
        return false;
    }
};

export const createLaw = async (req, res) => {
    if (!isAdminOrLawyer(req)) {
        return res.status(403).json({ message: "Forbidden: Only admins and lawyers can perform this action." });
    }
    try {
        const law = new Law(req.body);
        await law.save();
        return res.status(201).json({ message: "Law created successfully", law });
    } catch (error) {
        return res.status(400).json({ message: "Error creating law", error: error.message });
    }
};

export const updateLaw = async (req, res) => {
    if (!isAdminOrLawyer(req)) {
        return res.status(403).json({ message: "Forbidden: Only admins and lawyers can perform this action." });
    }
    try {
        const law = await Law.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!law) {
            return res.status(404).json({ message: "Law not found" });
        }
        return res.status(200).json({ message: "Law updated successfully", law });
    } catch (error) {
        return res.status(400).json({ message: "Error updating law", error: error.message });
    }
};

export const deleteLaw = async (req, res) => {
    if (!isAdminOrLawyer(req)) {
        return res.status(403).json({ message: "Forbidden: Only admins and lawyers can perform this action." });
    }
    try {
        const law = await Law.findByIdAndDelete(req.params.id);
        if (!law) {
            return res.status(404).json({ message: "Law not found" });
        }
        return res.status(200).json({ message: "Law deleted successfully" });
    } catch (error) {
        return res.status(400).json({ message: "Error deleting law", error: error.message });
    }
};

export const getLaw = async (req, res) => {
    try {
        const laws = await Law.find().sort({ _id: -1 });
        if(!laws || laws.length === 0) return res.status(404).json( {message: "No law found!"} );

        return res.status(200).json(laws);
    } catch (error) {
        res.status(400).json({message: "Internal server error", error: error.message});
    }
}