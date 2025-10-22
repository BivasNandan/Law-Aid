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

    const { firstName, lastName, phone, age } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found!" });
    if (user.role !== "client") return res.status(400).json({ message: "User is not a client!" });

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (age !== undefined) user.age = age;

    // Profile pic upload - FIX: Check req.files correctly
    if (req.files && req.files.profilePic && req.files.profilePic.length > 0) {
      const file = req.files.profilePic[0];
      user.profilePic = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      };
    }

    await user.save({ validateModifiedOnly: true });
    return res.status(200).json({ message: "Client details updated.", userId: user._id });  

  } catch (error) {
    console.error("setClientAdditionalInfo error:", error);
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
            visitingHours,
            experience,
            phone,
            age
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });
        if (user.role !== "lawyer") return res.status(400).json({ message: "User is not a lawyer." });

        const missingFields = [];
        if (!specialization) missingFields.push("specialization");
        if (!licenseNo) missingFields.push("licenseNo");
        if (!chamberAddress) missingFields.push("chamberAddress");

        if (missingFields.length > 0) {
            return res.status(400).json({ message: "Missing required fields", fields: missingFields });
        }

        // Update fields
        user.specialization = specialization;
        user.licenseNo = licenseNo;
        user.chamberAddress = chamberAddress;
        if (visitingHours !== undefined) user.visitingHours = visitingHours;
        if (experience !== undefined) user.experience = experience;
        if (phone !== undefined) user.phone = phone;
        if (age !== undefined) user.age = age;
        
        // Handle profilePic from req.files
        if (req.files && req.files.profilePic && req.files.profilePic.length > 0) {
            const profilePicFile = req.files.profilePic[0];
            user.profilePic = {
                filename: profilePicFile.filename,
                originalName: profilePicFile.originalname,
                path: profilePicFile.path,
                mimetype: profilePicFile.mimetype,
                size: profilePicFile.size,
                uploadedAt: new Date()
            };
        }

        // Handle resume file upload
        if (req.files && req.files.resume && req.files.resume.length > 0) {
            const resumeFile = req.files.resume[0];
            user.resume = {
                filename: resumeFile.filename,
                originalName: resumeFile.originalname,
                path: resumeFile.path,
                mimetype: resumeFile.mimetype,
                size: resumeFile.size,
                uploadedAt: new Date()
            };
        }

        await user.save({ validateModifiedOnly: true });
        return res.status(200).json({ message: "Lawyer details updated.", userId: user._id });
    } catch (error) {
        console.error("setLawyerAdditionalInfo error:", error);
        return res.status(500).json({ message: "Failed to update lawyer details.", error: error.message });
    }
};

export const login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({message: "invalid credentials."});

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect) return res.status(400).json({message: "invalid credentials."});

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

export const logout = (req, res) => {
    try {
        console.log('🔐 Backend logout called');
        
        const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
        const secure = process.env.NODE_ENV === "production";

        res.clearCookie("userToken", { 
            path: "/", 
            sameSite, 
            secure,
            httpOnly: true
        });
        res.clearCookie("roleToken", { 
            path: "/", 
            sameSite, 
            secure,
            httpOnly: true 
        });
        
        console.log('✅ Cookies cleared successfully');
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error('❌ Backend logout error:', error);
        return res.status(500).json({ message: "Internal server error during logout" });
    }
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

    if (!userName) {
      return res.status(400).json({ message: "Lawyer username is required!" });
    }

    const lawyer = await User.findOne({
    role: "lawyer",
    userName: { $regex: new RegExp(`^${userName}$`, "i") }
    }).select("-password");

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found!" });
    }

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

    if (!userName) {
      return res.status(400).json({ message: "Client username is required!" });
    }

    const client = await User.findOne({
    role: "client",
    userName: { $regex: new RegExp(`^${userName}$`, "i") }
    }).select("-password");

    if (!client) {
      return res.status(404).json({ message: "Client not found!" });
    }

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

        const { userName, email, password, age, phone } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (userName !== undefined) user.userName = userName;
        if (email !== undefined) user.email = email;
        if (age !== undefined) user.age = age;
        if (phone !== undefined) user.phone = phone;
        // If a profile picture was uploaded via multer, attach it
        if (req.file) {
            const file = req.file;
            user.profilePic = {
                filename: file.filename,
                originalName: file.originalname,
                path: file.path,
                mimetype: file.mimetype,
                size: file.size,
                uploadedAt: new Date()
            };
        }
        if (password !== undefined) {
            if (password.length < 8) {
                return res.status(400).json({ message: "Password must be at least 8 characters long." });
            }
            user.password = await bcrypt.hash(password, 10);
        }

        // Only validate modified fields to avoid re-validating hashed password
        const savedUser = await user.save({ validateModifiedOnly: true });
        // Remove sensitive fields before returning
        const userObj = savedUser.toObject ? savedUser.toObject() : savedUser;
        delete userObj.password;
        return res.status(200).json(userObj);

    } catch (error) {
        console.error('editProfile error:', error);
        // Handle duplicate key errors (unique fields like email or userName)
        if (error && (error.code === 11000 || (error.message && error.message.includes('E11000')))) {
            const dupField = error.keyValue ? Object.keys(error.keyValue)[0] : 'field';
            return res.status(400).json({ message: `The ${dupField} is already in use.` });
        }
        // Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message).join('; ');
            return res.status(400).json({ message: messages });
        }
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
        
        const sameSite = process.env.NODE_ENV === "production" ? "strict" : "lax";
        const secure = process.env.NODE_ENV === "production";
        res.clearCookie("userToken", { path: "/", sameSite, secure });
        res.clearCookie("roleToken", { path: "/", sameSite, secure });
        return res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete account.", error: error.message });
    }
};

// Change password (requires current password)
export const changePassword = async (req, res) => {
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

                console.log('changePassword called for userId:', userId);

                const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both current and new passwords are required." });
        if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });
                // Ensure we explicitly select the password field
                const user = await User.findById(userId).select('password');
        if (!user) return res.status(404).json({ message: "User not found." });
                if (!user.password) {
                    console.error('changePassword: user has no password field set');
                    return res.status(500).json({ message: 'User password is not available.' });
                }

                let isMatch;
                try {
                    isMatch = await bcrypt.compare(currentPassword, user.password);
                } catch (cmpErr) {
                    console.error('changePassword: bcrypt.compare error', cmpErr);
                    return res.status(500).json({ message: 'Failed to verify current password.' });
                }
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

            // Assign plaintext new password and let the model pre-save hook hash it.
            user.password = newPassword;
            try {
                await user.save();
                return res.status(200).json({ message: "Password changed successfully." });
            } catch (saveErr) {
                // Handle validation errors (e.g., password strength validator)
                if (saveErr && saveErr.name === 'ValidationError') {
                    const messages = Object.values(saveErr.errors).map(e => e.message).join('; ');
                    return res.status(400).json({ message: messages });
                }
                throw saveErr;
            }
    } catch (error) {
        console.error('changePassword error:', error);
        return res.status(500).json({ message: "Failed to change password.", error: error.message });
    }
};