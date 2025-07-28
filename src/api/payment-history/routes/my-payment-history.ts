module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/payment-histories/my-history',
        handler: 'payment-history.getMyPaymentHistory',
        config: {
          policies: [],
          middlewares: [],
        },
      },
    ],
  }; 