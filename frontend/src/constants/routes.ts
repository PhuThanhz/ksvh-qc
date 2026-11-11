/** Đường dẫn trang. Mọi điều hướng dùng hằng số này, không viết chuỗi URL rải rác. */
export const ROUTES = {
  login: '/login',
  admin: {
    root: '/admin',
    users: '/admin/users',
  },
  qc: {
    root: '/qc',
    checkinDemo: '/qc/checkin-demo',
  },
} as const
