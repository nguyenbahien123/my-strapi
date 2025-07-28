import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';

// Cấu hình ZaloPay Sandbox
const config = {
  app_id: '2553',
  key1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  key2: 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
  endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

export default {
  /**
   * API đăng ký dịch vụ, tạo đơn hàng ZaloPay
   * Body: { buildingServiceId, residentId }
   * Nếu không truyền residentId thì lấy từ JWT
   */
  async register(ctx) {
    const { buildingServiceId, residentId } = ctx.request.body;
    let realResidentId = residentId;
    let user = ctx.state.user;

    // Nếu không truyền residentId thì lấy từ user
    if (!realResidentId) {
      if (!user) return ctx.unauthorized('Missing or invalid token');
      // Tìm resident liên kết với user này (chỉ lấy published record)
      const resident = await strapi.db.query('api::resident.resident').findOne({
        where: { 
          users_permissions_user: user.id,
          publishedAt: { $notNull: true },
        },
      });
      if (!resident) return ctx.notFound('Resident not found');
      realResidentId = resident.id;
    }

    // Kiểm tra residentId có tồn tại không (chỉ lấy published record)
    const residentCheck = await strapi.db.query('api::resident.resident').findOne({
      where: { 
        id: realResidentId,
        publishedAt: { $notNull: true },
      },
    });
    if (!residentCheck) return ctx.badRequest('ResidentId không tồn tại');
    console.log('Checking existing registrations for resident:', realResidentId, 'service:', buildingServiceId);

    // 1. Kiểm tra đã đăng ký dịch vụ này chưa (còn hiệu lực) - chỉ check published records
    // Lấy tất cả bản ghi đã đăng ký của resident này cho service này
    const allRegistrations = await strapi.entityService.findMany('api::service-registration.service-registration', {
      filters: {
        resident: realResidentId,
        building_service: buildingServiceId,
        statusRegister: 'Đã đăng kí',
        publishedAt: { $notNull: true }, // Chỉ check bản ghi đã publish
      },
    });
    
    console.log('All registrations found:', allRegistrations.length, allRegistrations);
    
    // Kiểm tra xem có bản ghi nào còn hiệu lực không
    const now = new Date();
    const activeRegistration = allRegistrations.find(reg => {
      if (!reg.end_date) return false;
      const endDate = new Date(reg.end_date);
      return endDate >= now;
    });
    
    console.log('Active registration found:', activeRegistration);
    
    if (activeRegistration) {
      return ctx.badRequest('Bạn đã đăng ký dịch vụ này.');
    }

    // 2. Lấy thông tin dịch vụ (chỉ lấy published record)
    const service = await strapi.db.query('api::building-service.building-service').findOne({
      where: {
        id: buildingServiceId,
        publishedAt: { $notNull: true },
      },
    });
    if (!service) return ctx.notFound('Dịch vụ không tồn tại');

    // 3. Tạo đơn hàng ZaloPay
    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;
    const order: any = {
      app_id: config.app_id,
      app_trans_id,
      app_user: realResidentId.toString(),
      app_time: Date.now(),
      item: JSON.stringify([{ id: service.id, name: service.name, price: service.price }]),
      embed_data: JSON.stringify({ redirecturl: 'https://h5.zdn.vn/zapps/2063201134229316676/services' }),
      amount: service.price,
      callback_url: 'https://hip-grouper-star.ngrok-free.app/api/service-registration/zalopay-callback',
      description: `Thanh toán dịch vụ ${service.name}`,
      bank_code: '',
    };
    // Tạo chuỗi data để tạo MAC theo tài liệu ZaloPay
    const data = [
      order.app_id,
      order.app_trans_id,
      order.app_user,
      order.amount,
      order.app_time,
      order.embed_data,
      order.item
    ].join('|');
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    // 4. Gửi yêu cầu tạo đơn hàng tới ZaloPay
    let result;
    try {
      result = await axios.post(config.endpoint, null, { params: order });
    } catch (error) {
      return ctx.badRequest('Không thể tạo đơn hàng ZaloPay');
    }

    // 5. Lưu tạm đơn đăng ký với trạng thái "Chờ thanh toán"
    await strapi.entityService.create('api::service-registration.service-registration', {
      data: {
        statusRegister: 'Chờ thanh toán',
        building_service: service.id, // id dịch vụ
        resident: realResidentId,     // id resident
        start_date: null,
        end_date: null,
        payment: null,
        app_trans_id,
      },
    });

    // 6. Trả về thông tin đơn hàng cho frontend (chứa URL thanh toán)
    ctx.send(result.data);
  },

  /**
   * API callback cho ZaloPay gọi về khi thanh toán thành công
   * Đường dẫn: /api/service-registration/zalopay-callback
   */
  async zalopayCallback(ctx) {
    const { data: dataStr, mac: reqMac } = ctx.request.body;
    const mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();

    let result: { return_code: number; return_message: string } = { return_code: 0, return_message: '' };
    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      const dataJson = JSON.parse(dataStr);
      const app_trans_id = dataJson['app_trans_id'];
      const now = moment();
      
      console.log('ZaloPay callback received for app_trans_id:', app_trans_id);
      
      // Lấy thông tin service_registration trước khi update
      const registration = await strapi.db.query('api::service-registration.service-registration').findOne({
        where: { app_trans_id },
        populate: ['building_service', 'resident'],
      });

      console.log('Found registration:', registration);

      if (registration && registration.building_service && registration.resident) {
        console.log('Creating payment history for resident:', registration.resident.id);
        
        // Cập nhật trạng thái đăng ký sang "Đã đăng kí", set ngày bắt đầu/kết thúc
        const updatedRegistration = await strapi.db.query('api::service-registration.service-registration').updateMany({
          where: { app_trans_id },
          data: {
            statusRegister: 'Đã đăng kí',
            start_date: now.toDate(),
            end_date: now.add(1, 'month').toDate(),
          },
        });

        console.log('Updated registration count:', updatedRegistration.count);

        // Publish bản ghi service-registration để có thể tìm thấy trong lần check tiếp theo
        await strapi.entityService.update('api::service-registration.service-registration', registration.id, {
          data: {
            publishedAt: now.toDate(),
          },
        });

        // Tăng userCount của building-service lên 1 (chỉ cho bản ghi đã publish)
        const currentService = await strapi.db.query('api::building-service.building-service').findOne({
          where: { 
            id: registration.building_service.id,
            publishedAt: { $notNull: true } // Chỉ lấy bản ghi đã publish
          },
        });

        if (currentService) {
          await strapi.db.query('api::building-service.building-service').updateMany({
            where: { 
              id: registration.building_service.id,
              publishedAt: { $notNull: true } // Chỉ cập nhật bản ghi đã publish
            },
            data: {
              userCount: currentService.userCount + 1, // Sử dụng phép cộng thay vì $increment
            },
          });
        }
        
        // Tạo payment history record
        try {
          const paymentHistory = await strapi.entityService.create('api::payment-history.payment-history', {
            data: {
              resident: registration.resident.id,
              amount: registration.building_service.price,
              payment_date: now.toDate(),
              payment_type: 'service',
              status: 'success',
              reference_id: registration.id.toString(),
              reference_type: 'service_registration',
              description: `Thanh toán dịch vụ ${registration.building_service.name}`,
              payment_method: 'zalopay',
              transaction_id: app_trans_id,
            },
          });
          console.log('Payment history created:', paymentHistory);
        } catch (error) {
          console.error('Error creating payment history:', error);
        }
      } else {
        console.log('Missing required data for payment history creation');
      }

      result.return_code = 1;
      result.return_message = 'success';
    }
    ctx.send(result);
  },
};