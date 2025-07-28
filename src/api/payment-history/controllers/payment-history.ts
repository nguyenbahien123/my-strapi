import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::payment-history.payment-history', ({ strapi }) => ({
  async getMyPaymentHistory(ctx) {
    try {
      // Lấy residentId từ query params hoặc JWT
      let residentId = ctx.query.residentId ? Number(ctx.query.residentId) : null;

      if (!residentId) {
        // Fallback: lấy từ JWT nếu không có residentId trong query
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized('Missing or invalid token');


        const resident = await strapi.db.query('api::resident.resident').findOne({
          where: { 
            users_permissions_user: user.id,
            publishedAt: { $notNull: true },
          },
        });
        
        console.log('Found resident from JWT:', resident);
        
        if (!resident) return ctx.notFound('Resident not found');
        residentId = resident.id;
      }


      // Lấy lịch sử thanh toán của resident này
      
      const paymentHistories = await strapi.db.query('api::payment-history.payment-history').findMany({
        where: {
          resident: residentId,
          publishedAt: { $notNull: true },
        },
        orderBy: { payment_date: 'desc' }, // Sắp xếp theo ngày mới nhất
        populate: ['resident'],
      });
      

      // Format lại dữ liệu trả về
      const result = paymentHistories.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_type: payment.payment_type,
        status: payment.status,
        description: payment.description,
        payment_method: payment.payment_method,
        transaction_id: payment.transaction_id,
        reference_id: payment.reference_id,
        reference_type: payment.reference_type,
      }));

      ctx.send({
        success: true,
        data: result,
        total: result.length,
      });
    } catch (error) {
      console.error('getMyPaymentHistory error:', error);
      ctx.internalServerError('Internal server error');
    }
  },
})); 