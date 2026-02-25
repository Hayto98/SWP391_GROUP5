// FAKE AUTH DATA - Dùng tạm cho dev, xóa khi production

export const fakeUsers = [
  {
    phone: "0900000001",
    password: "admin123",
    tokens: {
      accessToken: "fake-admin-token",
      refreshToken: "fake-admin-refresh-token",
    },
    user: {
      userAccountId: 1,
      phone: "0900000001",
      fullname: "Admin User",
      roleId: 1,
    },
  },
  {
    phone: "0900000002",
    password: "citizen123",
    tokens: {
      accessToken: "fake-citizen-token",
      refreshToken: "fake-citizen-refresh-token",
    },
    user: {
      userAccountId: 2,
      phone: "0900000002",
      fullname: "Nguyen Van A",
      roleId: 2,
    },
  },
  {
    phone: "0900000003",
    password: "enterprise123",
    tokens: {
      accessToken: "fake-enterprise-token",
      refreshToken: "fake-enterprise-refresh-token",
    },
    user: {
      userAccountId: 3,
      phone: "0900000003",
      fullname: "Tran Thi B",
      roleId: 3,
    },
  },
  {
    phone: "0900000004",
    password: "collector123",
    tokens: {
      accessToken: "fake-collector-token",
      refreshToken: "fake-collector-refresh-token",
    },
    user: {
      userAccountId: 4,
      phone: "0900000004",
      fullname: "Le Van C",
      roleId: 4,
    },
  },
];

/**
 * Giả lập API login
 * @param {string} phone
 * @param {string} password
 * @returns fake response hoặc throw error
 */
export function fakeLogin(phone, password) {
  const found = fakeUsers.find(
    (u) => u.phone === phone && u.password === password,
  );
  if (!found) {
    throw new Error("Số điện thoại hoặc mật khẩu không đúng");
  }
  const { tokens, user } = found;
  return { tokens, user };
}
