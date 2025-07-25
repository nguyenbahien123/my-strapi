module.exports = {
    routes: [
        {
          method: 'GET',
          path: '/building-services/resident-view',
          handler: 'building-service.residentView',
          config: {
            policies: [],
            middlewares: [],
          },
        },
      ],
  };
  