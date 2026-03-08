import { getWasteTypes, createWasteType, deleteWasteType, updateRewardConfig } from "./enterpriseWasteType.service";

const FAKE_BASE = {
  updatedAt: "24/10/2023",
  version: "v2.4.0 (STABLE)",
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
  // Lấy danh sách loại rác từ enterprise waste-types API (mock)
  const res = await getWasteTypes({ isActive: true });
  // Random values or specific lookup for mocking points
  const factorMap = {
    Nhựa: 15.0,
    "Kim loại": 20.0,
    Giấy: 8.5,
    "Thủy tinh": 10.0,
    Lon: 5.0,
  };

  const pointsByWaste = (res.data || []).map((wt) => {
    // try to match name loosely to mock values
    const matchKey = Object.keys(factorMap).find(k => wt.wasteTypeName.toLowerCase().includes(k.toLowerCase()));
    const mockedFactor = matchKey ? factorMap[matchKey] : 5.0; // default 5.0

    // Use pointsPerUnit from BE if available (e.g. from joining with REWARD_CONFIG), else mock
    const realFactor = wt.pointsPerUnit ?? wt.rewardConfig?.pointsPerUnit;

    return {
      id: String(wt.wasteTypeId),
      wasteTypeId: wt.wasteTypeId,
      name: wt.wasteTypeName,
      desc: `Đơn vị: ${wt.unitType}`,
      factor: realFactor !== undefined ? realFactor : mockedFactor,
      allowed_variance_percent: wt.rewardConfig?.allowedVariancePercent ?? wt.rewardConfig?.allowed_variance_percent ?? 0,
      description: wt.rewardConfig?.description || "",
      unitType: wt.unitType,
    };
  });
  return { ...FAKE_BASE, pointsByWaste };
}

export async function saveRewardSlaRules(payload) {
  await new Promise((r) => setTimeout(r, 450));
  return { ok: true };
}

export { createWasteType, deleteWasteType, updateRewardConfig };
