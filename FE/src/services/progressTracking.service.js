import { httpGet } from "./http";

const FAKE = {
  summary: {
    totalTasks: { value: 24, deltaText: "+12% so với hôm qua" },
    onTime: { value: 19, rateText: "82% • hiệu suất" },
    slaRisk: { value: 5, noteText: "Cần xử lý ngay" },
  },
  tabs: [
    { key: "all", label: "Tất cả (24)" },
    { key: "assigned", label: "Đã phân công (4)" },
    { key: "moving", label: "Đang di chuyển (12)" },
    { key: "collecting", label: "Đã thu gom (8)" },
  ],
  sorts: ["SLA Gần nhất", "Mới nhất", "Tiến độ cao"],
  kpis: {
    avgLoad: 78,
    avgTimeDelta: 15,
    totalDistanceKm: 142,
    collected: { done: 84, total: 110 },
  },
  routes: [
    {
      id: "COL-8821",
      location: "Khu vực Q1",
      collector: "Phạm Minh D.",
      status: "moving",
      progress: 92,
      progressText: "Gần đích",
      sla: { type: "risk", text: "02:15" },
      action: "Chi tiết",
    },
    {
      id: "COL-8830",
      location: "Khu vực Q. Bình Tân",
      collector: "Trần Thị B.",
      status: "assigned",
      progress: 10,
      progressText: "Chưa khởi hành",
      sla: { type: "expired", text: "QUÁ HẠN" },
      action: "Liên hệ ngay",
    },
    {
      id: "COL-8829",
      location: "Khu vực Q5",
      collector: "Nguyễn Văn A.",
      status: "moving",
      progress: 65,
      progressText: "Đang trên đường",
      sla: { type: "ok", text: "08:42" },
      action: "Chi tiết",
    },
    {
      id: "COL-8825",
      location: "Khu vực Q. Thạnh Trị",
      collector: "Lê Văn C.",
      status: "done",
      progress: 100,
      progressText: "Hoàn tất",
      sla: { type: "done", text: "XONG" },
      action: "Chi tiết",
    },
  ],
};

export async function getProgressTracking(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    const { tab = "all", sort = "SLA Gần nhất" } = params || {};
    let rows = [...FAKE.routes];

    if (tab === "assigned") rows = rows.filter((r) => r.status === "assigned");
    if (tab === "moving") rows = rows.filter((r) => r.status === "moving");
    if (tab === "collecting") rows = rows.filter((r) => r.status === "collecting");
    if (tab === "done") rows = rows.filter((r) => r.status === "done");

    if (sort === "SLA Gần nhất") {
      const rank = (r) => (r.sla.type === "expired" ? 0 : r.sla.type === "risk" ? 1 : r.sla.type === "ok" ? 2 : 3);
      rows.sort((a, b) => rank(a) - rank(b));
    } else if (sort === "Tiến độ cao") {
      rows.sort((a, b) => b.progress - a.progress);
    }

    return { ...FAKE, routes: rows };
  }

  return await httpGet(`/api/enterprise/monitoring/progress?${new URLSearchParams(params).toString()}`);
}