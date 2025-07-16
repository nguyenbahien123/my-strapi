import crypto from "crypto";
import axios from "axios";

const ZALO_APP_SECRET_KEY = "QBNNDQNUOD34oE5TI6Qy";

const calculateHMacSHA256 = (data: string, secretKey: string) => {
    const hmac = crypto.createHmac("sha256", secretKey);
    hmac.update(data);
    return hmac.digest("hex");
};

export default {
    async loginByZalo(ctx) {
        const { accessToken } = ctx.request.body;
        if (!accessToken) {
            return ctx.badRequest("Missing accessToken");
        }

        // Tạo appsecret_proof
        const appsecret_proof = calculateHMacSHA256(accessToken, ZALO_APP_SECRET_KEY);

        // Gọi API Zalo để lấy id, name, avatar
        let zaloUser;
        try {
            const response = await axios.get("https://graph.zalo.me/v2.0/me", {
                headers: {
                    access_token: accessToken,
                    appsecret_proof,
                },
                params: {
                    fields: "id,name,birthday,picture",
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

        // Tìm resident theo zaloId
        const resident = await strapi.db.query('api::resident.resident').findOne({
            where: { zaloId: zaloId.toString() },
            populate: ['users_permissions_user'],
        });

        if (!resident || !resident.users_permissions_user) {
            return ctx.send({
                success: false,
                message: "Bạn cần phải thêm bước xác thực qua điện thoại",
                needPhoneVerify: true,
            }, 200);
        }

        // Cập nhật lại name và avatar nếu có dữ liệu từ Zalo
        const updateData: any = {};
        if (zaloUser.name && zaloUser.name !== resident.name) {
            updateData.name = zaloUser.name;
        }

        // Kiểm tra các trường avatar có thể có
        let avatarUrl = null;
        if (zaloUser.picture) {
            if (typeof zaloUser.picture === 'string') {
                avatarUrl = zaloUser.picture;
            } else if (zaloUser.picture.data && zaloUser.picture.data.url) {
                avatarUrl = zaloUser.picture.data.url;
            }
        }
        if (avatarUrl && avatarUrl !== resident.avatar) {
            updateData.avatar = avatarUrl;
        }

        if (Object.keys(updateData).length > 0) {
            await strapi.db.query('api::resident.resident').update({
                where: { id: resident.id },
                data: updateData,
            });
            // Lấy lại resident mới nhất để trả về
            const updatedResident = await strapi.db.query('api::resident.resident').findOne({
                where: { id: resident.id },
                populate: ['users_permissions_user'],
            });
            Object.assign(resident, updatedResident);
        }

        // Lấy user từ resident
        const user = resident.users_permissions_user;

        // Tạo JWT
        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
            id: user.id,
        });

        // Trả về giống /auth/local
        ctx.send({
            success: true,
            jwt,
        });
    }
};