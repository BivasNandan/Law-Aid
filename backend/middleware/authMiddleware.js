import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.userToken;
    if (!token) return res.status(401).json({ message: "Authentication required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId, role: decoded.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};