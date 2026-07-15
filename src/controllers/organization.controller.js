import { organizationService } from "../services/organization.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createOrganization = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const organization = await organizationService.createOrganization(userId, req.body);
    
    return res.status(201).json(new ApiResponse(201, organization, "Organization created successfully"));
});

export const getOrganizations = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const organizations = await organizationService.getOrganizations(userId);
    
    return res.status(200).json(new ApiResponse(200, organizations, "Organizations fetched successfully"));
});

export const getOrganizationById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const organization = await organizationService.getOrganizationById(id, userId);
    
    return res.status(200).json(new ApiResponse(200, organization, "Organization fetched successfully"));
});
