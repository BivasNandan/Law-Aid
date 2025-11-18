import jwt from "jsonwebtoken";

// Generate token for role-based authentication (admin)
export const generateTokenForRole = (role, userId, email, res) => {
    const roleToken = jwt.sign(
        { 
            role, 
            userId, 
            email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
    );

    const sameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('roleToken', roleToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: '/',
        sameSite,
        secure
    });

    return roleToken;
};

// Generate token for user ID (regular users)
export const generateTokenForUserId = (userId, role, email, res) => {
    const userToken = jwt.sign(
        { 
            userId, 
            role, 
            email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
    );

    const sameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
    const secure = process.env.NODE_ENV === 'production';

    res.cookie('userToken', userToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: '/',
        sameSite,
        secure
    });

    return userToken;
};

// Generate BOTH tokens for admin (so they can use both regular and admin features)
export const generateAdminTokens = (userId, email, res) => {
    // Generate roleToken for admin-specific routes
    const roleToken = generateTokenForRole('admin', userId, email, res);
    
    // Also generate userToken for socket.io and regular user features
    const userToken = generateTokenForUserId(userId, 'admin', email, res);
    
    return { roleToken, userToken };
};