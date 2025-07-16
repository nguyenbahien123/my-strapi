// export default () => ({});
export default () => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '43200m', // 1 phút (30 ngày)
      },
    },
  },
});
