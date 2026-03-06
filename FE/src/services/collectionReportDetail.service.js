import { httpGet } from "./http";

const FAKE = {
  id: "RP-8829",
  status: "Đã thu gom",
  createdAt: "12/10/2023 08:30",
  completedAt: "12/10/2023 10:15",
  searchHint: "Tìm kiếm báo cáo ID: RP-8829",
  location: {
    lat: 10.762262,
    lng: 106.660172,
    address: "258 Nguyễn Văn Cừ, Phường 4, Quận 5, TP.HCM",
  },
  wasteCompare: {
    rows: [
      { label: "Loại rác", citizen: "Nhựa PET", collector: "Nhựa PET", diff: "Khớp 100%", diffTone: "ok" },
      { label: "Khối lượng", citizen: "5.0 kg", collector: "5.8 kg", diff: "+0.8 kg", diffTone: "warn" },
      { label: "Phân loại chất lượng", citizen: "Sạch", collector: "Đạt chuẩn", diff: "-", diffTone: "muted" },
    ],
  },
  images: {
    citizen: "https://vnexpress.net/anh-se-beu-ten-nguoi-do-rac-bua-bai-len-mang-xa-hoi-5044850.html",
    collector: "https://picsum.photos/1200/800?random=12",
  },
  collectorCard: {
    name: "Nguyễn Văn An",
    code: "EMP-0902",
    rating: 4.9,
    completed: 1204,
  },
  progress: {
    steps: [
      { title: "Đã tiếp nhận", state: "done", time: "08:35" },
      { title: "Đã điều phối", state: "done", time: "08:40" },
      { title: "Hoàn tất", state: "done", time: "10:12" },
    ],
    slaText: "TRẠNG THÁI SLA: CAM KẾT 72 GIỜ",
    slaStatus: "Đúng hạn",
  },
  rewards: {
    title: "Phần thưởng cho Citizen",
    earned: "+580",
    note: "Điểm",
    detail: "Nhựa PET 5.8kg x 100đ; 5.8kg • Thưởng phân loại đúng: Free ship voucher",
  },
};

export async function getCollectionReportDetail(reportId) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) return { ...FAKE, id: reportId || FAKE.id };

  return await httpGet(`/api/enterprise/reports/collection/${reportId}`);
}