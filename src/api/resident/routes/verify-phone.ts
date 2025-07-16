module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/auth/verify-phone',
            handler: 'verify-phone.verifyPhone',
            config: {
                auth: false,
            },
        },
    ],
};