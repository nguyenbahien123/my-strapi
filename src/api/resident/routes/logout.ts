export default {
    routes: [
      {
        method: 'POST',
        path: '/auth/logout',
        handler: 'resident.logout',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  };