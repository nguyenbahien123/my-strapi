/**
 * booking controller
 */

import { factories } from '@strapi/strapi'

const customController = factories.createCoreController('api::booking.booking', ({ strapi }) => ({
  async availableTimeSlots(ctx) {
    console.log('--- [LOG] availableTimeSlots called ---');
    const { date, footballFieldId } = ctx.query;
    console.log('--- [LOG] Params:', { date, footballFieldId });
    if (!date || !footballFieldId) {
      ctx.throw(400, 'Missing date or footballFieldId');
    }
    // Lấy tất cả time slots (cả draft và published)
    const timeSlots = await strapi.entityService.findMany('api::time-slot.time-slot', {});
    // Lấy tất cả booking của ngày và sân đó, chỉ lấy booking đã publish
    const bookings = await strapi.entityService.findMany('api::booking.booking', {
      filters: {
        date,
        football_field: footballFieldId,
        statusBooking: { $ne: 'cancelled' }
      },
      populate: ['time_slot']
    });
    console.log('DEBUG bookings:', bookings);

    const bookedSlotIds = bookings.map(b => {
      const booking: any = b;
      if (booking.time_slot && typeof booking.time_slot === 'object') return booking.time_slot.id;
      if (typeof booking.time_slot === 'number') return booking.time_slot;
      return undefined;
    });
    console.log('DEBUG bookedSlotIds:', bookedSlotIds);

    const result = timeSlots.map(slot => ({
      ...slot,
      isBooked: bookedSlotIds.includes(slot.id)
    }));
    console.log('--- [LOG] Result:', result);
    ctx.body = result;
  },
  async book(ctx) {
    const { date, football_field, time_slot, team_name, phone, email } = ctx.request.body;
    if (!date || !football_field || !time_slot || !team_name || !phone || !email) {
      ctx.throw(400, 'Missing required fields');
    }
    // Kiểm tra trùng lặp booking (chỉ với booking đã publish)
    const existing = await strapi.entityService.findMany('api::booking.booking', {
      filters: {
        date,
        football_field,
        time_slot,
        statusBooking: { $ne: 'cancelled' }
        // Bỏ publishedAt: { $notNull: true }
      }
    });
    if (existing && existing.length > 0) {
      ctx.throw(409, 'This time slot is already booked');
    }
    // Tạo booking mới luôn ở trạng thái pending
    const booking = await strapi.entityService.create('api::booking.booking', {
      data: {
        date,
        football_field,
        time_slot,
        team_name,
        phone,
        email,
        statusBooking: 'pending'
      },
      populate: ['time_slot', 'football_field']
    });
    console.log('DEBUG created booking:', booking);
    ctx.body = booking;
  }
}));

export default customController;
