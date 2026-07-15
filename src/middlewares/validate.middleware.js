import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        const parsed = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        
        req.body = parsed.body;
        
        // Express defines req.query and req.params with getters, so direct assignment throws an error.
        Object.defineProperty(req, "query", {
            value: parsed.query,
            writable: true,
            configurable: true
        });
        Object.defineProperty(req, "params", {
            value: parsed.params,
            writable: true,
            configurable: true
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
