import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username,
        },
        env.JWT_SECRET,
        {
            expiresIn: env.JWT_EXPIRES_IN,
        }
    );
};

export const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
        },
        env.JWT_REFRESH_SECRET,
        {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

export const generateResetToken = (userId) => {
    return jwt.sign({ id: userId }, env.RESET_PASSWORD_SECRET, { expiresIn: "15m" });
};

export const verifyResetToken = (token) => {
    return jwt.verify(token, env.RESET_PASSWORD_SECRET);
};

export const generateVerificationToken = (userId) => {
    return jwt.sign({ id: userId }, env.EMAIL_VERIFICATION_SECRET, { expiresIn: "1d" });
};

export const verifyVerificationToken = (token) => {
    return jwt.verify(token, env.EMAIL_VERIFICATION_SECRET);
};
