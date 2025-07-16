// export default ({ env }) => ({
//   host: env('HOST', '0.0.0.0'),
//   port: env.int('PORT', 1337),
//   app: {
//     keys: env.array('APP_KEYS'),
//   },
// });
export default ({ env }) => {
  const config = {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: env.array('APP_KEYS'),
    },
    afterInit: async (strapi) => {
      const { Server } = await import('ws');
      const wss = new Server({ server: strapi.server.httpServer });
      (global as any).wss = wss;

      // Map zaloId <-> ws
      const socketUserMap = new Map();
      (global as any).socketUserMap = socketUserMap;

      wss.on('connection', (ws) => {
        ws.on('message', (msg) => {
          try {
            const data = JSON.parse(msg);
            if (data.type === 'auth' && data.zaloId) {
              socketUserMap.set(data.zaloId, ws);
              ws.zaloId = data.zaloId;
            }
          } catch {}
        });
        ws.send(JSON.stringify({ type: 'welcome', message: 'WebSocket connected!' }));
      });

      strapi.log.info('WebSocket server started');
    },
  };
  return config;
};