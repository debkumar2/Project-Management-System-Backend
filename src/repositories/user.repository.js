import prisma from "../prisma/index.js";

export class UserRepository {
    async findByEmail(email) {
        return await prisma.users.findUnique({
            where: { email },
        });
    }

    async findByUsername(username) {
        return await prisma.users.findUnique({
            where: { username },
        });
    }

    async findById(id) {
        return await prisma.users.findUnique({
            where: { id },
        });
    }

    async createUser(userData) {
        return await prisma.users.create({
            data: userData,
        });
    }

    async updateUser(id, updateData) {
        return await prisma.users.update({
            where: { id },
            data: updateData,
        });
    }

    async updatePassword(id, password_hash) {
        return await prisma.users.update({
            where: { id },
            data: { password_hash },
        });
    }

    async markEmailAsVerified(id) {
        return await prisma.users.update({
            where: { id },
            data: { is_email_verified: true },
        });
    }
}

export const userRepository = new UserRepository();
