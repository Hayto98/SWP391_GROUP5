import { httpGet } from "./http";

const FAKE = {
  selectedReport: {
    id: "RP-1024",
    status: "Đang chờ xử lý",
    wasteType: "Nhựa & Kim loại",
    address: "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    weightEstimate: "Ước tính: 15–20 kg",
    sla: {
      title: "SLA DEADLINE REMINDER",
      desc: "Hạn chốt xử lý: 14:00 - Còn lại 05 phút",
      linkText: "Xem chính sách SLA",
    },
    location: { lat: 10.776261, lng: 106.66602 },
  },
  collectors: [
    {
      id: "CL_2045",
      name: "Nguyễn Văn An",
      status: "Trực tuyến",
      distanceKm: 1.2,
      etaText: "~ 5 phút di chuyển",
      tasks: 2,
      maxTasks: 5,
      loadPercent: 40,
      canAssign: true,
    },
    {
      id: "CL_2702",
      name: "Trần Minh Tâm",
      status: "Trực tuyến",
      distanceKm: 2.8,
      etaText: "~ 12 phút di chuyển",
      tasks: 4,
      maxTasks: 5,
      loadPercent: 80,
      canAssign: true,
    },
    {
      id: "CL_2688",
      name: "Lê Thị Hoa",
      status: "Bận (Nghỉ trưa)",
      distanceKm: 0.5,
      etaText: "~ 2 phút di chuyển",
      tasks: 0,
      maxTasks: 5,
      loadPercent: 0,
      canAssign: false,
    },
  ],
  miniMap: {
    openMapText: "Mở bản đồ lớn",
  },
};

export async function getDispatchAssign(reportId) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) return { ...FAKE, selectedReport: { ...FAKE.selectedReport, id: reportId || FAKE.selectedReport.id } };

  return await httpGet(`/api/enterprise/dispatch/assign?reportId=${encodeURIComponent(reportId)}`);
}

export async function assignTaskToCollector(payload) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true };
  }

  return await httpGet(`/api/enterprise/dispatch/assign/action?${new URLSearchParams(payload).toString()}`);
}