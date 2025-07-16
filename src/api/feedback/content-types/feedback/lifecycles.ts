import { Server } from 'ws';

// Lấy WebSocket server và map từ global
const getWSS = () => (global as any).wss as Server | undefined;
const getSocketUserMap = () => (global as any).socketUserMap as Map<string, any> | undefined;

export default {
  async afterCreate(event) {
    const { result } = event;
    // Gửi event cho admin/operator về feedback mới (broadcast)
    const wss = getWSS();
    if (wss) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'feedback_new',
            feedbackId: result.id,
            status: 'chưa_xử_lý',
            message: 'Có feedback mới',
            feedback: result,
          }));
        }
      });
    }
  },
  async afterUpdate(event) {
    const { result, params } = event;
    // Nếu có trường trạng thái, gửi event cho đúng user
    if (result && result.Status && params.data && params.data.Status && result.zaloId) {
      const socketUserMap = getSocketUserMap();
      const ws = socketUserMap?.get(result.zaloId);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'feedback_status',
          feedbackId: result.id,
          status: result.Status,
          message: `Feedback của bạn đã chuyển sang trạng thái: ${result.Status}`,
          feedback: result,
        }));
      }
    }
  },
};