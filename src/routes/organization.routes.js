import { Router } from "express";
import { createOrganization, getOrganizations, getOrganizationById } from "../controllers/organization.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createOrganizationSchema, getOrganizationByIdSchema } from "../validators/organization.validator.js";

const router = Router();

// Secure all organization routes
router.use(authenticate);

// Create Organization
router.post("/", validate(createOrganizationSchema), createOrganization);

// Get Organizations
router.get("/", getOrganizations);

// Get Organization by ID
router.get("/:id", validate(getOrganizationByIdSchema), getOrganizationById);

export default router;
