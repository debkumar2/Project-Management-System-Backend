import { userRepository } from "../repositories/user.repository.js";
import { env } from "../config/env.js";
import { tokenRepository } from "../repositories/token.repository.js";
import { loginHistoryRepository } from "../repositories/loginHistory.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { hashPassword, comparePassword } from "../utils/hash.util.js";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    generateResetToken,
    verifyResetToken,
    generateVerificationToken,
    verifyVerificationToken
} from "../utils/jwt.util.js";

export class AuthService {
    async register(data) {
        // Check if email or username already exists
        const existingEmail = await userRepository.findByEmail(data.email);
        if (existingEmail) {
            throw new ApiError(409, "User with this email already exists");
        }

        const existingUsername = await userRepository.findByUsername(data.username);
        if (existingUsername) {
            throw new ApiError(409, "Username is already taken");
        }

        const hashedPassword = await hashPassword(data.password);

        const newUser = await userRepository.createUser({
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            email: data.email,
            phone: data.phone || null,
            password_hash: hashedPassword,
            profile_image: data.profile_image || null,
            designation: data.designation || null,
            bio: data.bio || null,
        });

        const { password_hash, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    async login(identifier, password, reqInfo) {
        // Find user by email or username
        let user = await userRepository.findByEmail(identifier);
        if (!user) {
            user = await userRepository.findByUsername(identifier);
        }

        if (!user) {
            await loginHistoryRepository.createLoginHistory({
                email: identifier,
                login_type: "EMAIL_PASSWORD",
                login_status: "FAILED",
                failure_reason: "User not found",
                ...reqInfo,
            });
            throw new ApiError(401, "Invalid email/username or password");
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            await loginHistoryRepository.createLoginHistory({
                user_id: user.id,
                email: user.email,
                login_type: "EMAIL_PASSWORD",
                login_status: "FAILED",
                failure_reason: "Invalid password",
                ...reqInfo,
            });
            throw new ApiError(401, "Invalid email/username or password");
        }

        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await tokenRepository.saveRefreshToken({
            user_id: user.id,
            token: refreshToken,
            device_name: reqInfo.device_name,
            device_type: reqInfo.device_type,
            ip_address: reqInfo.ip_address,
            user_agent: reqInfo.user_agent,
            expires_at: expiresAt,
        });

        await loginHistoryRepository.createLoginHistory({
            user_id: user.id,
            email: user.email,
            login_type: "EMAIL_PASSWORD",
            login_status: "SUCCESS",
            ...reqInfo,
        });

        const { password_hash, ...userWithoutPassword } = user;
        
        return {
            user: userWithoutPassword,
            tokens: { accessToken, refreshToken }
        };
    }

    async refreshTokens(oldRefreshToken, reqInfo) {
        if (!oldRefreshToken) {
            throw new ApiError(401, "Refresh token is required");
        }

        let payload;
        try {
            payload = verifyRefreshToken(oldRefreshToken);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired refresh token");
        }

        const tokenRecord = await tokenRepository.findRefreshToken(oldRefreshToken);
        if (!tokenRecord) throw new ApiError(401, "Refresh token not found");
        if (tokenRecord.is_revoked) throw new ApiError(401, "Refresh token has been revoked");

        const user = await userRepository.findById(payload.id);
        if (!user) throw new ApiError(404, "User not found");

        await tokenRepository.revokeRefreshToken(oldRefreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await tokenRepository.saveRefreshToken({
            user_id: user.id,
            token: newRefreshToken,
            device_name: reqInfo?.device_name,
            device_type: reqInfo?.device_type,
            ip_address: reqInfo?.ip_address,
            user_agent: reqInfo?.user_agent,
            expires_at: expiresAt,
        });

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }

    async logout(refreshToken) {
        if (!refreshToken) return;
        await tokenRepository.revokeRefreshToken(refreshToken);
    }

    async forgotPassword(email) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new ApiError(404, "User with this email does not exist");
        }

        const resetToken = generateResetToken(user.id);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 mins

        await tokenRepository.savePasswordResetToken({
            user_id: user.id,
            token: resetToken,
            expires_at: expiresAt,
        });

        // TODO: Send email with reset token link
        // return resetToken purely for testing if no mail service is integrated yet
        return resetToken;
    }

    async resetPassword(token, newPassword, ipAddress) {
        let payload;
        try {
            payload = verifyResetToken(token);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired reset token");
        }

        const tokenRecord = await tokenRepository.findPasswordResetToken(token);
        if (!tokenRecord) throw new ApiError(401, "Reset token not found in database");
        if (tokenRecord.is_used) throw new ApiError(401, "Reset token has already been used");

        const hashedPassword = await hashPassword(newPassword);
        await userRepository.updatePassword(payload.id, hashedPassword);
        
        await tokenRepository.markPasswordResetTokenUsed(tokenRecord.id, ipAddress);
    }
    
    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findById(userId);
        if (!user) throw new ApiError(404, "User not found");

        const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
        if (!isPasswordValid) throw new ApiError(401, "Incorrect current password");

        const hashedPassword = await hashPassword(newPassword);
        await userRepository.updatePassword(userId, hashedPassword);
    }

    async updateProfile(userId, updateData) {
        const user = await userRepository.updateUser(userId, updateData);
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }

    async googleAuth(code, reqInfo) {
        const tokenUrl = "https://oauth2.googleapis.com/token";
        const values = {
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_CALLBACK_URL,
            grant_type: "authorization_code",
        };
        
        const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(values).toString()
        });

        if (!tokenRes.ok) throw new ApiError(401, "Failed to authenticate with Google");

        const { access_token, id_token } = await tokenRes.json();

        const userRes = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
            headers: { Authorization: `Bearer ${id_token}` }
        });

        if (!userRes.ok) throw new ApiError(401, "Failed to fetch user profile from Google");

        const profile = await userRes.json();
        let user = await userRepository.findByEmail(profile.email);

        if (!user) {
            user = await userRepository.createUser({
                first_name: profile.given_name,
                last_name: profile.family_name || "",
                username: profile.email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
                email: profile.email,
                password_hash: "", 
                profile_image: profile.picture,
                is_email_verified: true, 
            });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await tokenRepository.saveRefreshToken({
            user_id: user.id,
            token: refreshToken,
            device_name: reqInfo.device_name,
            device_type: reqInfo.device_type,
            ip_address: reqInfo.ip_address,
            user_agent: reqInfo.user_agent,
            expires_at: expiresAt,
        });

        await loginHistoryRepository.createLoginHistory({
            user_id: user.id,
            email: user.email,
            login_type: "GOOGLE",
            login_status: "SUCCESS",
            ...reqInfo,
        });

        const { password_hash, ...userWithoutPassword } = user;
        
        return { user: userWithoutPassword, tokens: { accessToken, refreshToken } };
    }

    async sendVerificationEmail(userId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
        if (user.is_email_verified) throw new ApiError(400, "Email is already verified");

        const verificationToken = generateVerificationToken(user.id);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

        await tokenRepository.saveEmailVerificationToken({
            user_id: user.id,
            token: verificationToken,
            expires_at: expiresAt,
        });

        // TODO: Integrate actual email service (Nodemailer, AWS SES, SendGrid)
        return verificationToken;
    }

    async verifyEmail(token, ipAddress) {
        let payload;
        try {
            payload = verifyVerificationToken(token);
        } catch (error) {
            throw new ApiError(401, "Invalid or expired verification token");
        }

        const tokenRecord = await tokenRepository.findEmailVerificationToken(token);
        if (!tokenRecord) throw new ApiError(401, "Verification token not found");
        if (tokenRecord.is_used) throw new ApiError(401, "Token has already been used");

        await userRepository.markEmailAsVerified(payload.id);
        await tokenRepository.markEmailVerificationTokenUsed(tokenRecord.id, ipAddress);
    }
}

export const authService = new AuthService();
