import { request } from "./apiClient";

const DEFAULT_MAP_LOCATION = { lat: 10.776261, lng: 106.66602 };
const DEFAULT_IMAGE_URL = "https://picsum.photos/1200/800?random=11";
const SLA_TOTAL_MINUTES = 4 * 60;
const MAX_REPORT_SCAN = 500;

const STATUS_LABELS = {
  PENDING: "Chờ xử lý",
  ACCEPTED: "Đã tiếp nhận",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang thu gom",
  COLLECTED: "Đã thu gom",
  REJECTED: "Đã từ chối",
};

function getAuthHeaders() {
  const token =
    typeof window !== "undefined" && window.localStorage
      ? window.localStorage.getItem("accessToken")
      : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  return date.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ...DEFAULT_MAP_LOCATION };
  }

  return { lat, lng };
}

function formatWeightEstimate(weight) {
  const numericWeight = Number(weight);
  if (!Number.isFinite(numericWeight) || numericWeight < 0) {
    return "Chưa cập nhật";
  }

  return `${numericWeight.toFixed(1)} kg`;
}

function isSlaOverdue(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;

  const elapsedMinutes = (Date.now() - date.getTime()) / (1000 * 60);
  return elapsedMinutes > SLA_TOTAL_MINUTES;
}

function formatPriority(status, createdAt) {
  const normalizedStatus = String(status || "PENDING").toUpperCase();

  if (normalizedStatus === "PENDING") {
    return isSlaOverdue(createdAt) ? "Cao" : "Trung bình";
  }

  if (normalizedStatus === "REJECTED") {
    return "Thấp";
  }

  return "Bình thường";
}

function buildTimeline(rawReport) {
  const status = String(rawReport?.status || "PENDING").toUpperCase();
  const createdAtText = formatDateTime(rawReport?.createdAt) || "Không rõ thời gian";

  const timeline = [
    {
      title: "Báo cáo được gửi",
      time: createdAtText,
      state: "done",
    },
  ];

  if (status === "PENDING") {
    timeline.push({ title: "Chờ admin tiếp nhận", time: "Đang chờ xử lý", state: "active" });
    timeline.push({ title: "Lên lịch thu gom", time: "Chưa bắt đầu", state: "todo" });
    return timeline;
  }

  timeline.push({ title: "Chờ admin tiếp nhận", time: createdAtText, state: "done" });

  if (status === "REJECTED") {
    timeline.push({
      title: "Báo cáo bị từ chối",
      time: rawReport?.reason || "Không có lý do",
      state: "active",
    });
    return timeline;
  }

  if (status === "ACCEPTED") {
    timeline.push({ title: "Lên lịch thu gom", time: "Đang lên lịch", state: "active" });
    return timeline;
  }

  if (status === "ASSIGNED") {
    timeline.push({ title: "Lên lịch thu gom", time: "Đã phân công", state: "active" });
    return timeline;
  }

  if (status === "IN_PROGRESS") {
    timeline.push({ title: "Lên lịch thu gom", time: "Đã phân công", state: "done" });
    timeline.push({ title: "Collector đang thu gom", time: "Đang thực hiện", state: "active" });
    return timeline;
  }

  if (status === "COLLECTED") {
    timeline.push({ title: "Lên lịch thu gom", time: "Đã phân công", state: "done" });
    timeline.push({ title: "Đã thu gom hoàn tất", time: "Hoàn tất", state: "done" });
    return timeline;
  }

  timeline.push({ title: `Trạng thái: ${status}`, time: createdAtText, state: "active" });
  return timeline;
}

function extractSingleReport(response) {
  if (response?.data && !Array.isArray(response.data) && typeof response.data === "object") {
    return response.data;
  }

  if (response && !Array.isArray(response) && typeof response === "object") {
    return response;
  }

  return null;
}

function extractReportList(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
}

function mapApiReportToDetail(rawReport, fallbackReportId) {
  const location = normalizeLocation(rawReport?.location);
  const firstAttachment = Array.isArray(rawReport?.attachments)
    ? rawReport.attachments.find((item) => item?.fileUri)
    : null;

  const wasteTypeName = rawReport?.wasteType?.name || "Không rõ";
  const unitType = rawReport?.wasteType?.unitType || "";
  const wasteTypeLabel = unitType ? `${wasteTypeName} (${unitType})` : wasteTypeName;
  const normalizedStatus = String(rawReport?.status || "PENDING").toUpperCase();

  return {
    id: rawReport?.wasteReportId || rawReport?.id || fallbackReportId,
    status: STATUS_LABELS[normalizedStatus] || normalizedStatus,
    createdAt: formatDateTime(rawReport?.createdAt) || "Không rõ thời gian",
    imageUrl: firstAttachment?.fileUri || rawReport?.imageUrl || DEFAULT_IMAGE_URL,
    wasteType: wasteTypeLabel,
    weightEstimate: formatWeightEstimate(rawReport?.weight),
    reporter: {
      name: rawReport?.citizen?.fullname || rawReport?.reporter?.name || "Không rõ",
      phone: rawReport?.citizen?.phone || rawReport?.reporter?.phone || "Không có SĐT",
    },
    priority: formatPriority(normalizedStatus, rawReport?.createdAt),
    note: rawReport?.description || rawReport?.note || "Không có mô tả từ người dân",
    description: rawReport?.description || rawReport?.note || "",
    address:
      rawReport?.address ||
      `Tọa độ: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
    location,
    timeline: buildTimeline(rawReport),
    assignedCollector: rawReport?.assignedCollector || null,
    reason: rawReport?.reason || null,
  };
}

async function findReportByEnterpriseList(reportId, headers) {
  const response = await request("/enterprise/reports", {
    method: "GET",
    params: {
      page: 1,
      limit: MAX_REPORT_SCAN,
    },
    headers,
  });

  const rows = extractReportList(response);
  return (
    rows.find(
      (item) =>
        String(item?.wasteReportId || item?.id || "") === String(reportId || ""),
    ) || null
  );
}

export async function getReportDetail(reportId) {
  if (!reportId) {
    throw new Error("Thiếu mã báo cáo để tải chi tiết");
  }

  const normalizedReportId = String(reportId).replace(/^#/, "");
  const headers = getAuthHeaders();
  let report = null;

  try {
    const detailResponse = await request(`/reports/${normalizedReportId}`, {
      method: "GET",
      headers,
    });
    report = extractSingleReport(detailResponse);
  } catch {
    // Fallback sang endpoint danh sách nếu hệ thống chưa mở route detail riêng cho enterprise.
  }

  if (!report) {
    report = await findReportByEnterpriseList(normalizedReportId, headers);
  }

  if (!report) {
    throw new Error("Không tìm thấy báo cáo theo mã được chọn");
  }

  return mapApiReportToDetail(report, normalizedReportId);
}

export async function updateReportAction(payload) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }

  return await request(
    `/enterprise/reports/action?${new URLSearchParams(payload).toString()}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  );
}