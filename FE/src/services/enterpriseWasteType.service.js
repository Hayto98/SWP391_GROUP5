import { request } from "./apiClient";

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Fake data dùng cho mock ─────────────────────────────────────────────────
let FAKE_WASTE_TYPES = [
  {
    wasteTypeId: 1,
    wasteTypeName: "Nhựa tái chế (PET)",
    unitType: "KG",
    isActive: true,
  },
  {
    wasteTypeId: 2,
    wasteTypeName: "Giấy & Carton",
    unitType: "KG",
    isActive: true,
  },
  {
    wasteTypeId: 3,
    wasteTypeName: "Kim loại (Nhôm, Sắt)",
    unitType: "KG",
    isActive: true,
  },
  {
    wasteTypeId: 4,
    wasteTypeName: "Thủy tinh",
    unitType: "LON",
    isActive: true,
  },
  {
    wasteTypeId: 5,
    wasteTypeName: "Rác điện tử",
    unitType: "KG",
    isActive: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/enterprise/waste-types
 * Tạo WasteType mới
 * @param {{ wasteTypeName: string, unitType: "KG" | "LON" }} payload
 */
export async function createWasteType(payload) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(400);
    const newItem = {
      wasteTypeId: Date.now(),
      wasteTypeName: payload.wasteTypeName,
      unitType: (payload.unitType || "KG").toUpperCase(),
      isActive: true,
    };
    FAKE_WASTE_TYPES.push(newItem);
    return { success: true, data: newItem };
  }

    return request("/enterprise/waste-types", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: payload,
  });
}

export async function createRewardConfig(payload) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(300);
    return { success: true, data: payload };
  }

  return request("/enterprise/reward-config", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: {
      wasteTypeId: payload.wasteTypeId,
      pointsPerUnit: payload.pointsPerUnit,
      description: payload.description,
      allowedVariancePercent: payload.allowedVariancePercent ?? payload.allowed_variance_percent,
      minKgRequired: payload.minKgRequired,
      maxKgRequired: payload.maxKgRequired,
      penaltyPercent: payload.penaltyPercent,
    },
  });
}

export async function updateRewardConfigById(rewardConfigId, payload) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(300);
    return { success: true, data: payload };
  }

  return request(`/api/enterprise/reward-config/${rewardConfigId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: {
      wasteTypeId: payload.wasteTypeId,
      pointsPerUnit: payload.pointsPerUnit,
      description: payload.description,
      allowed_variance_percent: payload.allowed_variance_percent,
      allowedVariancePercent: payload.allowed_variance_percent,
    },
  });
}

// Backward-compatible alias used by older code.
export const updateRewardConfig = createRewardConfig;

/**
 * GET /api/enterprise/waste-types
 * Lấy danh sách WasteType (có phân trang)
 * @param {{ isActive?: boolean, unitType?: string, page?: number, limit?: number }} params
 */
export async function getWasteTypes(params = {}) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(300);
    let data = [...FAKE_WASTE_TYPES];
    if (params.isActive !== undefined)
      data = data.filter((w) => w.isActive === params.isActive);
    if (params.unitType)
      data = data.filter((w) => w.unitType === params.unitType.toUpperCase());
    const page = params.page || 1;
    const limit = params.limit || 20;
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: data.length,
        totalPages: Math.ceil(data.length / limit),
      },
    };
  }

    return request("/enterprise/waste-types", {
    method: "GET",
    headers: getAuthHeaders(),
    params,
  });
}

/**
 * GET /api/enterprise/waste-types/:wasteTypeId
 * Lấy WasteType theo ID
 * @param {number} wasteTypeId
 */
export async function getWasteTypeById(wasteTypeId) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await delay(250);
    const item = FAKE_WASTE_TYPES.find(
      (w) => w.wasteTypeId === Number(wasteTypeId),
    );
    if (!item) throw new Error("WasteType không tồn tại");
    return { success: true, data: item };
  }

    return request(`/enterprise/waste-types/${wasteTypeId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
}

/**
 * PUT /api/enterprise/waste-types/:wasteTypeId
 * Cập nhật WasteType
 * @param {number} wasteTypeId
 * @param {{ wasteTypeName?: string, unitType?: "KG" | "LON" }} payload
 */
export async function updateWasteType(wasteTypeId, payload) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(400);
    const idx = FAKE_WASTE_TYPES.findIndex(
      (w) => w.wasteTypeId === Number(wasteTypeId),
    );
    if (idx === -1) throw new Error("WasteType không tồn tại");
    FAKE_WASTE_TYPES[idx] = { ...FAKE_WASTE_TYPES[idx], ...payload };
    return { success: true, data: FAKE_WASTE_TYPES[idx] };
  }

    return request(`/enterprise/waste-types/${wasteTypeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: {
      waste_type_name: payload.waste_type_name,
      unit_type: payload.unit_type,
      wasteTypeName: payload.waste_type_name,
      unitType: payload.unit_type,
    },
  });
}

/**
 * PATCH /api/enterprise/waste-types/:wasteTypeId/status
 * Toggle trạng thái isActive của WasteType
 * @param {number} wasteTypeId
 * @param {boolean} isActive
 */
export async function toggleWasteTypeStatus(wasteTypeId, isActive) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(350);
    const idx = FAKE_WASTE_TYPES.findIndex(
      (w) => w.wasteTypeId === Number(wasteTypeId),
    );
    if (idx === -1) throw new Error("WasteType không tồn tại");
    FAKE_WASTE_TYPES[idx].isActive = isActive;
    return {
      success: true,
      data: { wasteTypeId: Number(wasteTypeId), isActive },
    };
  }

    return request(`/enterprise/waste-types/${wasteTypeId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    data: { isActive },
  });
}

/**
 * DELETE /api/enterprise/waste-types/:wasteTypeId
 * Soft-delete WasteType
 * @param {number} wasteTypeId
 */
export async function deleteWasteType(wasteTypeId) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await delay(350);
    const idx = FAKE_WASTE_TYPES.findIndex(
      (w) => w.wasteTypeId === Number(wasteTypeId),
    );
    if (idx === -1) throw new Error("WasteType không tồn tại");
    FAKE_WASTE_TYPES.splice(idx, 1);
    return { success: true, message: "WasteType đã được xóa" };
  }

    return request(`/enterprise/waste-types/${wasteTypeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}
