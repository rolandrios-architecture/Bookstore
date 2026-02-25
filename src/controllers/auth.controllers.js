// src/controllers/auth.controller.js
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

const signToken = (payload, opts = {}) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: opts.expiresIn || JWT_EXPIRES_IN });
};

export const register = async (req, res) => {
  try {
    // validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ email, passwordHash, name });
    await user.save();

    const token = signToken({ sub: user._id });
    const refreshToken = signToken({ sub: user._id }, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    user.refreshToken = refreshToken;
    await user.save();

    // Option 1: return refresh token in response body (simple)
    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ sub: user._id });
    const refreshToken = signToken({ sub: user._id }, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
      refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Missing refreshToken" });

    let payload;
    try { payload = jwt.verify(refreshToken, JWT_SECRET); }
    catch (e) { 
      console.error(e);
      return res.status(401).json({ message: "Invalid refresh token" }); 
    }

    const user = await User.findById(payload.sub);
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message: "Invalid refresh token" });

    const token = signToken({ sub: user._id });
    // optionally rotate refresh token:
    const newRefresh = signToken({ sub: user._id }, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
    user.refreshToken = newRefresh;
    await user.save();

    res.json({ token, refreshToken: newRefresh });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const me = async (req, res) => {
  // auth middleware will attach userId on req.userId
  const user = await User.findById(req.userId).select("-passwordHash -refreshToken");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user });
};

export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};