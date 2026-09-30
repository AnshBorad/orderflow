import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import type { SignUpInput, LoginInput } from "./schema.js";
import jwt from "jsonwebtoken";
import { config } from "../../shared/config.js";
import { redis } from "../../shared/redis.js";

const signUpService = async (input: SignUpInput) => {
    const { name, email, password } = input;

    const alreadyUser = await prisma.user.findUnique({ where: { email } });
    if (alreadyUser) throw new ApiError(409, "User already exists");

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        return await prisma.user.create({
            data: { name, email, passwordHash },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new ApiError(409, "User already exists"); // race: two signups, same ms
        }
        throw error; // anything else is NOT "already exists" — pass it honestly
    }
};


const signInService = async (input: LoginInput) => {
    const { email, password } = input;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiError(401, "Invalid email or password");
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new ApiError(401, "Invalid email or password");
    const userWithoutPassword = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userWithoutPassword);
    return {
        user: userWithoutPassword,
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}

const signOutService = async (refreshToken: string) => {

    try {
        const decodedRefreshToken = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as jwt.JwtPayload;
        
        const remainingSeconds = decodedRefreshToken.exp! - Math.floor(Date.now() / 1000);
        if (remainingSeconds > 0) {
            await redis.set(`blacklist:${refreshToken}`,"1", "EX", remainingSeconds);
        }
        return;
    } catch (error) {
        throw new ApiError(401,"Invalid token");
    }
}

const forgotPasswordService = async () => {


}

const resetPasswordService = async () => {


}

const generateAccessAndRefreshTokens = async (user: { id: string; email: string; name: string; role: string; }) => {
    if (!process.env.JWT_ACCESS_SECRET || !process.env.REFRESH_TOKEN_EXPIRY || !process.env.JWT_REFRESH_SECRET || !process.env.REFRESH_TOKEN_EXPIRY) {
        throw new ApiError(500, "Internal server error");
    }
    if (!user.id || !user.email || !user.name || !user.role) {
        throw new ApiError(401, "Invalid user");
    }
    const accessToken: string = jwt.sign(
        {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        config.JWT_ACCESS_SECRET,
        {
            expiresIn: config.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
        }
    );

    const refreshToken: string = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        config.JWT_REFRESH_SECRET,
        {
            expiresIn: config.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
        }
    );

    if (!accessToken || !refreshToken) {
        throw new ApiError(500, "Failed to generate tokens");
    }
    return { accessToken, refreshToken };


}


const getAllUsersService = async (user: { id: string; email: string; name: string; role: string; }) => {
    if (user.role == "CUSTOMER") {
        throw new ApiError(403, "Unauthorized");
    }
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return users;


}






export { signUpService, signInService, signOutService, forgotPasswordService, resetPasswordService, getAllUsersService }