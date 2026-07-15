import prisma from "../prisma/index.js";

class OrganizationRepository {
    async create(data) {
        return prisma.organizations.create({
            data,
        });
    }

    async findBySlug(slug) {
        return prisma.organizations.findUnique({
            where: { slug }
        });
    }

    async findAllByOwnerId(ownerId) {
        return prisma.organizations.findMany({
            where: { owner_id: ownerId },
            orderBy: { created_at: "desc" }
        });
    }

    async findById(id) {
        return prisma.organizations.findUnique({
            where: { id }
        });
    }
}

export const organizationRepository = new OrganizationRepository();
