module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/resident/login-zalo',
            handler: 'resident-zalo-auth.loginByZalo',
            config: {
                auth: false,
            },
        },
    ],
};