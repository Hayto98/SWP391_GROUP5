import { httpGet } from "./http";

const FAKE = {
  summary: {
    pending: 12,
    inProgress: 45,
    done: 128,
    slaWarning: 5,
    pendingDelta: 2,
    inProgressDelta: 5,
    doneDelta: 12,
    slaDelta: -1,
  },
  chart: {
    week: {
      labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      values: [30, 55, 80, 50, 62, 78, 45],
    },
    month: {
      labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
      values: [120, 160, 220, 180],
    },
  },
  waste: {
    totalText: "1.2T",
    totalSubText: "TỔNG CỘNG",
    ringPercent: 68,
    breakdown: [
      { label: "Nhựa", percent: 54, key: "plastic" },
      { label: "Giấy", percent: 22, key: "paper" },
      { label: "Kim loại", percent: 14, key: "metal" },
      { label: "Khác", percent: 10, key: "other" },
    ],
  },
  activities: [
    { code: "#RC-8801", district: "Quận 1, TP.HCM", type: "Nhựa PET", time: "10:24 AM", status: "ĐÃ THU GOM", badge: "success" },
    { code: "#RC-8802", district: "Quận 3, TP.HCM", type: "Giấy Carton", time: "10:15 AM", status: "SẮP TỚI SLA", badge: "danger" },
    { code: "#RC-8803", district: "Quận 7, TP.HCM", type: "Kim loại", time: "09:58 AM", status: "ĐANG DI CHUYỂN", badge: "info" },
    { code: "#RC-8804", district: "Thủ Đức, TP.HCM", type: "Khác", time: "09:40 AM", status: "CHỜ XỬ LÝ", badge: "default" },
  ],
};

export async function getEnterpriseOverview(range = "month") {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    return {
      ...FAKE,
      chart: { ...FAKE.chart, active: FAKE.chart[range] },
    };
  }

  try {
    const data = await httpGet(`/api/enterprise/overview?range=${range}`);
    return data;
  } catch (e) {
    return {
      ...FAKE,
      chart: { ...FAKE.chart, active: FAKE.chart[range] },
    };
  }
}