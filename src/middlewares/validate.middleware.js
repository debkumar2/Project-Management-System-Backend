import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        if (error.name === "ZodError" || error.errors) {
            const errors = (error.errors || error.issues || []).map((err) => ({
                field: err.path.join(".").replace(/^body\./, ""), // Clean up 'body.' prefix
                message: err.message,
            }));
            
            return next(new ApiError(400, "Validation Error", errors));
        }
        
        return next(error);
    }
};
