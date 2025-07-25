import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';

const config = {
  appid: process.env.ZALOPAY_APP_ID,
  key1: process.env.ZALOPAY_KEY1,
  key2: process.env.ZALOPAY_KEY2,
  endpoint: process.env.ZALOPAY_ENDPOINT,
  callback_url: process.env.ZALOPAY_CALLBACK_URL,
};

export default {
  async createOrder(ctx) {
    const { amount, description, residentId, feeItemIds } = ctx.request.body;

    // Lưu Payment tạm thời vào DB (status: Đang chờ)
    let paymentRecord;
    try {
      paymentRecord = await strapi.entityService.create('api::payment.payment', {
        data: {
          total_amount: amount,
          statusPayment: 'Đang chờ',
          payment_method: 'ZaloPay',
          payer: residentId,
          fee_items: feeItemIds,
          note: description,
        },
        populate: ['fee_items'],
      });
    } catch (err) {
      ctx.throw(500, 'Không thể lưu payment vào hệ thống');
    }

    // Tạo embed_data với redirecturl (nếu cần) và paymentId
    const embed_data = {
      redirecturl: process.env.ZALOPAY_REDIRECT_URL || '',
      paymentId: paymentRecord.id,
      feeItemIds
    };

    // Tạo mã đơn hàng merchant theo format của ZaloPay
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;

    // Dữ liệu gửi lên ZaloPay
    const order = {
      app_id: config.appid,
      app_trans_id,
      app_user: `resident_${residentId}`,
      app_time: Date.now(),
      amount: Number(amount),
      item: JSON.stringify([{
        itemid: "1",
        itemname: "Phí dịch vụ",
        itemprice: Number(amount),
        itemquantity: 1
      }]),
      embed_data: JSON.stringify(embed_data),
      description: `${description} #${transID}`,
      bank_code: '',
      callback_url: config.callback_url
    };

    // Tạo chuỗi data để ký MAC theo thứ tự của ZaloPay
    const data = config.appid + "|" + order.app_trans_id + "|" + order.app_user + "|" + 
                order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;

    // Tạo MAC bằng CryptoJS
    const orderWithMac = { ...order, mac: CryptoJS.HmacSHA256(data, config.key1).toString() };

    try {
      console.log('Order gửi lên ZaloPay:', orderWithMac);
      const response = await axios.post(config.endpoint, null, { params: orderWithMac });
      console.log('ZaloPay response:', response.data);

      // Cập nhật payment với app_trans_id và gateway_transaction_id
      await strapi.entityService.update('api::payment.payment', paymentRecord.id, {
        data: {
          app_trans_id,
          gateway_transaction_id: response.data.zp_trans_token || response.data.order_token || '',
        },
      });

      ctx.send({
        order_token: response.data.order_token,
        zp_trans_token: response.data.zp_trans_token,
        pay_url: response.data.order_url,
        app_trans_id,
        // ...response.data
      });
    } catch (error) {
      // Nếu lỗi, xóa payment vừa tạo để tránh rác
      if (paymentRecord?.id) {
        await strapi.entityService.delete('api::payment.payment', paymentRecord.id);
      }
      ctx.throw(400, error.response?.data?.return_message || 'ZaloPay error');
    }
  },
};