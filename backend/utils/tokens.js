import jwt from "jsonwebtoken";

export const generateTokenForRole = (role, res) => {
    const roleToken = jwt.sign({role}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("roleToken", roleToken,{
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, //prevents XSS attacks
        sameSite: "strict", //CSRF attacks
        secure: process.env.NODE_ENV === "development" ? false : true
    });

    return roleToken;
};

export const generateTokenForUserId = (userId, res) => {
    const userToken = jwt.sign({userId}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

    res.cookie("userToken", userToken,{
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, //prevents XSS attacks
        sameSite: "strict", //CSRF attacks
        secure: process.env.NODE_ENV === "development" ? false : true
    });

    return userToken;
};