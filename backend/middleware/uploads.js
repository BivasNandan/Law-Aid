import multer from "multer";
import path from "path";
import fs from "fs";

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
            const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type for profile picture. Only JPEG, JPG, PNG, GIF, WEBP are allowed.'), false);
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

// Configuring storage with better file naming
const createStorage = (folder) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `uploads/${folder}/`);
    },
    filename: (req, file, cb) => {
        const userPrefix = req.user ? req.user.userId : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filename = `${userPrefix}-${file.fieldname}-${uniqueSuffix}${path.extname(safeName)}`;
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
            const userPrefix = req.user ? req.user.userId : 'unknown';
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filename = `${userPrefix}-${file.fieldname}-${uniqueSuffix}${path.extname(safeName)}`;
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
  destination: () => "uploads/chat",
  filename: (req, file, cb) => cb(null, `${Date.now()}-chat${path.extname(file.originalname)}`)
});


export const uploadChatAttachments = multer({
  storage: chatStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document/;
    cb(null, allowed.test(file.mimetype));
  }
});