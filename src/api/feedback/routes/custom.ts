module.exports = {
    routes: [
        {
            method: 'GET',
            path: '/feedbacks/my',
            handler: 'feedback.myFeedbacks',
            config: {
                auth: { scope: [] }, // hoặc chỉ cần config: {}
            },
        },
    ],
}; 