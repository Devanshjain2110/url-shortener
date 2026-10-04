import jwt from "jsonwebtoken";

export default function isAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: "Token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

    } catch (err) {
        console.error("Error verifying token:", err);
        return res.status(401).json({ error: "Invalid token" });
    }
    next();
}