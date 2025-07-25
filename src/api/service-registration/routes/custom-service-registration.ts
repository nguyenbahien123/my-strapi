module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/service-registration/register',
      handler: 'custom-service-registration.register',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/service-registration/zalopay-callback',
      handler: 'custom-service-registration.zalopayCallback',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
