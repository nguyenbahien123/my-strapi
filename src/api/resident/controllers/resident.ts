import { factories } from '@strapi/strapi';
import jwt from 'jsonwebtoken';

export default factories.createCoreController('api::resident.resident', ({ strapi }) => ({
    async create(ctx) {
        const { phoneNumber, name, avatar, statuscode, gender, buildings, email } = ctx.request.body.data || ctx.request.body;

        // 1. Tìm gender theo tên
        let genderId = null;
        if (gender) {
            const genderEntry = await strapi.db.query('api::gender.gender').findOne({
                where: { GenderName: gender },
            });
            if (!genderEntry) return ctx.badRequest('Gender not found');
            genderId = genderEntry.id;
        }

        // 2. Tìm id của các building theo tên
        let buildingIds = [];
        if (buildings) {
            let buildingNames = Array.isArray(buildings) ? buildings : [buildings];
            const buildingEntries = await strapi.db.query('api::building.building').findMany({
                where: { BuildingName: { $in: buildingNames } },
            });
            if (buildingEntries.length !== buildingNames.length) return ctx.badRequest('Some buildings not found');
            buildingIds = buildingEntries.map(b => b.id);
        }

        // 3. Tạo user mới cho resident
        const userService = strapi.plugin('users-permissions').service('user');
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' },
        });
        const user = await userService.add({
            username: phoneNumber,
            email: email || `${phoneNumber}@auto.local`,
            password: phoneNumber,
            confirmed: true,
            blocked: false,
            role: role.id,
        });

        // 4. Gọi lại core create với dữ liệu đã chuẩn hóa
        ctx.request.body.data = {
            phoneNumber,
            name,
            avatar,
            statuscode,
            gender: genderId,
            buildings: buildingIds,
            email, // Thêm email vào đây
            users_permissions_user: user.id,
        };

        // Gọi lại hàm create gốc
        return await super.create(ctx);
    },
    async me(ctx) {
        // Lấy user từ JWT đã xác thực
        const user = ctx.state.user;
        if (!user) {
            return ctx.unauthorized("Missing or invalid token");
        }
        // Tìm resident liên kết với user này
        const resident = await strapi.db.query('api::resident.resident').findOne({
            where: { users_permissions_user: user.id },
            populate: ['gender', 'buildings'],
        });
        if (!resident) {
            return ctx.notFound("Resident not found");
        }
        ctx.send({
            success: true,
            resident,
        });
    },
    async logout(ctx) {
        const authHeader = ctx.request.header.authorization;
        if (!authHeader) {
          return ctx.unauthorized('No authorization header');
        }
        const token = authHeader.replace('Bearer ', '');
    
        // Giải mã để lấy thời gian hết hạn
        let expiredAt = new Date();
        try {
            const decoded = jwt.decode(token) as { exp?: number } | null;
            if (decoded && typeof decoded.exp === 'number') {
              expiredAt = new Date(decoded.exp * 1000);
            }
        } catch (e) {}
    
        // Lưu vào bảng InvalidToken
        await strapi.entityService.create('api::invalid-token.invalid-token', {
          data: {
            token,
            expiredAt,
          },
        });
    
        ctx.send({ message: 'Logged out successfully' });
      },
}));