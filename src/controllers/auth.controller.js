import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { env } from "../config/env.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const registerUser = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    return res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const reqInfo = {
        device_name: req.headers["user-agent"],
        device_type: "UNKNOWN",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
    };

    const { user, tokens } = await authService.login(identifier, password, reqInfo);

    // Set HTTP Only Secure Cookies
    res.cookie("accessToken", tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 mins
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

    return res.status(200).json(new ApiResponse(200, { user, tokens }, "User logged in successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    const reqInfo = {
        device_name: req.headers["user-agent"],
        device_type: "UNKNOWN",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
    };

    const tokens = await authService.refreshTokens(incomingRefreshToken, reqInfo);

    res.cookie("accessToken", tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

    return res.status(200).json(new ApiResponse(200, tokens, "Access token refreshed successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    await authService.logout(incomingRefreshToken);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const resetToken = await authService.forgotPassword(email);
    
    return res.status(200).json(new ApiResponse(200, { resetToken }, "Password reset email sent"));
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { token, new_password } = req.body;
    
    await authService.resetPassword(token, new_password, req.ip);

    return res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
    const { current_password, new_password } = req.body;
    const userId = req.user.id; 
    
    await authService.changePassword(userId, current_password, new_password);

    return res.status(200).json(new ApiResponse(200, null, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    const updatedUser = await authService.updateProfile(userId, updateData);

    return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export const googleAuthRedirect = (req, res) => {
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        client_id: env.GOOGLE_CLIENT_ID,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };
    
    const qs = new URLSearchParams(options);
    res.redirect(`${rootUrl}?${qs.toString()}`);
};

export const googleAuthCallback = asyncHandler(async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).json(new ApiResponse(400, null, "Authorization code not provided"));
    }

    const reqInfo = {
        device_name: req.headers["user-agent"],
        device_type: "UNKNOWN",
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
    };

    const { tokens } = await authService.googleAuth(code, reqInfo);

    res.cookie("accessToken", tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
});

export const sendVerificationEmail = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const verificationToken = await authService.sendVerificationEmail(userId);

    // Returning token purely for dev/testing ease
    return res.status(200).json(new ApiResponse(200, { verificationToken }, "Verification email sent"));
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    await authService.verifyEmail(token, req.ip);

    return res.status(200).json(new ApiResponse(200, null, "Email verified successfully"));
});
