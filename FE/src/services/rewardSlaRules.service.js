import {
  getWasteTypes,
  createWasteType,
  deleteWasteType,
  createRewardConfig,
  updateRewardConfigById,
  updateWasteType,
} from "./enterpriseWasteType.service";

const FAKE_BASE = {
  updatedAt: "24/10/2023",
  version: "v2.4.0 (STABLE)",
  qualityRules: [
    {
      id: "correct",
      label: "Phân loại ĐÚNG",
      note: "Rác sạch, đúng loại rác",
      multiplier: 1.0,
      tone: "ok",
    },
    {
      id: "minor",
      label: "Lẫn lộn nhẹ",
      note: "Có tạp chất dưới 10%",
      multiplier: 0.5,
      tone: "warn",
    },
    {
      id: "bad",
      label: "Sai loại / Quá bẩn",
      note: "Tạp chất cao hoặc bẩn nặng",
      multiplier: 0.0,
      tone: "bad",
    },
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
  const pointsByWaste = (res.data || []).map((wt) => {
    const rewardConfig = wt.rewardConfig || null;
    const realFactor = wt.pointsPerUnit ?? rewardConfig?.pointsPerUnit ?? 0;

    return {
      id: String(wt.wasteTypeId),
      wasteTypeId: wt.wasteTypeId,
      rewardConfigId: rewardConfig?.rewardConfigId || null,
      name: wt.wasteTypeName,
      desc: `Đơn vị: ${wt.unitType}`,
      factor: realFactor,
      allowed_variance_percent:
        rewardConfig?.allowedVariancePercent ??
        rewardConfig?.allowed_variance_percent ??
        0,
      description: rewardConfig?.description || "",
      unitType: wt.unitType,
      hasRewardConfig: Boolean(rewardConfig),
    };
  });
  return { ...FAKE_BASE, pointsByWaste };
}

export async function saveRewardSlaRules(payload) {
  await new Promise((r) => setTimeout(r, 450));
  return { ok: true };
}

export {
  createWasteType,
  deleteWasteType,
  createRewardConfig,
  updateRewardConfigById,
  updateWasteType,
};
