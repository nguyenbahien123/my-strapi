// export default [
//   'strapi::logger',
//   'strapi::errors',
//   'strapi::security',
//   {
//     name: 'strapi::cors',
//     config: {
//       origin: [
//         "https://hip-grouper-star.ngrok-free.app",
//         'https://h5.zdn.vn',
//         'zbrowser://h5.zdn.vn',
//         'https://usable-dinosaurs-b795619e4a.strapiapp.com',
//         'https://zalo.me',
//         "http://localhost:[*]"
//       ],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//       headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'Response-Type'],
//       credentials: true,
//     },
//   },
//   'strapi::poweredBy',
//   'strapi::query',
//   'strapi::body',
//   'strapi::session',
//   'strapi::favicon',
//   'strapi::public',
// ];

export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: '*', // Cho phép tất cả domain
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      headers: '*',
      credentials: false, // Không dùng credentials
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::jwt-blacklist',
];