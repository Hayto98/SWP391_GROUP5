import { request } from "./apiClient";

const MAX_REPORT_SCAN = 500;
const MAX_TASKS_PER_COLLECTOR = 10;
const DEFAULT_LOCATION = { lat: 10.776261, lng: 106.66602 };

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatWeightEstimate(weight) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric) || numeric < 0) return "Chưa cập nhật";
  return `${numeric.toFixed(1)} kg`;
}

function mapReportToSelectedReport(report, fallbackReportId) {
  const lat = Number(report?.location?.lat);
  const lng = Number(report?.location?.lng);
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
  const wasteName = report?.wasteType?.name || "Không rõ";
  const unitType = report?.wasteType?.unitType || "";

  return {
    id: report?.wasteReportId || fallbackReportId,
    status: String(report?.status || "PENDING"),
    wasteType: unitType ? `${wasteName} (${unitType})` : wasteName,
    address: hasLocation
      ? `Tọa độ: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
      : "Chưa có tọa độ",
    weightEstimate: formatWeightEstimate(report?.weight),
    location: hasLocation ? { lat, lng } : { ...DEFAULT_LOCATION },
  };
}

function mapCollectorToPopupItem(collector) {
  const tasks = Number(collector?.currentAssignedCount);
  const safeTasks = Number.isFinite(tasks) ? tasks : 0;
  const loadPercent = Math.min(
    100,
    Math.max(0, Math.round((safeTasks / MAX_TASKS_PER_COLLECTOR) * 100)),
  );

  return {
    id: collector?.userAccountId || collector?.id || "",
    name: collector?.fullname || collector?.name || "Không rõ",
    status: "Sẵn sàng",
    distanceKm: 0,
    etaText: "Chưa có dữ liệu ETA",
    tasks: safeTasks,
    maxTasks: MAX_TASKS_PER_COLLECTOR,
    loadPercent,
    canAssign: safeTasks < MAX_TASKS_PER_COLLECTOR,
  };
}

async function findReportByIdFromEnterpriseList(reportId, headers) {
  const response = await request("/enterprise/reports", {
    method: "GET",
    params: {
      page: 1,
      limit: MAX_REPORT_SCAN,
    },
    headers,
  });

  const rows = Array.isArray(response?.data) ? response.data : [];
  return (
    rows.find(
      (item) => String(item?.wasteReportId || "") === String(reportId || ""),
    ) || null
  );
}

export async function getDispatchAssign(reportId) {
  const normalizedReportId = String(reportId || "").replace(/^#/, "");
  if (!normalizedReportId) {
    throw new Error("Thiếu mã báo cáo để gán collector");
  }

  const headers = getAuthHeaders();

  const [report, collectorsResponse] = await Promise.all([
    findReportByIdFromEnterpriseList(normalizedReportId, headers),
    request("/enterprise/collectors/available", {
      method: "GET",
      headers,
    }),
  ]);

  if (!report) {
    throw new Error("Không tìm thấy báo cáo để gán collector");
  }

  const collectorRows = Array.isArray(collectorsResponse)
    ? collectorsResponse
    : Array.isArray(collectorsResponse?.data)
      ? collectorsResponse.data
      : Array.isArray(collectorsResponse?.collectors)
        ? collectorsResponse.collectors
        : [];

  const collectors = collectorRows.map(mapCollectorToPopupItem);

  return {
    selectedReport: mapReportToSelectedReport(report, normalizedReportId),
    collectors,
    miniMap: {
      openMapText: "Mở bản đồ lớn",
    },
  };
}

export async function assignTaskToCollector(payload) {
  const reportId = String(payload?.reportId || "").replace(/^#/, "");
  const collectorUserAccountId = String(
    payload?.collectorUserAccountId || payload?.collectorId || "",
  ).trim();

  if (!reportId || !collectorUserAccountId) {
    throw new Error("Thiếu reportId hoặc collectorUserAccountId để gán");
  }

  const response = await request(`/enterprise/reports/${reportId}/assign`, {
    method: "POST",
    headers: getAuthHeaders(),
    data: {
      collectorUserAccountId,
    },
  });

  if (!response?.success) {
    throw new Error(response?.message || "Gán collector thất bại");
  }

  return {
    ok: true,
    reportId: response?.data?.reportId || reportId,
    status: String(response?.data?.status || "ASSIGNED").toUpperCase(),
    assignedAt: response?.data?.assignedAt || null,
    collector: {
      id: response?.data?.collector?.id || collectorUserAccountId,
      fullname: response?.data?.collector?.fullname || "",
    },
    raw: response,
  };
}
