import { httpGet } from "./http";

const FAKE = {
  id: "ID-12345",
  status: "ĐANG CHỜ XỬ LÝ",
  createdAt: "14:20 PM • 24 Tháng 10, 2023",
  imageUrl: "https://vnexpress.net/anh-se-beu-ten-nguoi-do-rac-bua-bai-len-mang-xa-hoi-5044850.html",
  wasteType: "Nhựa & Kim loại",
  weightEstimate: "~45 - 50 kg",
  reporter: { name: "Nguyễn Văn A", phone: "01-CT-9021" },
  priority: "Trung bình",
  note:
    "Rác thải sinh hoạt và chai nhựa tập kết tại góc đường Lê Lợi, gần thùng rác công cộng bị hỏng. Cần xe thu gom loại lớn vì khối lượng khá nhiều.",
  address: "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
  location: { lat: 10.776261, lng: 106.66602 },
  destination: { lat: 10.762622, lng: 106.660172 },
  timeline: [
    { title: "Báo cáo được gửi", time: "24/10/2023 • 14:20", state: "done" },
    { title: "Hệ thống đã xác minh AI", time: "24/10/2023 • 14:22", state: "done" },
    { title: "Chờ Admin tiếp nhận", time: "24/10/2023 • 14:30", state: "active" },
    { title: "Lên lịch thu gom", time: "Chưa bắt đầu", state: "todo" },
  ],
};

export async function getReportDetail(reportId) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) return { ...FAKE, id: reportId || FAKE.id };

  return await httpGet(`/api/enterprise/reports/${reportId}`);
}

export async function updateReportAction(payload) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }

  return await httpGet(`/api/enterprise/reports/action?${new URLSearchParams(payload).toString()}`);
}