import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import Admin from '../models/admin.js';
import { generateTokenForUserId, generateTokenForRole } from '../utils/tokens.js';

// Your existing functions (assigningRole, register, etc.) remain the same
// I'm only adding/modifying the login and related functions

// FIXED LOGIN - with proper admin token handling
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // CHECK IF THIS IS ADMIN LOGIN
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log('🔐 Admin login detected');
      
      // Find or create Admin record
      let admin = await Admin.findOne({ email: ADMIN_EMAIL });
      if (!admin) {
        admin = new Admin({
          name: 'Site Admin',
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          phone: ''
        });
        await admin.save();
        console.log('✅ Admin record created');
      }

      // Find or create User record for admin (CRITICAL for chat/socket)
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });
      if (!adminUser) {
        let userName = 'admin';
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
          userName = `admin_${Date.now()}`;
        }
        
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        
        adminUser = new User({
          userName,
          email: ADMIN_EMAIL,
          password: hashedPassword, // Use hashed password
          role: 'admin',
          firstName: 'Site',
          lastName: 'Admin'
        });
        await adminUser.save();
        console.log('✅ Admin User record created');
      }

      // CRITICAL FIX: Generate userToken (not just roleToken) for socket authentication
      const userToken = generateTokenForUserId(
        adminUser._id.toString(),
        'admin',
        ADMIN_EMAIL,
        res
      );

      // Also generate roleToken for admin-specific routes
      const roleToken = generateTokenForRole(
        'admin',
        adminUser._id.toString(),
        ADMIN_EMAIL,
        res
      );

      // Return comprehensive admin data
      const adminData = {
        _id: adminUser._id,
        userName: adminUser.userName,
        email: admin.email,
        role: 'admin',
        name: admin.name,
        phone: admin.phone || '',
        profilePic: admin.profilePic || adminUser.profilePic,
        firstName: 'Site',
        lastName: 'Admin',
        createdAt: admin.createdAt
      };

      console.log('✅ Admin login successful:', adminData);
      
      return res.status(200).json({
        message: 'Admin login successful',
        user: adminData,
        token: userToken // Return userToken for consistency
      });
    }

    // REGULAR USER LOGIN (unchanged)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Clear any lingering admin cookies
    try {
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        secure: process.env.NODE_ENV === 'production'
      };
      res.clearCookie('roleToken', cookieOptions);
    } catch (e) {
      console.warn('Failed to clear roleToken cookie:', e);
    }

    // Generate token for regular user
    const userToken = generateTokenForUserId(
      user._id.toString(),
      user.role,
      user.email,
      res
    );

    const userData = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profilePic: user.profilePic,
      specialization: user.specialization,
      experience: user.experience,
      licenseNumber: user.licenseNumber,
      barCouncilNumber: user.barCouncilNumber,
      resume: user.resume,
      createdAt: user.createdAt
    };

    console.log('✅ User login successful:', userData.userName);
    
    return res.status(200).json({
      message: 'Login successful',
      user: userData,
      token: userToken
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    };

    // Clear both cookies
    res.clearCookie('userToken', cookieOptions);
    res.clearCookie('roleToken', cookieOptions);

    console.log('✅ Logout successful');
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    return res.status(500).json({ 
      message: 'Logout failed', 
      error: error.message 
    });
  }
};

// GET ME - verify token and return current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// EDIT PROFILE - handle both regular users and admin
// EDIT PROFILE - handle both regular users and admin
export const editProfile = async (req, res) => {
  try {
    // Get user from token
    const token = req.cookies?.userToken || req.cookies?.roleToken;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const userRole = decoded.role;

    console.log('editProfile: userId from token:', userId);
    console.log('editProfile: userRole:', userRole);

    // If admin, redirect to admin profile update endpoint
    if (userRole === 'admin') {
      return res.status(400).json({ 
        message: 'Please use /api/admin/profile endpoint for admin profile updates' 
      });
    }

    // Build update object from allowed fields to avoid touching password
    const allowedFields = [
      'userName', 
      'firstName', 
      'lastName', 
      'phone', 
      'age', 
      'specialization', 
      'experience', 
      'licenseNumber', 
      'barCouncilNumber'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updateData[field] = req.body[field];
      }
    });

    console.log('editProfile: updateData fields:', Object.keys(updateData));

    // Handle profile picture upload
    if (req.file) {
      console.log('editProfile: processing profile pic:', req.file.filename);
      updateData.profilePic = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: 'No fields to update' 
      });
    }

    // Use findByIdAndUpdate to avoid triggering password validation on the existing hashed password
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // This prevents password validation on update
      }
    ).select('-password').lean();

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated successfully for:', updatedUser.userName);

    return res.status(200).json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });

  } catch (error) {
    console.error('❌ Edit profile error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    // Handle specific mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Invalid or expired token. Please login again.' 
      });
    }

    return res.status(500).json({ 
      message: 'Failed to update profile', 
      error: error.message 
    });
  }
};

// Add your other existing functions here:
// assigningRole, register, setClientAdditionalInfo, setLawyerAdditionalInfo,
// getAllLawyers, getAllClients, getLawyer, getClient, filterLawyers,
// getClientById, getLawyerById, deleteAccount, changePassword

// ASSIGNING ROLE - Store selected role in session/localStorage reference (optional)
export const assigningRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['client', 'lawyer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    console.log('🎭 Role assignment:', role);

    return res.status(200).json({
      message: 'Role assigned successfully',
      role: role
    });
  } catch (error) {
    console.error('❌ Role assignment error:', error);
    return res.status(500).json({
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

// REGISTER - Create new user with role
export const register = async (req, res) => {
  try {
    const { userName, email, password, role } = req.body;

    // Validate input
    if (!userName || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    if (!role || !['client', 'lawyer'].includes(role)) {
      return res.status(400).json({ message: 'Valid role (client/lawyer) is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(409).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Create new user with role
    const newUser = new User({
      userName,
      email,
      password, // Will be hashed by schema pre-save hook
      role: role, // Set role: 'client' or 'lawyer'
      firstName: '',
      lastName: '',
      phone: ''
    });

    await newUser.save();

    console.log(`✅ User registered as ${role}:`, userName);

    // Return user data without password
    const userData = {
      _id: newUser._id,
      userName: newUser.userName,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName
    };

    return res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: userData,
      role: newUser.role
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return res.status(500).json({
      message: 'Registration failed',
      error: error.message
    });
  }
};

// SET CLIENT ADDITIONAL INFO - Complete client profile
// Replace your setClientAdditionalInfo function with this improved version

export const setClientAdditionalInfo = async (req, res) => {
  try {
    const { _id: bodyId, firstName, lastName, phone, age } = req.body;

    console.log('setClientAdditionalInfo called');
    console.log('   Body keys:', Object.keys(req.body));
    console.log('   Body _id:', bodyId);
    console.log('   Has file:', !!req.file);

    let userId = bodyId;

    // If userId not in body, try to get from token
    if (!userId) {
      console.log('   No _id in body, trying to get from token...');
      try {
        const token = req.cookies?.userToken || req.cookies?.roleToken;
        
        if (!token) {
          console.log('   ❌ No token found in cookies');
          return res.status(401).json({ 
            message: 'Authentication required. Please login again.' 
          });
        }

        console.log('   Token found, verifying...');
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        
        userId = decoded.userId;
        console.log('   ✅ UserId resolved from token:', userId);
      } catch (tokErr) {
        console.error('   ❌ Token verification failed:', tokErr.message);
        return res.status(401).json({ 
          message: 'Invalid or expired token. Please login again.',
          error: tokErr.message 
        });
      }
    }

    if (!userId) {
      console.log('   ❌ No userId available');
      return res.status(400).json({ 
        message: 'User ID is required. Please provide _id or login.' 
      });
    }

    console.log('   🔍 Looking for user:', userId);
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('   ❌ User not found in database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('   ✅ User found:', user.userName, 'Role:', user.role);

    // Verify user is a client
    if (user.role !== 'client') {
      console.log('   ❌ User is not a client, role:', user.role);
      return res.status(400).json({ 
        message: 'Only clients can set client additional info' 
      });
    }

    // Build update object - only include fields that are being updated
    const updateData = {};
    if (firstName) {
      updateData.firstName = firstName;
      console.log('      firstName:', firstName);
    }
    if (lastName) {
      updateData.lastName = lastName;
      console.log('      lastName:', lastName);
    }
    if (phone) {
      updateData.phone = phone;
      console.log('      phone:', phone);
    }
    if (age) {
      updateData.age = age;
      console.log('      age:', age);
    }

    // Handle profile picture upload
    if (req.file) {
      console.log('   📸 Processing profile picture...');
      console.log('      filename:', req.file.filename);
      console.log('      path:', req.file.path);
      console.log('      size:', req.file.size);
      
      updateData.profilePic = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date()
      };
    }

    console.log('   💾 Updating user...');
    // Use findByIdAndUpdate to avoid password validation during update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').lean();

    console.log('   ✅ Client profile updated successfully');

    return res.status(200).json({
      message: 'Client profile completed successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Set client additional info error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    if (error.stack) {
      console.error('   Stack trace:', error.stack);
    }
    
    return res.status(500).json({
      message: 'Failed to update client information',
      error: error.message || String(error),
      type: error.name
    });
  }
};

// SET LAWYER ADDITIONAL INFO - Complete lawyer profile
export const setLawyerAdditionalInfo = async (req, res) => {
  try {
    const { _id: bodyId, firstName, lastName, phone, age, specialization, experience, licenseNumber, barCouncilNumber } = req.body;

    console.log('setLawyerAdditionalInfo called, body keys:', Object.keys(req.body));

    let userId = bodyId;
    if (!userId) {
      try {
        const token = req.cookies?.userToken || req.cookies?.roleToken;
        if (token) {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
          console.log('setLawyerAdditionalInfo: resolved userId from token:', userId);
        }
      } catch (tokErr) {
        console.warn('setLawyerAdditionalInfo: failed to decode token', tokErr?.message || tokErr);
      }
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify user is a lawyer
    if (user.role !== 'lawyer') {
      return res.status(400).json({ message: 'Only lawyers can set lawyer additional info' });
    }

    // Build update object - only include fields that are being updated
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (age) updateData.age = age;
    if (specialization) updateData.specialization = specialization;
    if (experience) updateData.experience = experience;
    if (licenseNumber) updateData.licenseNo = licenseNumber;
    if (barCouncilNumber) updateData.barCouncilNumber = barCouncilNumber;

    // Handle file uploads
    if (req.files) {
      // Profile picture
      if (req.files.profilePic && req.files.profilePic[0]) {
        const profileFile = req.files.profilePic[0];
        updateData.profilePic = {
          filename: profileFile.filename,
          originalName: profileFile.originalname,
          path: profileFile.path.replace(/\\\\/g, '/'),
          mimetype: profileFile.mimetype,
          size: profileFile.size,
          uploadedAt: new Date()
        };
      }

      // Resume
      if (req.files.resume && req.files.resume[0]) {
        const resumeFile = req.files.resume[0];
        updateData.resume = {
          filename: resumeFile.filename,
          originalName: resumeFile.originalname,
          path: resumeFile.path.replace(/\\\\/g, '/'),
          mimetype: resumeFile.mimetype,
          size: resumeFile.size,
          uploadedAt: new Date()
        };
      }
    }

    // Use findByIdAndUpdate to avoid password validation during update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').lean();

    console.log('✅ Lawyer profile updated:', updatedUser.userName);

    return res.status(200).json({
      message: 'Lawyer profile completed successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Set lawyer additional info error:', error);
    if (error && error.stack) console.error(error.stack);
    return res.status(500).json({
      message: 'Failed to update lawyer information',
      error: error.message || String(error)
    });
  }
};

export const getAllLawyers = async (req, res) => {
  try {
    const lawyers = await User.find({ role: 'lawyer' }).select('-password').lean();
    
    if (!lawyers || lawyers.length === 0) {
      return res.status(200).json({ 
        message: 'No lawyers found',
        lawyers: []
      });
    }

    console.log(`✅ Retrieved ${lawyers.length} lawyers`);
    return res.status(200).json({
      message: 'Lawyers retrieved successfully',
      lawyers
    });
  } catch (error) {
    console.error('❌ Get all lawyers error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve lawyers',
      error: error.message
    });
  }
};

export const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' }).select('-password').lean();
    
    if (!clients || clients.length === 0) {
      return res.status(200).json({ 
        message: 'No clients found',
        clients: []
      });
    }

    console.log(`✅ Retrieved ${clients.length} clients`);
    return res.status(200).json({
      message: 'Clients retrieved successfully',
      clients
    });
  } catch (error) {
    console.error('❌ Get all clients error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve clients',
      error: error.message
    });
  }
};

export const getLawyer = async (req, res) => {
  try {
    const { userName } = req.params;

    if (!userName) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const lawyer = await User.findOne({ userName, role: 'lawyer' }).select('-password').lean();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    console.log('✅ Lawyer retrieved:', userName);
    return res.status(200).json(lawyer);
  } catch (error) {
    console.error('❌ Get lawyer error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve lawyer',
      error: error.message
    });
  }
};

export const getClient = async (req, res) => {
  try {
    const { userName } = req.params;

    if (!userName) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const client = await User.findOne({ userName, role: 'client' }).select('-password').lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    console.log('✅ Client retrieved:', userName);
    return res.status(200).json(client);
  } catch (error) {
    console.error('❌ Get client error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve client',
      error: error.message
    });
  }
};

export const filterLawyers = async (req, res) => {
  try {
    const { specialization, experience, minExperience, maxExperience, verified } = req.query;

    let filter = { role: 'lawyer' };

    if (specialization) {
      filter.specialization = specialization;
    }

    if (minExperience || maxExperience) {
      filter.experience = {};
      if (minExperience) filter.experience.$gte = parseInt(minExperience);
      if (maxExperience) filter.experience.$lte = parseInt(maxExperience);
    }

    if (verified === 'true') {
      filter.verified = true;
    }

    const lawyers = await User.find(filter).select('-password').lean();

    console.log(`✅ Filtered ${lawyers.length} lawyers`);
    return res.status(200).json({
      message: 'Lawyers filtered successfully',
      lawyers,
      count: lawyers.length
    });
  } catch (error) {
    console.error('❌ Filter lawyers error:', error);
    return res.status(500).json({
      message: 'Failed to filter lawyers',
      error: error.message
    });
  }
};

export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Client ID is required' });
    }

    const client = await User.findOne({ _id: id, role: 'client' }).select('-password').lean();

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    console.log('✅ Client retrieved by ID');
    return res.status(200).json({
      message: 'Client retrieved successfully',
      ...client
    });
  } catch (error) {
    console.error('❌ Get client by ID error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve client',
      error: error.message
    });
  }
};

export const getLawyerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Lawyer ID is required' });
    }

    const lawyer = await User.findOne({ _id: id, role: 'lawyer' }).select('-password').lean();

    if (!lawyer) {
      return res.status(404).json({ message: 'Lawyer not found' });
    }

    console.log('✅ Lawyer retrieved by ID');
    return res.status(200).json({
      message: 'Lawyer retrieved successfully',
      ...lawyer
    });
  } catch (error) {
    console.error('❌ Get lawyer by ID error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve lawyer',
      error: error.message
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    // Accept userId in body OR derive from authenticated token
    let { userId } = req.body || {};

    if (!userId) {
      // Try to resolve from token
      try {
        const token = req.cookies?.userToken || req.cookies?.roleToken;
        if (token) {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
          console.log('deleteAccount: resolved userId from token:', userId);
        }
      } catch (tokErr) {
        console.warn('deleteAccount: failed to decode token', tokErr?.message || tokErr);
      }
    }

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Account deleted:', user.userName);
    return res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    return res.status(500).json({
      message: 'Failed to delete account',
      error: error.message
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get userId from token instead of request body
    const token = req.cookies?.userToken || req.cookies?.roleToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('changePassword: userId from token:', userId);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        message: 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'New password must be different from current password' 
      });
    }

    // Update password (will be hashed by schema pre-save hook)
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed successfully for:', user.userName);
    
    return res.status(200).json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);

    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Invalid or expired token. Please login again.' 
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: messages 
      });
    }

    return res.status(500).json({
      message: 'Failed to change password',
      error: error.message
    });
  }
};