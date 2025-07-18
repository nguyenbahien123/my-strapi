import { Server } from 'ws';

// Lấy WebSocket server và map từ global
const getWSS = () => (global as any).wss as Server | undefined;
const getSocketUserMap = () => (global as any).socketUserMap as Map<string, any> | undefined;

export default {
  async afterCreate(event) {
    console.log('==> afterCreate', event.result.id);
    const { result } = event;
    // So sánh createdAt và updatedAt sau khi ép kiểu về chuỗi ISO
    if (
      result.createdAt &&
      result.updatedAt &&
      new Date(result.createdAt).toISOString() === new Date(result.updatedAt).toISOString()
    ) {
      // Gửi thông báo cho admin
      const adminEmails = ['nguyenbahien170604@gmail.com']; // Thay bằng email admin thực tế
      const socketUserMap = getSocketUserMap();
      console.log('SocketUserMap keys:', Array.from(socketUserMap?.keys() || []));
      adminEmails.forEach(email => {
        const ws = socketUserMap?.get(email);
        console.log('Check ws for email:', email, !!ws);
        if (ws && ws.readyState === 1) {
          try {
            ws.send(JSON.stringify({
              type: 'feedback_new',
              feedbackId: result.id,
              status: 'chưa_xử_lý',
              message: 'Có feedback mới',
              feedback: result,
            }));
            console.log('Sent feedback_new to', email);
          } catch (err) {
            console.error('Send feedback_new error:', err);
          }
        }
      });
    }
  },
  async afterUpdate(event) {
    console.log('==> afterUpdate', event.result.id);
    const { result } = event;
    // Truy vấn lại feedback để lấy resident (populate)
    const feedback = await strapi.entityService.findOne('api::feedback.feedback', result.id, {
      populate: { Resident: { fields: ['email'] } }
    });
    // Ép kiểu để truy cập Resident
    const resident = (feedback as any).Resident;
    let residentEmail = null;
    if (resident && typeof resident === 'object' && resident.email) {
      residentEmail = resident.email;
    }
    console.log('afterUpdate residentEmail:', residentEmail);
    if (residentEmail) {
      const socketUserMap = getSocketUserMap();
      const ws = socketUserMap?.get(residentEmail);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'feedback_status',
          feedbackId: result.id,
          status: result.StatusFeedback,
          message: `Feedback ${result.Title} của bạn đã chuyển sang trạng thái: ${result.StatusFeedback}`,
          feedback: result,
        }));
        console.log('Sent feedback_status to', residentEmail);
      } else {
        console.log('No ws for residentEmail:', residentEmail);
      }
    } else {
      console.log('No residentEmail found in afterUpdate');
    }
  },
};