import { Server } from 'ws';
import http from 'http';

export let wss: Server;
export let socketUserMap: Map<string, any> = new Map();

export function initWebSocketServer(strapi) {
  // Lấy httpServer gốc của Strapi
  const httpServer = strapi.server.httpServer as http.Server;

  // Khởi tạo WebSocket server
  wss = new Server({ noServer: true });

  // Lưu vào global để lifecycle có thể truy cập
  (global as any).wss = wss;
  (global as any).socketUserMap = socketUserMap;

  // Lắng nghe upgrade để bắt kết nối WebSocket
  httpServer.on('upgrade', (request, socket, head) => {
    // Chỉ upgrade nếu đúng endpoint, ví dụ: /ws
    if (request.url?.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        // Lấy email từ query string
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const email = url.searchParams.get('email');
        if (email) {
          socketUserMap.set(email, ws);
          ws.on('close', () => {
            socketUserMap.delete(email);
          });
        }
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });
}