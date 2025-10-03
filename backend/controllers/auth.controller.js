//this handles the login logout part for the website
import User from "../models/user.js";
import { generateTokenForRole } from "../utils/tokens.js";
import jwt from "jsonwebtoken";

//helps to assign roles to the users
export const getRole = (req, res) => {
    const { role } = req.body;
    if( !["client", "lawyer"].includes(role) ) {
        return res.status(400).json({message: "Invalid role select."})
    }

    generateTokenForRole(role, res);
    res.status(200).json({message: "Role selected", role});
}

//for both lawyers and clients
export const register = async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        const token = req.cookies.jwt;

        let role;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            role = decoded.role;
        } catch (error) {
            return res.status(400).json({ message: "Invalid or expired role token." });
        }

        //validating
        if( !userName || !email || !password ) {
            res.status(400).json({message: "All fields are required!"})
        }
        if ( password.length < 8 ) {
            res.status(400).json({message: "Password must be at least 8 characters!"})
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if( !emailRegex.test(email) ) {
            res.status(400).json({message: "Invalid email format!"})
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        //creating a new user
        const user = new User({userName, email, password, role});
        await user.save();
        res.status(201).json({message: "Account created successfully. ", userId: user._id, role: user.role});

    } catch (error) {
        res.status(500).json({message: "Account creation failed!", error: error})
    }
}

export const getLawyerDetails = async (req, res) => {
    
}