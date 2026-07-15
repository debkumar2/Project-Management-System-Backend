import { verifyAccessToken } from "../utils/jwt.util.js";
import { userRepository } from "../repositories/user.repository.js";
import prisma from "../prisma/index.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        if (process.env.NODE_ENV === "development") {
            // Bypass for local development if no token is found, to unblock frontend UI testing.
            const firstUser = await prisma.users.findFirst();
            if (firstUser) {
                req.user = firstUser;
                return next();
            }
        }
        throw new ApiError(401, "Unauthorized request: Token missing");
    }

    try {
        const decodedToken = verifyAccessToken(token);
        
        const user = await userRepository.findById(decodedToken.id);
        
        if (!user) {
            throw new ApiError(401, "Unauthorized request: User does not exist");
        }

        if (user.status !== "ACTIVE") {
            throw new ApiError(403, "User account is blocked or inactive");
        }

        // Attach user to request for downstream handlers
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid or expired access token");
    }
});
