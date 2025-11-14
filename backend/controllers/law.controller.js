import jwt from "jsonwebtoken";
import Law from "../models/law.js";
import User from "../models/user.js";

// Middleware to check if user is admin or lawyer
const isAdminOrLawyer = async (req) => {
    // First try userToken (primary authentication)
    const userToken = req.cookies.userToken;
    if (userToken) {
        try {
            const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user && (user.role === "admin" || user.role === "lawyer")) {
                req.user = { id: decoded.userId, role: user.role };
                return true;
            }
        } catch (error) {
            // Continue to check roleToken
        }
    }

    // Fallback to roleToken (secondary authentication)
    const roleToken = req.cookies.roleToken;
    if (roleToken) {
        try {
            const decoded = jwt.verify(roleToken, process.env.JWT_SECRET);
            return decoded.role === "admin" || decoded.role === "lawyer";
        } catch (error) {
            return false;
        }
    }

    return false;
};

export const createLaw = async (req, res) => {
    if (!(await isAdminOrLawyer(req))) {
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
    if (!(await isAdminOrLawyer(req))) {
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
    if (!(await isAdminOrLawyer(req))) {
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

// Get all laws
export const getLaw = async (req, res) => {
    try {
        const laws = await Law.find().sort({ _id: -1 });
        if(!laws || laws.length === 0) return res.status(404).json( {message: "No law found!"} );

        return res.status(200).json(laws);
    } catch (error) {
        res.status(400).json({message: "Internal server error", error: error.message});
    }
}

export const getLawById = async (req, res) => {
    try {
        const law = await Law.findById(req.params.id);
        if(!law) return res.status(404).json( {message: "No law found!"} );
        return res.status(200).json(law);
    } catch (error) {
        return res.status(400).json({message: "Internal server error", error: error.message});
    }
}

// Filter laws based on query parameters
export const filterLaws = async (req, res) => {
    try {
        const query = {};
        const { title, category, codeNumber, isVerified } = req.query;
        if (title) query.title = { $regex: title, $options: "i" };
        if (category) query.category = category;
        if (codeNumber) query.codeNumber = codeNumber;
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';

        const laws = await Law.find(query)
            .populate('verifiedBy', 'userName')
            .populate('createdBy', 'userName')
            .sort({ updatedAt: -1 });
        if (!laws || laws.length === 0) return res.status(404).json({ message: "No laws found!" });

        return res.status(200).json(laws);
    } catch (error) {
        return res.status(400).json({ message: "Internal server error", error: error.message });
    }
};

// Return distinct categories that have at least one law
export const getCategories = async (req, res) => {
    try {
        // Use aggregation to get only categories that have laws
        const categoriesWithLaws = await Law.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: 1 } }
        ]);

        // Extract just the category names
        const categories = categoriesWithLaws.map(cat => cat._id);
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to get categories', error: error.message });
    }
};

// Return distinct codeNumber values available in the collection
export const getCodeNumbers = async (req, res) => {
    try {
        const codes = await Law.distinct('codeNumber');
        // filter out empty/null values and sort
        const filtered = codes.filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
        return res.status(200).json(filtered);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to get code numbers', error: error.message });
    }
};