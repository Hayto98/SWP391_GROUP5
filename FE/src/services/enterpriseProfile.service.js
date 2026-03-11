import { httpGet } from "./http";

const FAKE = {
  company: {
    name: "GreenRecycle Corp",
    code: "RE-99210",
    memberSince: "Thành viên từ tháng 10 năm 2021",
    logoText: "GR",
    verifiedText: "Doanh nghiệp xác thực",
  },
  sidebar: {
    items: [
      { key: "general", label: "Thông tin chung" },
      { key: "areas", label: "Khu vực hoạt động" },
      { key: "history", label: "Lịch sử hoạt động" },
      { key: "security", label: "Cài đặt bảo mật" },
    ],
    cta: "Xem hồ sơ công khai",
  },
  businessInfo: {
    legalName: "Công ty Cổ phần Dịch vụ Tái chế Xanh (GreenRecycle Services PLC)",
    license: "BL-2021-8893920",
    tax: "0102938475",
    hq: "123 Đại lộ Công nghiệp, Quận Bắc Từ Liêm, Hà Nội",
  },
  contactScope: {
    email: "contact@greenrecycle.vn",
    phone: "024 3388 99XX",
    regions: ["Hà Nội", "Bắc Ninh", "Hải Phòng", "Vĩnh Phúc"],
    more: "+2 khác",
  },
  activity: {
    items: [
      { title: "Gia hạn Giấy phép thành công", by: "Người thực hiện: Admin_Quang", date: "24 THG 05, 2024", state: "done" },
      { title: "Cập nhật thông tin Khu vực (Hải Phòng)", by: "Hệ thống ghi nhận thay đổi", date: "12 THG 04, 2024", state: "done" },
      { title: "Thiết lập tài khoản Enterprise", by: "Tài khoản được khởi tạo lần đầu", date: "12 THG 10, 2021", state: "done" },
    ],
    viewAll: "Xem tất cả",
  },
  security: {
    passwordLastChanged: "Lần thay đổi cuối: 3 tháng trước",
    twoFAEnabled: true,
    alert: {
      title: "CẢNH BÁO ĐĂNG NHẬP",
      desc: "Có 2 thiết bị lạ đã đăng nhập vào hệ thống từ khu vực TP.HCM trong 24 giờ qua.",
      action: "Kiểm tra ngay",
    },
  },
};

export async function getEnterpriseProfile() {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) return FAKE;
  return await httpGet("/api/enterprise/profile");
}

export async function update2FA(payload) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 250));
    return { ok: true };
  }
  return await httpGet(`/api/enterprise/profile/2fa?${new URLSearchParams(payload).toString()}`);
}