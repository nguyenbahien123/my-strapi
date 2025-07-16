import crypto from "crypto";
import axios from "axios";

const ZALO_APP_SECRET_KEY = "QBNNDQNUOD34oE5TI6Qy";

const calculateHMacSHA256 = (data: string, secretKey: string) => {
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(data);
    return hmac.digest("hex");
};

export default {
    async verifyPhone(ctx) {
        const { accessToken, zaloPhoneToken } = ctx.request.body;

        if (!accessToken || !zaloPhoneToken) {
            return ctx.badRequest("Missing accessToken or zaloPhoneToken");
        }

        // 1. Lấy phoneNumber từ zaloPhoneToken bằng axios
        const endpoint = "https://graph.zalo.me/v2.0/me/info";
        let phoneNumber;
        try {
            const response = await axios.get(endpoint, {
                headers: {
                    access_token: accessToken,
                    code: zaloPhoneToken,
                    secret_key: ZALO_APP_SECRET_KEY,
                },
            });
            phoneNumber = response.data.data.number;
        } catch (err) {
            return ctx.badRequest("Cannot get phone number from zaloPhoneToken");
        }
        if (!phoneNumber) {
            return ctx.badRequest("Phone number not found in Zalo response");
        }

        // Chuẩn hóa số điện thoại: nếu bắt đầu bằng '84' thì thay bằng '0'
        if (typeof phoneNumber === 'string' && phoneNumber.startsWith('84')) {
            phoneNumber = '0' + phoneNumber.slice(2);
        }

        // 2. Lấy zaloId từ accessToken (giống cũ)
        const appsecret_proof = calculateHMacSHA256(accessToken, ZALO_APP_SECRET_KEY);
        let zaloUser;
        try {
            const response = await axios.get("https://graph.zalo.me/v2.0/me", {
                headers: {
                    access_token: accessToken,
                    appsecret_proof,
                },
                params: {
                    fields: "id",
                },
            });
            zaloUser = response.data;
        } catch (err) {
            return ctx.badRequest("Zalo accessToken invalid or expired");
        }
        const zaloId = zaloUser.id;
        if (!zaloId) {
            return ctx.badRequest("Cannot get Zalo user id");
        }

        // 3. Tìm resident theo phoneNumber
        const resident = await strapi.db.query('api::resident.resident').findOne({
            where: { phoneNumber: phoneNumber.toString() },
        });
        if (!resident) {
            return ctx.notFound("Resident not found");
        }

        // 4. Cập nhật zaloId cho resident
        await strapi.db.query('api::resident.resident').update({
            where: { id: resident.id },
            data: { zaloId: zaloId.toString() },
        });

        // 5. Lấy lại resident mới nhất, populate users_permissions_user
        const updatedResident = await strapi.db.query('api::resident.resident').findOne({
            where: { id: resident.id },
            populate: ['users_permissions_user'],
        });
        if (!updatedResident || !updatedResident.users_permissions_user) {
            return ctx.badRequest('Resident does not have linked user');
        }
        const user = updatedResident.users_permissions_user;
        // Tạo JWT
        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id,
        });
        ctx.send({
            success: true,
            jwt,
        });
    }
};