import prisma from "../prisma/index.js";

export class LoginHistoryRepository {
    async createLoginHistory(data) {
        return await prisma.login_history.create({
            data: {
                user_id: data.user_id,
                email: data.email,
                login_type: data.login_type,
                login_status: data.login_status,
                failure_reason: data.failure_reason,
                ip_address: data.ip_address,
                device_name: data.device_name,
                device_type: data.device_type,
                browser: data.browser,
                operating_system: data.operating_system,
                country: data.country,
                city: data.city,
                user_agent: data.user_agent,
            },
        });
    }
}

export const loginHistoryRepository = new LoginHistoryRepository();
