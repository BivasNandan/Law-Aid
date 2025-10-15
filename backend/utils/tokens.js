import jwt from "jsonwebtoken";

export const generateTokenForRole = (role, res) => {
    const roleToken = jwt.sign({role}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("roleToken", roleToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅ FIXED
        secure: process.env.NODE_ENV === "production" // ✅ FIXED
    });

    return roleToken;
};

export const generateTokenForUserId = (userId, res) => {
    const userToken = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("userToken", userToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // ✅ FIXED
        secure: process.env.NODE_ENV === "production" // ✅ FIXED
    });

    return userToken;
};