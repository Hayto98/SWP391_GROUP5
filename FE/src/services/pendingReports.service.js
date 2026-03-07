import { request } from "./apiClient";

const MAX_PENDING_FETCH = 500;
const SLA_TOTAL_MINUTES = 4 * 60;

const DEFAULT_FILTERS = {
  wards: ["Tất cả Quận"],
  wasteTypes: ["Tất cả"],
  wasteSubTypes: ["Tất cả"],
  weights: ["Tất cả", "< 20kg", "20kg", "20–50kg", "> 50kg", "> 20kg"],
  sorts: ["Hết hạn SLA", "Mới nhất", "Khối lượng lớn"],
};

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getWasteTone(wasteName) {
  const normalized = normalizeText(wasteName);
  if (normalized.includes("nhua")) return "blue";
  if (normalized.includes("giay") || normalized.includes("carton")) return "green";
  if (normalized.includes("kim loai") || normalized.includes("kimloai")) return "gray";
  if (normalized.includes("dien tu") || normalized.includes("dientu")) return "purple";
  return "gray";
}

function formatSla(createdAt, status) {
  if (!createdAt) {
    return { type: "unknown", text: "Không rõ", tone: "muted" };
  }

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return { type: "unknown", text: "Không rõ", tone: "muted" };
  }

  if (status && status !== "PENDING") {
    return { type: "unknown", text: status, tone: "muted" };
  }

  const elapsedMinutes = (Date.now() - createdAtDate.getTime()) / (1000 * 60);
  const remainingMinutes = SLA_TOTAL_MINUTES - elapsedMinutes;

  if (remainingMinutes <= 0) {
    return { type: "expired", text: "Quá hạn", tone: "red" };
  }

  if (remainingMinutes < 60) {
    return {
      type: "left",
      text: `${Math.ceil(remainingMinutes)} phút còn lại`,
      tone: "orange",
    };
  }

  return {
    type: "left",
    text: `${Math.ceil(remainingMinutes / 60)} giờ còn lại`,
    tone: "orange",
  };
}

function mapApiReportToRow(report) {
  const reportId = String(report?.wasteReportId || "");
  const wasteName = report?.wasteType?.name || "Không rõ";
  const unitType = report?.wasteType?.unitType || "";
  const rawWeight = Number(report?.weight);
  const sla = formatSla(report?.createdAt, report?.status);
  const isPending = report?.status === "PENDING";
  const canAccept = isPending;

  return {
    code: reportId ? `#${reportId}` : "#N/A",
    ward: report?.citizen?.fullname || "Không rõ công dân",
    district: report?.citizen?.phone || "Không có SĐT",
    waste: unitType ? `${wasteName} (${unitType})` : wasteName,
    wasteTone: getWasteTone(wasteName),
    weightKg: Number.isFinite(rawWeight) ? rawWeight : 0,
    sla,
    actions: isPending ? ["accept", "reject"] : ["reject"],
    canAccept,
    isAccepted: report?.status === "ACCEPTED" || report?.status === "ASSIGNED",
    createdAt: report?.createdAt || null,
    status: report?.status || "PENDING",
    raw: report,
  };
}

function getWasteSubTypeName(wasteLabel) {
  const match = /\(([^)]+)\)/.exec(String(wasteLabel || ""));
  return match?.[1]?.trim() || String(wasteLabel || "").trim();
}

function buildFilters(allRows) {
  const uniqueCitizenNames = [...new Set(allRows.map((row) => row.ward).filter(Boolean))];
  const uniqueWasteTypes = [...new Set(allRows.map((row) => row.waste).filter(Boolean))];
  const uniqueWasteSubTypes = [...new Set(allRows.map((row) => getWasteSubTypeName(row.waste)).filter(Boolean))];

  return {
    wards: ["Tất cả Quận", ...uniqueCitizenNames],
    wasteTypes: ["Tất cả", ...uniqueWasteTypes],
    wasteSubTypes: ["Tất cả", ...uniqueWasteSubTypes],
    weights: DEFAULT_FILTERS.weights,
    sorts: DEFAULT_FILTERS.sorts,
  };
}

function applyClientFilters(rows, params = {}) {
  const {
    q = "",
    ward = "Tất cả Quận",
    wasteType = "Tất cả",
    wasteSubType = "Tất cả",
    weight = "Tất cả",
    sort = "Hết hạn SLA",
  } = params;

  let nextRows = [...rows];

  if (q.trim()) {
    const search = normalizeText(q.trim());
    nextRows = nextRows.filter((row) =>
      [row.code, row.ward, row.district, row.waste].some((value) =>
        normalizeText(value).includes(search)
      )
    );
  }

  if (ward !== "Tất cả Quận") {
    nextRows = nextRows.filter((row) => row.ward === ward);
  }

  if (wasteType !== "Tất cả") {
    nextRows = nextRows.filter((row) => normalizeText(row.waste).includes(normalizeText(wasteType)));
  }

  if (wasteSubType !== "Tất cả") {
    nextRows = nextRows.filter((row) =>
      normalizeText(getWasteSubTypeName(row.waste)).includes(normalizeText(wasteSubType))
    );
  }

  if (weight !== "Tất cả") {
    nextRows = nextRows.filter((row) => {
      const w = row.weightKg;
      if (weight === "< 20kg") return w < 20;
      if (weight === "20kg") return w === 20;
      if (weight === "20–50kg") return w >= 20 && w <= 50;
      if (weight === "> 50kg") return w > 50;
      if (weight === "> 20kg") return w > 20;
      return true;
    });
  }

  if (sort === "Khối lượng lớn") {
    nextRows.sort((a, b) => b.weightKg - a.weightKg);
  } else if (sort === "Mới nhất") {
    nextRows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } else {
    const rank = (row) => {
      if (row.sla.type === "expired") return 0;
      if (row.sla.type === "left") return 1;
      return 2;
    };
    nextRows.sort((a, b) => rank(a) - rank(b));
  }

  return nextRows;
}

export async function getPendingReports(params) {
  const { page = 1, pageSize = 5 } = params || {};
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedPageSize = Math.max(1, Number(pageSize) || 5);

  const response = await request("/enterprise/reports", {
    method: "GET",
    params: {
      status: "PENDING",
      page: 1,
      limit: MAX_PENDING_FETCH,
    },
    headers: getAuthHeaders(),
  });

  const apiRows = Array.isArray(response?.data) ? response.data : [];
  const mappedRows = apiRows.map(mapApiReportToRow);
  const filteredRows = applyClientFilters(mappedRows, params);

  const total = filteredRows.length;
  const start = (parsedPage - 1) * parsedPageSize;
  const pageRows = filteredRows.slice(start, start + parsedPageSize);

  return {
    summary: { pending: total },
    filters: buildFilters(mappedRows),
    result: {
      total,
      page: parsedPage,
      pageSize: parsedPageSize,
      rows: pageRows,
    },
  };
}

export async function exportPendingReports(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true };
  }

  return await request("/enterprise/reports", {
    method: "GET",
    params: {
      status: "PENDING",
      page: 1,
      limit: MAX_PENDING_FETCH,
      ...params,
    },
    headers: getAuthHeaders(),
  });
}

export async function updatePendingReportStatus(payload) {
  const USE_FAKE_FOR_NOW = false;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }

  const action = String(payload?.action || "").toLowerCase();
  const reportId = String(payload?.reportId || payload?.code || "").replace(/^#/, "");

  if (!reportId) {
    throw new Error("Thiếu reportId để cập nhật trạng thái báo cáo");
  }

  if (action === "accept") {
    const response = await request(`/enterprise/reports/${reportId}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    if (!response?.success) {
      throw new Error(response?.message || "Chấp nhận báo cáo thất bại");
    }

    return {
      ok: true,
      reportId: response?.data?.reportId || reportId,
      status: String(response?.data?.Status || response?.data?.status || "ACCEPTED").toUpperCase(),
      acceptedAt: response?.data?.acceptedAt || null,
      raw: response,
    };
  }

  if (action === "reject") {
    const response = await request(`/enterprise/reports/${reportId}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      data: {
        reason: payload?.reason || "Từ chối từ danh sách chờ xử lý",
      },
    });

    if (!response?.success) {
      throw new Error(response?.message || "Từ chối báo cáo thất bại");
    }

    return {
      ok: true,
      reportId: response?.data?.reportId || reportId,
      status: String(response?.data?.status || "REJECTED").toUpperCase(),
      raw: response,
    };
  }

  return { ok: true };
}