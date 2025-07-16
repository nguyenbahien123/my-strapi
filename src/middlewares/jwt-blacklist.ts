module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
      const authHeader = ctx.request.header.authorization;
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        // Kiểm tra token có trong bảng InvalidToken không
        const invalid = await strapi.entityService.findMany('api::invalid-token.invalid-token', {
          filters: { token },
          limit: 1,
        });
        if (invalid && invalid.length > 0) {
          return ctx.unauthorized('Token has been revoked');
        }
      }
      await next();
    };
  };