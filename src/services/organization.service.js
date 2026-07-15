import { organizationRepository } from "../repositories/organization.repository.js";
import { ApiError } from "../utils/ApiError.js";

const generateSlug = async (name) => {
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!baseSlug) baseSlug = "org"; // fallback
    let slug = baseSlug;
    let counter = 1;
    
    while (await organizationRepository.findBySlug(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
    return slug;
};

class OrganizationService {
    async createOrganization(userId, payload) {
        const { name, website, industry, description } = payload;
        
        const slug = await generateSlug(name);

        const organization = await organizationRepository.create({
            name,
            slug,
            website,
            industry,
            description,
            owner_id: userId,
            status: "ACTIVE"
        });

        return organization;
    }

    async getOrganizations(userId) {
        return organizationRepository.findAllByOwnerId(userId);
    }

    async getOrganizationById(id, userId) {
        const organization = await organizationRepository.findById(id);
        
        if (!organization) {
            throw new ApiError(404, "Organization not found");
        }

        // Ensuring access control (assuming only owner for now as members aren't implemented)
        if (organization.owner_id !== userId) {
            throw new ApiError(403, "You do not have permission to view this organization");
        }

        return organization;
    }
}

export const organizationService = new OrganizationService();
