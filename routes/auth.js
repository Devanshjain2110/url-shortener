import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { z } from "zod";

const router = express.Router();

const userValidation = z.object({
    email: z.email(),
    password: z.string().min(6),
});

router.post("/signup", async (req, res) => {
    const validatedData = userValidation.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid email or password" });
    }

    const { email, password } = validatedData.data;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        console.error("Error during signup:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

router.post("/login", async (req, res) => {
    const validatedData = userValidation.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid email or password" });
    }

    const { email, password } = validatedData.data;
    try {
        const checkUser = await User.findOne({ email });
        if (!checkUser) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, checkUser.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: checkUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;