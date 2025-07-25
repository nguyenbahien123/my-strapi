/**
 * building-service controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::building-service.building-service', ({ strapi }) => ({
  async residentView(ctx) {
    try {
      // Lấy user từ JWT
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Missing or invalid token');

      // Tìm resident liên kết với user này
      const resident = await strapi.db.query('api::resident.resident').findOne({
        where: { users_permissions_user: user.id },
      });
      if (!resident) return ctx.notFound('Resident not found');
      const residentId = resident.id;

      // Lấy tất cả dịch vụ và populate các đăng ký kèm resident
      const services = await strapi.entityService.findMany('api::building-service.building-service', {
        populate: {
          service_registrations: {
            populate: ['resident'],
          },
        },
      });

      const now = new Date();

      // Chỉ trả về các trường cần thiết + isRegistered
      const result = services.map(service => {
        const registrations = (service as any).service_registrations || [];
        const hasActive = registrations.some((reg: any) =>
          reg.resident && reg.resident.id === residentId &&
          reg.statusRegister === 'Đã đăng kí' &&
          reg.end_date && new Date(reg.end_date) >= now
        );
        // Chỉ trả về các trường cần thiết
        return {
          id: service.id,
          name: service.name,
          description: service.description,
          icon: service.icon,
          color: service.color,
          category: service.category,
          price: service.price,
          unit: service.unit,
          features: service.features,
          location: service.location,
          operatingHours: service.operatingHours,
          userCount: service.userCount,
          isRegistered: hasActive,
        };
      });

      ctx.send(result);
    } catch (error) {
      console.error('residentView error:', error);
      ctx.internalServerError('Internal server error');
    }
  },
}));
