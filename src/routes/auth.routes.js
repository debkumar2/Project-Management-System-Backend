import { Router } from "express";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    changePassword,
    getCurrentUser,
    updateProfile,
    googleAuthRedirect,
    googleAuthCallback,
    sendVerificationEmail,
    verifyEmail
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    updateProfileSchema,
    verifyEmailSchema
} from "../validators/auth.validator.js";

const router = Router();

// Public routes
router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);

router.get("/google", googleAuthRedirect);
router.get("/google/callback", googleAuthCallback);

// Protected routes (require authentication)
router.use(authenticate); 

router.post("/change-password", validate(changePasswordSchema), changePassword);
router.post("/send-verification", sendVerificationEmail);
router.get("/me", getCurrentUser);
router.put("/profile", validate(updateProfileSchema), updateProfile);

export default router;
