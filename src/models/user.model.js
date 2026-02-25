import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash : { type: String, required: true },
    name: { type: String, default: "" },
    refreshToken: { type: String, default: null },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);