import { httpGet } from "./http";

const FAKE = {
  updatedAt: "24/10/2023",
  version: "v2.4.0 (STABLE)",
  pointsByWaste: [
    { id: "pet", name: "Nhựa tái chế (PET)", desc: "Chai nước, hộp nhựa trong", factor: 10.0 },
    { id: "paper", name: "Giấy & Carton", desc: "Thùng giấy, báo cũ, tạp chí", factor: 5.0 },
    { id: "metal", name: "Kim loại (Nhôm, Sắt)", desc: "Lon nước, sắt vụn gia đình", factor: 15.0 },
    { id: "glass", name: "Thủy tinh", desc: "Chai lọ thủy tinh các loại", factor: 3.5 },
    { id: "ewaste", name: "Rác điện tử", desc: "Linh kiện, pin, thiết bị hỏng", factor: 25.0 },
  ],
  qualityRules: [
    { id: "correct", label: "Phân loại ĐÚNG", note: "Rác sạch, đúng loại rác", multiplier: 1.0, tone: "ok" },
    { id: "minor", label: "Lẫn lộn nhẹ", note: "Có tạp chất dưới 10%", multiplier: 0.5, tone: "warn" },
    { id: "bad", label: "Sai loại / Quá bẩn", note: "Tạp chất cao hoặc bẩn nặng", multiplier: 0.0, tone: "bad" },
  ],
  slaLargeWeight: {
    thresholdKg: 30,
    extraRewardMultiplier: 1.2,
    slaHours: 24,
    autoNotifyExpired: true,
  },
};

export async function getRewardSlaRules() {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) return FAKE;
  return await httpGet("/api/enterprise/rewards-sla-rules");
}

export async function saveRewardSlaRules(payload) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true };
  }
  return await httpGet(`/api/enterprise/rewards-sla-rules/save?${new URLSearchParams(payload).toString()}`);
}