
import bcrypt from 'bcryptjs'
import Admin from '../models/admin.js'
import User from '../models/user.js'
import Conversation from '../models/conversation.js'
import Consultation from '../models/consultation.js'

// Helper: ensure a corresponding User exists for admin env user
const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL
  if (!email) return null
  let user = await User.findOne({ email })
  if (!user) {
    const pwd = process.env.ADMIN_PASSWORD || 'Admin@1234'
    // create a userName 'admin' (if taken, append timestamp)
    let userName = 'admin'
    if (await User.findOne({ userName })) {
      userName = `admin_${Date.now()}`
    }
    user = new User({ userName, email, password: pwd, role: 'admin', firstName: 'Site', lastName: 'Admin' })
    await user.save()
  }
  return user
}

// Get admin profile by email or ID
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL }).select('-password')
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' })
    }
    return res.status(200).json(admin)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch admin profile', error: error.message })
  }
}

// Public-safe admin profile for clients (no admin auth required)
export const getPublicAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findOne({ email: process.env.ADMIN_EMAIL }).lean()
    const adminUser = await ensureAdminUser()

    if (!admin && !adminUser) {
      return res.status(404).json({ message: 'Admin profile not found' })
    }

    const profilePic = admin?.profilePic || adminUser?.profilePic || null

    const payload = {
      _id: adminUser?._id || null,
      userName: adminUser?.userName || 'admin',
      email: admin?.email || adminUser?.email || process.env.ADMIN_EMAIL,
      role: 'admin',
      name: admin?.name || 'Admin',
      phone: admin?.phone || '',
      profilePic
    }

    return res.status(200).json(payload)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch admin profile', error: error.message })
  }
}

// Create or update admin profile
export const createOrUpdateAdminProfile = async (req, res) => {
  try {
    const { name, phone } = req.body
    const email = process.env.ADMIN_EMAIL

    if (!email) {
      return res.status(400).json({ message: 'ADMIN_EMAIL env var not set' })
    }

    let admin = await Admin.findOne({ email })

    if (!admin) {
      // Create new admin profile if it doesn't exist
      admin = new Admin({
        name: name || 'Admin',
        email,
        phone: phone || '',
        password: process.env.ADMIN_PASSWORD || 'defaultPassword123'
      })
    } else {
      // Update existing admin profile
      if (name) admin.name = name
      if (phone !== undefined) admin.phone = phone
    }

    // Handle profile picture upload
    if (req.file) {
      const file = req.file
      admin.profilePic = {
        filename: file.filename,
        originalName: file.originalname,
        path: (file.path || '').replace(/\\\\/g, '/'),
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: new Date()
      }
    }

    await admin.save()
    // Ensure there's a corresponding User record so admin can participate in chats
    try {
      const adminUser = await ensureAdminUser()
      if (adminUser) {
        // update profile pic/phone/name into User as well
        adminUser.firstName = admin.name || adminUser.firstName
        adminUser.phone = admin.phone || adminUser.phone
        if (admin.profilePic) {
          adminUser.profilePic = admin.profilePic
        }
        await adminUser.save()
      }
    } catch (e) {
      console.warn('Failed to sync admin User record:', e.message)
    }
    const adminObj = admin.toObject()
    delete adminObj.password
    return res.status(200).json({ message: 'Admin profile updated', admin: adminObj })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update admin profile', error: error.message })
  }
}

// List consultations / legal-advise requests for admin dashboard
export const getLegalAdviseRequests = async (req, res) => {
  try {
    // Return consultations that are active; populate client info and conversation (if any)
    const consultations = await Consultation.find({})
      .sort({ createdAt: -1 })
      .populate('client', 'userName email profilePic')
      .populate('lawyer', 'userName email profilePic')
      .lean()

    // Attach conversation info if available
    for (const c of consultations) {
      if (c.conversationId) {
        const conv = await Conversation.findById(c.conversationId).select('_id lastMessage').populate({ path: 'lastMessage', populate: { path: 'sender', select: 'userName' } })
        c.conversation = conv
      }
    }

    return res.status(200).json(consultations)
  } catch (err) {
    return res.status(500).json({ message: 'Failed to get legal-advise requests', error: err.message })
  }
}

// Admin starts/opens a conversation with a client
export const startAdminClientConversation = async (req, res) => {
  try {
    const { clientId } = req.body
    if (!clientId) return res.status(400).json({ message: 'clientId required' })

    const adminUser = await ensureAdminUser()
    if (!adminUser) return res.status(500).json({ message: 'Admin user not available' })

    // find existing direct conversation
    let conv = await Conversation.findOne({ type: 'direct', participants: { $all: [adminUser._id, clientId] } })
    if (!conv) {
      conv = new Conversation({ type: 'direct', participants: [adminUser._id, clientId] })
      await conv.save()
    }

    return res.status(200).json(conv)
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

// Change admin password
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const email = process.env.ADMIN_EMAIL

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Update password
    admin.password = newPassword
    await admin.save()

    return res.status(200).json({ message: 'Admin password changed successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to change admin password', error: error.message })
  }
}
