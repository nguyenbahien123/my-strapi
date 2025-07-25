 module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/resident/fee-items',
            handler: 'resident.residentFeeItems',
            config: {
              policies: [],
              middlewares: [],
            },
          },
    ],
}; 