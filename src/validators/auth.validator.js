import { z } from "zod";

const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
    body: z.object({
        first_name: z.string().min(1, "First name is required").max(100),
        last_name: z.string().max(100).optional(),
        username: z.string().min(3, "Username must be at least 3 characters").max(50),
        email: z.string().email("Invalid email address").max(255),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional().or(z.literal('')),
        password: passwordSchema,
        confirm_password: z.string(),
        profile_image: z.string().optional(),
        accept_terms: z.boolean().refine((val) => val === true, {
            message: "You must accept the terms and conditions",
        }),
        designation: z.string().max(100).optional(),
        bio: z.string().optional(),
    }).refine((data) => data.password === data.confirm_password, {
        message: "Passwords do not match",
        path: ["confirm_password"],
    }),
});

export const loginSchema = z.object({
    body: z.object({
        identifier: z.string().min(1, "Email or Username is required"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Reset token is required"),
        new_password: passwordSchema,
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        current_password: z.string().min(1, "Current password is required"),
        new_password: passwordSchema,
    }),
});

export const updateProfileSchema = z.object({
    body: z.object({
        first_name: z.string().min(1, "First name is required").max(100).optional(),
        last_name: z.string().max(100).optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format").optional().or(z.literal('')),
        profile_image: z.string().optional(),
        designation: z.string().max(100).optional(),
        bio: z.string().optional(),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Verification token is required"),
    }),
});
