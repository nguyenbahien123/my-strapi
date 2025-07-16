export default {
    async beforeCreate(event) {
        const { data } = event.params;

        // Nếu đã có users_permissions_user thì bỏ qua
        if (data.users_permissions_user) return;

        // Tạo user mới
        const phoneNumber = data.phoneNumber;
        if (!phoneNumber) throw new Error('Missing phoneNumber for resident');

        // Kiểm tra user đã tồn tại chưa
        const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { username: phoneNumber },
        });
        if (existingUser) {
            data.users_permissions_user = existingUser.id;
            return;
        }

        // Lấy role authenticated
        const role = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' },
        });

        // Tạo user mới
        const user = await strapi.plugin('users-permissions').service('user').add({
            username: phoneNumber,
            email: `${phoneNumber}@auto.local`,
            password: phoneNumber,
            confirmed: true,
            blocked: false,
            role: role.id,
        });

        data.users_permissions_user = user.id;
    }
};