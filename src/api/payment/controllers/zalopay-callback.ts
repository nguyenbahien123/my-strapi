import crypto from 'crypto';

const config = {
  key2: process.env.ZALOPAY_KEY2,
};

export default {
  async callback(ctx) {
    const { data, mac } = ctx.request.body;

    // Kiểm tra signature
    const calc_mac = crypto.createHmac('sha256', config.key2).update(data).digest('hex');
    if (mac !== calc_mac) {
      ctx.send({ return_code: -1, return_message: 'Invalid MAC' });
      return;
    }

    const callbackData = JSON.parse(data);
    const { app_trans_id, zp_trans_id, amount, server_time, result, embed_data } = callbackData;

    // Xử lý nghiệp vụ: cập nhật Payment, FeeItem
    let paymentId = null;
    try {
      // embed_data có thể chứa paymentId hoặc feeItemIds, tuỳ theo lúc tạo order
      const embed = embed_data ? JSON.parse(embed_data) : {};
      paymentId = embed.paymentId;
      // Nếu không có paymentId, có thể tra cứu theo app_trans_id
      if (!paymentId && app_trans_id) {
        const payment = await strapi.db.query('api::payment.payment').findOne({ where: { app_trans_id } });
        if (payment) paymentId = payment.id;
      }
    } catch (e) {}

    if (result === 1 && paymentId) {
      // Thành công: cập nhật Payment và FeeItem
      await strapi.entityService.update('api::payment.payment', paymentId, { 
        data: { 
          statusPayment: 'Thành công', 
          paid_at: new Date(server_time) 
        } 
      });
      // Lưu ý: Không cập nhật zp_trans_id vì không có trong schema
      // Lấy tất cả fee-item liên kết với payment này
      const feeItems = await strapi.db.query('api::fee-item.fee-item').findMany({ where: { payment: paymentId } });
      for (const item of feeItems) {
        await strapi.entityService.update('api::fee-item.fee-item', item.id, { data: { statusFeeItem: 'Đã thanh toán' } });
      }
    } else if (paymentId) {
      // Thất bại
      await strapi.entityService.update('api::payment.payment', paymentId, { data: { statusPayment: 'Thất bại' } });
    }

    ctx.send({ return_code: 1, return_message: 'Success' });
  },
};