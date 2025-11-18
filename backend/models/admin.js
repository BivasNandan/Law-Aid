import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    phone: {
      type: String,
      default: ''
    },
    profilePic: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date
    }
  },
  { timestamps: true }
)

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Prevent password hashing twice if password wasn't actually modified
adminSchema.pre('findByIdAndUpdate', async function (next) {
  const update = this.getUpdate()
  if (update.password && !update.password.startsWith('$2')) {
    try {
      const salt = await bcrypt.genSalt(10)
      update.password = await bcrypt.hash(update.password, salt)
    } catch (error) {
      return next(error)
    }
  }
  next()
})

export default mongoose.model('Admin', adminSchema)
