import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";

// Ensure upload directories exist
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
ensureDir("uploads/profilePics");
ensureDir("uploads/resumes");
ensureDir("uploads/chat");

// File validation
const fileFilter = (req, file, cb) => {
    try {
        if (file.fieldname === "profilePic") {
            const allowedMimes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/pjpeg',
                'image/jfif',
                'image/heic',
                'image/heif',
                'image/avif'
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type for profile picture. Only JPEG, JPG, PNG, GIF, WEBP, HEIC/HEIF, AVIF are allowed.'), false);
            }
        } 
        else if (file.fieldname === "resume") {
            const allowedMimes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type for resume. Only PDF, DOC, DOCX are allowed.'), false);
            }
        } else {
            cb(new Error('Unexpected field'), false);
        }
    } catch (error) {
        cb(error, false);
    }
};

// Helper function to extract userId from JWT token
const getUserIdFromToken = (req) => {
    try {
        const token = req.cookies.userToken;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded.userId;
        }
    } catch (error) {
        console.warn('Token extraction error:', error.message);
        // Do not throw here - return null so multer doesn't crash during file parsing.
        // The controller will still validate authentication and userId after upload.
        return null;
    }
    return 'unknown';
};

// Configure storage with better file naming
const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `uploads/${folder}/`);
    },
    filename: (req, file, cb) => {
        // FIX: Extract userId from token instead of req.user
        const userId = getUserIdFromToken(req);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${userId}-${file.fieldname}-${uniqueSuffix}${path.extname(safeName)}`;
        cb(null, filename);
    }
});

// Multer instances
export const uploadProfilePic = multer({
    storage: createStorage('profilePics'),
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    }
});

export const uploadLawyerResume = multer({
    storage: createStorage('resumes'),
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    }
});

export const uploadBothFiles = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === "profilePic") {
                cb(null, "uploads/profilePics/");
            } else if (file.fieldname === "resume") {
                cb(null, "uploads/resumes/");
            } else {
                cb(new Error('Unexpected field'), false);
            }
        },
        filename: (req, file, cb) => {
            // FIX: Extract userId from token instead of req.user
            const userId = getUserIdFromToken(req);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filename = `${userId}-${file.fieldname}-${uniqueSuffix}${path.extname(safeName)}`;
            cb(null, filename);
        }
    }),
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB total for both files
        files: 2
    }
});
export const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `uploads/chat/`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(7);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filename = `${uniqueSuffix}-${safeName}`;
    console.log("Saving file:", filename);
    cb(null, filename);
  }
});


export const uploadChatAttachments = multer({
  storage: chatStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    console.log("File filter - filename:", file.filename, "mimetype:", file.mimetype);
    // Allow all file types
    cb(null, true);
  }
});