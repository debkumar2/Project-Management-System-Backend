import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
    let { statusCode, message } = err;
    
    statusCode = statusCode || 500;
    
    const response = {
        success: false,
        message: message || "Internal Server Error",
        errors: err.errors || [],
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
    };

    return res.status(statusCode).json(response);
};
