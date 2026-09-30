import { z } from "zod";

const signUpSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(72) // bcrypt's real limit
        .regex(/[A-Z]/, "Password needs an uppercase letter")
        .regex(/[0-9]/, "Password needs a number"),
});
const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(72) // bcrypt's real limit
        .regex(/[A-Z]/, "Password needs an uppercase letter")
        .regex(/[0-9]/, "Password needs a number")
        .trim(),
});



// you get the TS type FREE from the schema (one source of truth):
export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export { signUpSchema, loginSchema };