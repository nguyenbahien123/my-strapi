module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/auth/me',
            handler: 'resident.me',
            config: {
                auth: { scope: [] }, // hoặc chỉ cần config: {}
            },
        },
    ],
}; 