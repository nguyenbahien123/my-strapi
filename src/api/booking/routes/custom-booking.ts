module.exports = {
    routes: [
      {
        method: 'GET',
        path: '/available-time-slots',
        handler: 'booking.availableTimeSlots',
        config: {
            auth: { scope: [] }, // hoặc chỉ cần config: {}
        },
      },
      {
        method: 'POST',
        path: '/bookings/book',
        handler: 'booking.book',
        config: {
            auth: { scope: [] }, // hoặc chỉ cần config: {}
        },
      },
    ]
  };