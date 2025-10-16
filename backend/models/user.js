import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    
    //true for all users -> admins, lawyers and clients
    firstName: String,
    lastName: String,
    userName: {type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: true,
        minlength: 8,
        validate: {
            validator: function(v) {
                // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
            },
            message: () => `Password is not strong enough!`

        }
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                // Optional field, but if provided must be 10-15 digits
                return !v || /^[0-9]{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    age: {
        type: Number,
        min: [18, "Age must be at least 18!"],
        max: [120, "Age seems invalid!"]
    },
    profilePic: {
        filename: String,        // Stored filename
        originalName: String,    // Original filename
        path: String,           // File path
        mimetype: String,       // File type
        size: Number,           // File size in bytes
        uploadedAt: {           // Upload timestamp
            type: Date,
            default: Date.now
        }
    },
    role: {type: String, enum: ["client", "lawyer", "admin"], default: "client"},
    
    //for lawyers only
    specialization: {
    type: String,
    enum: [ "Civil Law", "Criminal Law", "Family Law", "Corporate & Commercial Law", "Constitutional & Administrative Law", "International Law", "Intellectual Property Law", "Labour & Employment Law", "Environmental Law", "Human Rights Law", "Health & Medical Law", "Arbitration & ADR", "Maritime & Admiralty Law"
    ],
  },
    licenseNo: String, 
    verified: {type: Boolean, default: false},
    availability: {type: Boolean, default: false},
    chamberAddress: String,
    resume: {
        filename: String,        // Stored filename
        originalName: String,    // Original filename
        path: String,           // File path
        mimetype: String,       // File type (should be application/pdf, etc.)
        size: Number,           // File size in bytes
        uploadedAt: {           // Upload timestamp
            type: Date,
            default: Date.now
        }
    },

    visitingHours: Number,
    experience: Number,
}, {timestamps: true});

//hasing passwords before saving
userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model("User", userSchema);
export default User;