//this handles the login logout part for the website
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { generateTokenForRole, generateTokenForUserId } from "../utils/tokens.js";
import jwt from "jsonwebtoken";

//helps to assign roles to the users
export const assigningRole = (req, res) => {
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
        const token = req.cookies.roleToken;
        if (!token) {
            return res.status(400).json({ message: "Role token missing. Please select a role first." });
        }

        let role;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            role = decoded.role;
        } catch (error) {
            return res.status(400).json({ message: "Invalid or expired role token." });
        }

        //validating
        if( !userName || !email || !password ) {
            return res.status(400).json({message: "All fields are required!"})
        }
        if ( password.length < 8 ) {
            return res.status(400).json({message: "Password must be at least 8 characters!"})
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if( !emailRegex.test(email) ) {
            return res.status(400).json({message: "Invalid email format!"})
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email." });
        }

        //creating a new user
        const user = new User({userName, email, password, role});
        await user.save();
        generateTokenForUserId(user._id, res);
        return res.status(201).json({message: "Account created successfully.", userId: user._id, role: user.role});

    } catch (error) {
        return res.status(500).json({message: "Account creation failed!", error: error.message})
    }
}

export const setClientAdditionalInfo = async (req, res) => {
    try {
        const token = req.cookies.userToken;
        if (!token) return res.status(401).json({ message: "Authentication required." });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        const { firstName, lastName, phone, age, profilePic } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found!" });
        if (user.role !== "client") return res.status(400).json({ message: "User is not a client!" });

        // Updating only if provided; schema handles validation
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (age !== undefined) user.age = age;
        if (profilePic !== undefined) user.profilePic = profilePic;

        await user.save({ validateModifiedOnly: true });
        return res.status(200).json({ message: "Client details updated.", userId: user._id });  
    } catch (error) {
        return res.status(500).json({ message: "Failed to update client details.", error: error.message });
    }
};

export const setLawyerAdditionalInfo = async (req, res) => {
    try {
        const token = req.cookies.userToken;
        if (!token) return res.status(401).json({ message: "Authentication required." });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        const {
            specialization,
            licenseNo,
            chamberAddress,
            resume,
            visitingHours,
            experience,
            phone,
            age,
            profilePic
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.role !== "lawyer") return res.status(400).json({ message: "User is not a lawyer." });

        const missingFields = [];
        if (!specialization) missingFields.push("specialization");
        if (!licenseNo) missingFields.push("licenseNo");
        if (!chamberAddress) missingFields.push("chamberAddress");
        //if (!resume) missingFields.push("resume");

        if (missingFields.length > 0) {
            return res.status(400).json({ message: "Missing required fields", fields: missingFields });
        }

        // Update fields; schema handles phone and age validation
        user.specialization = specialization;
        user.licenseNo = licenseNo;
        user.chamberAddress = chamberAddress;
        user.resume = resume;
        if (visitingHours !== undefined) user.visitingHours = visitingHours;
        if (experience !== undefined) user.experience = experience;
        if (phone !== undefined) user.phone = phone;
        if (age !== undefined) user.age = age;
        if (profilePic !== undefined) user.profilePic = profilePic;

        await user.save({ validateModifiedOnly: true });
        return res.status(200).json({ message: "Lawyer details updated.", userId: user._id });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update lawyer details.", error: error.message });
    }
};

export const login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({message: "invalid credetintials."});

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) return res.status(400).json({message: "invalid credetintials."});

        generateTokenForUserId(user._id, res);
        
        return res.status(200).json({
            userName: user.userName,
            _id: user._id,
            role: user.role
        });
    } catch (error) {
       return res.status(500).json({message:"Internal server error", error: error.message});
    }
};

export const logout = (_, res) => {
    res.cookie("userToken", "", { maxAge: 0 });
    res.cookie("roleToken", "", { maxAge: 0 });
    return res.status(200).json({message: "Logged out successfully"});
};

//get all lawyers
export const getAllLawyers = async (req, res) => {
    try {
        const lawyers = await User.find({role: "lawyer"}).select("-password");

        return res.status(200).json({ lawyers });
    } catch (error) {
        return res.status(500).json({message: "failed to get the lawyers", error: error.message});
    }
};

//get all clients
export const getAllClients = async (req, res) => {
    try {
        const clients = await User.find({role: "client"}).select("-password");

        return res.status(200).json({ clients });
    } catch (error) {
        return res.status(500).json({message: "failed to get the clients", error: error.message});
    }
};

//shows individual lawyer details based on username
export const getLawyer = async (req, res) => {
  try {
    const { userName } = req.params;

    // Validation
    if (!userName) {
      return res.status(400).json({ message: "Lawyer username is required!" });
    }

    // Find the lawyer by username and role
    const lawyer = await User.findOne({
    role: "lawyer",
    userName: { $regex: new RegExp(`^${userName}$`, "i") }  // case-insensitive match
    }).select("-password");


    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found!" });
    }

    // Send lawyer data
    return res.status(200).json({
      _id: lawyer._id,
      userName: lawyer.userName,
      email: lawyer.email,
      verified: lawyer.verified,
      availability: lawyer.availability,
      specialization: lawyer.specialization,
      licenseNo: lawyer.licenseNo,
      experience: lawyer.experience,
      age: lawyer.age,
      phone: lawyer.phone,
      chamberAddress: lawyer.chamberAddress,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting the lawyer information",
      error: error.message,
    });
  }
};

//shows individual client details based on username
export const getClient = async (req, res) => {
  try {
    const { userName } = req.params;

    // Validation
    if (!userName) {
      return res.status(400).json({ message: "Client username is required!" });
    }

    // Find the lawyer by username and role
    const client = await User.findOne({
    role: "client",
    userName: { $regex: new RegExp(`^${userName}$`, "i") }  // case-insensitive match
    }).select("-password");


    if (!client) {
      return res.status(404).json({ message: "Client not found!" });
    }

    // Send lawyer data
    return res.status(200).json({
      _id: client._id,
      userName: client.userName,
      email: client.email,
      age: client.age,
      phone: client.phone,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error getting the client information",
      error: error.message,
    });
  }
};

// Filter lawyers based on query parameters
export const filterLawyers = async (req, res) => {
    try {
        const { specialization, minExperience, maxExperience, verified, availability, minVisitingHours, maxVisitingHours } = req.query;
        const filter = { role: "lawyer" };

        if (specialization) filter.specialization = specialization;
        if (verified !== undefined) filter.verified = verified === "true";
        if (availability !== undefined) filter.availability = availability === "true";
        if (minExperience) filter.experience = { ...filter.experience, $gte: Number(minExperience) };
        if (maxExperience) filter.experience = { ...filter.experience, $lte: Number(maxExperience) };
        if (minVisitingHours) filter.visitingHours = { ...filter.visitingHours, $gte: Number(minVisitingHours) };
        if (maxVisitingHours) filter.visitingHours = { ...filter.visitingHours, $lte: Number(maxVisitingHours) };

        const lawyers = await User.find(filter).select("-password");
        res.status(200).json(lawyers);
    } catch (error) {
        res.status(500).json({ message: "Failed to filter lawyers.", error: error.message });
    }
};

//shows individual client details based on id
export const getClientById = async (req, res) => {

    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user || user.role !== "client") {
            return res.status(404).json({ message: "Client not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }

};

//shows individual lawyer details based on id
export const getLawyerById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user || user.role !== "lawyer") {
            return res.status(404).json({ message: "Lawyer not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

//edit profile for both lawyers and clients
export const editProfile = async (req, res) => {
    try {
        const token = req.cookies.userToken;
        if (!token) return res.status(401).json({ message: "Authentication required." });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId
        } catch {
            return res.status(401).json({ message: "Invalid or expired token." });
        }

        const { userName, email, password, age, phone, profilePic } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (userName !== undefined) user.userName = userName;
        if (email !== undefined) user.email = email;
        if (age !== undefined) user.age = age;
        if (phone !== undefined) user.phone = phone;
        if (profilePic !== undefined) user.profilePic = profilePic;
        if (password !== undefined) {
            if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters long." });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        return res.status(200).json({ message: "Profile updated successfully." });

    } catch (error) {
        return res.status(500).json({ message: "Failed to update profile.", error: error.message });
    }
};

//delete account for both lawyers and clients
export const deleteAccount = async (req, res) => {
    try {
        const token = req.cookies.userToken;
        if (!token) return res.status(401).json({ message: "Authentication required." });
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId
        } catch {
            return res.status(401).json({ message: "Invalid or expired token." });
        }
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: "User not found." });
        res.cookie("userToken", "", { maxAge: 0 });
        res.cookie("roleToken", "", { maxAge: 0 });
        return res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete account.", error: error.message });
    }
};