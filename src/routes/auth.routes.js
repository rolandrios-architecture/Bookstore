import express from "express";
import { body } from "express-validator";

import {
    register,
    login,
    me,
    refresh,
    logout
} from "../controllers/auth.controllers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register",
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    register
);

router.post("/login",
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    login
);

router.get("/me", requireAuth, me);

router.post("/refresh", refresh);

router.post("/logout", requireAuth, logout);

export default router;