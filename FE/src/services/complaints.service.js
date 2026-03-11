import { httpGet } from "./http";

const FAKE = {
  tabs: [
    { key: "all", label: "Tất cả (24)" },
    { key: "pending", label: "Chờ xử lý (12)" },
    { key: "processing", label: "Đang xử lý (8)" },
    { key: "resolved", label: "Đã giải quyết (4)" },
  ],
  reasons: ["Lý do", "Sai khối lượng", "Bỏ lỡ thu gom", "Thái độ NV", "Khác"],
  list: [
    {
      id: "RP-8802",
      reason: "Sai khối lượng",
      createdAt: "12/10/2023",
      status: "Chờ xử lý",
      severity: "CAO",
      citizen: "Lê Minh H.",
      snippet: "Cân nặng thực tế khác...",
    },
    {
      id: "RP-8795",
      reason: "Bỏ lỡ thu gom",
      createdAt: "11/10/2023",
      status: "Đang xử lý",
      severity: "TRUNG BÌNH",
      citizen: "Trần Thị B.",
      snippet: "Collector không đến...",
    },
    {
      id: "RP-8790",
      reason: "Sai khối lượng",
      createdAt: "10/10/2023",
      status: "Đã giải quyết",
      severity: "THẤP",
      citizen: "Phạm Văn C.",
      snippet: "Đã đối soát xong...",
    },
    {
      id: "RP-8788",
      reason: "Thái độ NV",
      createdAt: "09/10/2023",
      status: "Đang xử lý",
      severity: "TRUNG BÌNH",
      citizen: "Hoàng Ngân",
      snippet: "Nói chuyện thiếu lịch sự...",
    },
  ],
  detailById: {
    "RP-8802": {
      id: "RP-8802",
      createdAt: "12/10/2023 09:45",
      urgent: true,
      title: "Chi tiết Khiếu nại",
      timeline: [
        {
          who: "Citizen (Lê Minh H.)",
          time: "09:45 AM",
          tone: "citizen",
          text:
            "Nhân viên thu gom hôm nay cân sai khối lượng nhựa của tôi. Thực tế tôi cân 5kg nhưng máy tính hiển thị 3.2kg. Đề nghị kiểm tra lại.",
        },
        {
          who: "Hệ thống (Tự động)",
          time: "09:46 AM",
          tone: "system",
          text:
            "Khiếu nại đã được ghi nhận và đang chờ nhân viên phụ trách kiểm tra dữ liệu camera.",
        },
        {
          who: "Đang chờ xử lý",
          time: "Hiện tại",
          tone: "status",
          text: "",
        },
      ],
    },
  },
};

export async function getComplaints(params) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) {
    const { tab = "all", reason = "Lý do" } = params || {};
    let rows = [...FAKE.list];

    if (tab !== "all") {
      const map = { pending: "Chờ xử lý", processing: "Đang xử lý", resolved: "Đã giải quyết" };
      rows = rows.filter((r) => r.status === map[tab]);
    }

    if (reason !== "Lý do") rows = rows.filter((r) => r.reason === reason);

    const first = rows[0]?.id || "RP-8802";
    return { ...FAKE, list: rows, selectedId: first, detail: FAKE.detailById[first] || FAKE.detailById["RP-8802"] };
  }
  return await httpGet(`/api/enterprise/complaints?${new URLSearchParams(params).toString()}`);
}

export async function getComplaintDetail(id) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) return FAKE.detailById[id] || FAKE.detailById["RP-8802"];
  return await httpGet(`/api/enterprise/complaints/${id}`);
}

export async function sendComplaintMessage(payload) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }
  return await httpGet(`/api/enterprise/complaints/send?${new URLSearchParams(payload).toString()}`);
}

export async function escalateComplaint(payload) {
  const USE_FAKE_FOR_NOW = true;
  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }
  return await httpGet(`/api/enterprise/complaints/escalate?${new URLSearchParams(payload).toString()}`);
}