import { z } from "zod";

export const createOrganizationSchema = z.object({
    body: z.object({
        name: z.string({
            required_error: "Organization name is required",
        }).min(2, "Name must be at least 2 characters").max(150, "Name cannot exceed 150 characters"),
        website: z.string().url("Invalid website URL").max(255).optional().or(z.literal("").transform(() => undefined)),
        industry: z.string().max(100).optional(),
        description: z.string().optional()
    })
});

export const getOrganizationByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid("Invalid organization ID format")
    })
});
