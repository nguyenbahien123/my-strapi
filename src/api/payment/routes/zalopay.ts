module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/payment/zalopay-create-order',
        handler: 'zalopay.createOrder',
        config: { auth: false },
      },
      {
        method: 'POST',
        path: '/payment/zalopay-callback',
        handler: 'zalopay-callback.callback',
        config: { auth: false },
      },
    ],
  };