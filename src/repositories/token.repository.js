import prisma from "../prisma/index.js";

export class TokenRepository {
    // Refresh Tokens
    async saveRefreshToken(data) {
        return await prisma.refresh_tokens.create({
            data: {
                user_id: data.user_id,
                token: data.token,
                device_name: data.device_name,
                device_type: data.device_type,
                ip_address: data.ip_address,
                user_agent: data.user_agent,
                expires_at: data.expires_at,
            },
        });
    }

    async findRefreshToken(token) {
        return await prisma.refresh_tokens.findUnique({
            where: { token },
        });
    }

    async revokeRefreshToken(token) {
        return await prisma.refresh_tokens.update({
            where: { token },
            data: {
                is_revoked: true,
                revoked_at: new Date(),
            },
        });
    }

    async deleteRefreshToken(token) {
        return await prisma.refresh_tokens.delete({
            where: { token },
        });
    }

    // Password Reset Tokens
    async savePasswordResetToken(data) {
        return await prisma.password_reset_tokens.create({
            data: {
                user_id: data.user_id,
                token: data.token,
                expires_at: data.expires_at,
            },
        });
    }

    async findPasswordResetToken(token) {
        return await prisma.password_reset_tokens.findUnique({
            where: { token },
        });
    }

    async markPasswordResetTokenUsed(id, ip_address) {
        return await prisma.password_reset_tokens.update({
            where: { id },
            data: {
                is_used: true,
                used_at: new Date(),
                ip_address,
            },
        });
    }

    // Email Verification Tokens
    async saveEmailVerificationToken(data) {
        return await prisma.email_verification_tokens.create({
            data: {
                user_id: data.user_id,
                token: data.token,
                expires_at: data.expires_at,
            },
        });
    }

    async findEmailVerificationToken(token) {
        return await prisma.email_verification_tokens.findUnique({
            where: { token },
        });
    }

    async markEmailVerificationTokenUsed(id, ip_address) {
        return await prisma.email_verification_tokens.update({
            where: { id },
            data: {
                is_used: true,
                used_at: new Date(),
                ip_address,
            },
        });
    }
}

export const tokenRepository = new TokenRepository();
