import { request } from "./apiClient";

const MAX_PENDING_FETCH = 500;
const SLA_TOTAL_MINUTES = 4 * 60;

const ALL_WASTE_TYPE = "Tất cả loại rác";
const ALL_WASTE_SUBTYPE = "Tất cả đơn vị rác";
const ALL_WEIGHT = "Tất cả cân nặng";
const ALL_STATUS = "Tất cả trạng thái";

const ALL_WASTE_TYPE_OPTIONS = new Set([ALL_WASTE_TYPE, "Tất cả"]);
const ALL_WASTE_SUBTYPE_OPTIONS = new Set([
  ALL_WASTE_SUBTYPE,
  "Tất cả đơn vị",
  "Tất cả",
]);
const ALL_WEIGHT_OPTIONS = new Set([ALL_WEIGHT, "Tất cả"]);
const ALL_STATUS_OPTIONS = new Set([ALL_STATUS, "Tất cả"]);

const DEFAULT_FILTERS = {
  wasteTypes: [ALL_WASTE_TYPE],
  wasteSubTypes: [ALL_WASTE_SUBTYPE],
  weights: [ALL_WEIGHT, "< 20kg", "20kg", "20–50kg", "> 50kg", "> 20kg"],
  statuses: [ALL_STATUS],
  sorts: ["Mới nhất", "Hết hạn SLA", "Khối lượng lớn"],
};

function formatCreatedDateLabel(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN");
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
  if (normalized.includes("giay") || normalized.includes("carton"))
    return "green";
  if (normalized.includes("kim loai") || normalized.includes("kimloai"))
    return "gray";
  if (normalized.includes("dien tu") || normalized.includes("dientu"))
    return "purple";
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
  const normalizedStatus = String(report?.status || "PENDING").toUpperCase();
  const sla = formatSla(report?.createdAt, normalizedStatus);
  const isPending = normalizedStatus === "PENDING";
  const isAccepted = normalizedStatus === "ACCEPTED";
  const canAccept = isPending;
  const canAssign = isAccepted;

  return {
    code: reportId ? `#${reportId}` : "#N/A",
    reportCode: report?.reportCode || (reportId ? `#${reportId}` : "#N/A"),
    ward: report?.citizen?.fullname || "Không rõ công dân",
    district: report?.citizen?.phone || "Không có SĐT",
    waste: unitType ? `${wasteName} (${unitType})` : wasteName,
    wasteTone: getWasteTone(wasteName),
    weightKg: Number.isFinite(rawWeight) ? rawWeight : 0,
    sla,
    actions: isPending ? ["accept", "reject"] : [],
    canAccept,
    canAssign,
    isAccepted: canAssign,
    createdAt: report?.createdAt || null,
    status: normalizedStatus,
    raw: report,
  };
}

function getWasteSubTypeName(wasteLabel) {
  const match = /\(([^)]+)\)/.exec(String(wasteLabel || ""));
  return match?.[1]?.trim() || String(wasteLabel || "").trim();
}

function buildFilters(allRows) {
  const uniqueWasteTypes = [
    ...new Set(allRows.map((row) => row.waste).filter(Boolean)),
  ];
  const uniqueWasteSubTypes = [
    ...new Set(
      allRows.map((row) => getWasteSubTypeName(row.waste)).filter(Boolean),
    ),
  ];
  const uniqueStatuses = [
    ...new Set(allRows.map((row) => row.status).filter(Boolean)),
  ];

  return {
    wasteTypes: [ALL_WASTE_TYPE, ...uniqueWasteTypes],
    wasteSubTypes: [ALL_WASTE_SUBTYPE, ...uniqueWasteSubTypes],
    weights: DEFAULT_FILTERS.weights,
    statuses: [ALL_STATUS, ...uniqueStatuses],
    sorts: DEFAULT_FILTERS.sorts,
  };
}

function applyClientFilters(rows, params = {}) {
  const {
    q = "",
    createdAt,
    wasteType = ALL_WASTE_TYPE,
    wasteSubType = ALL_WASTE_SUBTYPE,
    weight = ALL_WEIGHT,
    status = ALL_STATUS,
    sort = "Mới nhất",
  } = params;

  const createdAtDate = createdAt ? new Date(createdAt) : null;
  const hasCreatedAtFilter =
    createdAtDate && !Number.isNaN(createdAtDate.getTime());
  const isAllWasteType = ALL_WASTE_TYPE_OPTIONS.has(
    String(wasteType || "").trim(),
  );
  const isAllWasteSubType = ALL_WASTE_SUBTYPE_OPTIONS.has(
    String(wasteSubType || "").trim(),
  );
  const isAllWeight = ALL_WEIGHT_OPTIONS.has(String(weight || "").trim());
  const isAllStatus = ALL_STATUS_OPTIONS.has(String(status || "").trim());

  let nextRows = [...rows];

  if (q.trim()) {
    const search = normalizeText(q.trim());
    nextRows = nextRows.filter((row) =>
      [row.code, row.ward, row.district, row.waste].some((value) =>
        normalizeText(value).includes(search),
      ),
    );
  }

  if (hasCreatedAtFilter) {
    nextRows = nextRows.filter((row) => {
      const rowDate = new Date(row.createdAt || 0);
      if (Number.isNaN(rowDate.getTime())) return false;
      return isSameDay(rowDate, createdAtDate);
    });
  }

  if (!isAllWasteType) {
    nextRows = nextRows.filter((row) =>
      normalizeText(row.waste).includes(normalizeText(wasteType)),
    );
  }

  if (!isAllWasteSubType) {
    nextRows = nextRows.filter((row) =>
      normalizeText(getWasteSubTypeName(row.waste)).includes(
        normalizeText(wasteSubType),
      ),
    );
  }

  if (!isAllWeight) {
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

  if (!isAllStatus) {
    const expectedStatus = normalizeText(status);
    nextRows = nextRows.filter(
      (row) => normalizeText(row.status) === expectedStatus,
    );
  }

  if (sort === "Khối lượng lớn") {
    nextRows.sort((a, b) => b.weightKg - a.weightKg);
  } else if (sort === "Mới nhất") {
    nextRows.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
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
  const reportId = String(payload?.reportId || payload?.code || "").replace(
    /^#/,
    "",
  );

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
      status: String(
        response?.data?.Status || response?.data?.status || "ACCEPTED",
      ).toUpperCase(),
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
