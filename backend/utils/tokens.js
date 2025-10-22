import jwt from "jsonwebtoken";

export const generateTokenForRole = (role, res) => {
    const roleToken = jwt.sign({role}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    const sameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
    const secure = process.env.NODE_ENV === 'production';

    // ensure cookie path and attributes are consistent so it can be cleared reliably
    res.cookie('roleToken', roleToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        path: '/',
        sameSite,
        secure
    });

    return roleToken;
};

export const generateTokenForUserId = (userId, res) => {
    const userToken = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

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