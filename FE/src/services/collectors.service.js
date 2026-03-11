import { httpGet } from "./http";

const FAKE_FILTERS = {
  status: ["Tất cả", "Sẵn sàng", "Đang bận", "Nghỉ phép"],
};

const BASE_ROWS = [
  {
    id: "C1_2045",
    name: "Nguyễn Văn An",
    code: "CL_2045",
    avatarSeed: "NVA",
    status: "ready",
    tasks: 0,
    lastActive: "Vừa mới đây",
  },
  {
    id: "C1_2702",
    name: "Trần Thị Bảo",
    code: "CL_2702",
    avatarSeed: "TTB",
    status: "busy",
    tasks: 3,
    lastActive: "12 phút trước",
  },
  {
    id: "C1_2688",
    name: "Lê Văn Cường",
    code: "CL_2688",
    avatarSeed: "LVC",
    status: "ready",
    tasks: 0,
    lastActive: "1 giờ trước",
  },
  {
    id: "C1_2201",
    name: "Phạm Minh Đăng",
    code: "CL_2201",
    avatarSeed: "PMD",
    status: "busy",
    tasks: 5,
    lastActive: "5 phút trước",
  },
  {
    id: "C1_1909",
    name: "Nguyễn Thảo Vy",
    code: "CL_1909",
    avatarSeed: "NTV",
    status: "leave",
    tasks: 0,
    lastActive: "Hôm qua",
  },
  {
    id: "C1_3112",
    name: "Đặng Quốc Huy",
    code: "CL_3112",
    avatarSeed: "DQH",
    status: "ready",
    tasks: 1,
    lastActive: "18 phút trước",
  },
  {
    id: "C1_1555",
    name: "Võ Minh Tài",
    code: "CL_1555",
    avatarSeed: "VMT",
    status: "busy",
    tasks: 2,
    lastActive: "3 phút trước",
  },
];

function makeFake(total = 156) {
  const rows = [];
  for (let i = 1; i <= total; i++) {
    const b = BASE_ROWS[(i - 1) % BASE_ROWS.length];
    rows.push({
      ...b,
      id: `${b.id}_${i}`,
      code: `CL_${String(2000 + i).padStart(4, "0")}`,
      name: `${b.name}`,
      tasks: b.status === "busy" ? ((i % 6) + 1) : (i % 9 === 0 ? 1 : 0),
      lastActive: b.status === "leave" ? "Hôm qua" : (i % 5 === 0 ? "12 phút trước" : "Vừa mới đây"),
    });
  }
  return rows;
}

function summaryFrom(rows) {
  const total = rows.length;
  const ready = rows.filter((r) => r.status === "ready").length;
  const busy = rows.filter((r) => r.status === "busy").length;
  const leave = rows.filter((r) => r.status === "leave").length;
  return { total, ready, busy, leave };
}

export async function getCollectors(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    const {
      status = "Tất cả",
      onlyReady = false,
      page = 1,
      pageSize = 4,
      q = "",
    } = params || {};

    let rows = makeFake(156);

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.code.toLowerCase().includes(s));
    }

    if (onlyReady) rows = rows.filter((r) => r.status === "ready");

    if (status !== "Tất cả") {
      if (status === "Sẵn sàng") rows = rows.filter((r) => r.status === "ready");
      if (status === "Đang bận") rows = rows.filter((r) => r.status === "busy");
      if (status === "Nghỉ phép") rows = rows.filter((r) => r.status === "leave");
    }

    const summary = summaryFrom(makeFake(156));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    return {
      filters: FAKE_FILTERS,
      summary,
      result: { total, page, pageSize, rows: pageRows },
    };
  }

  return await httpGet(`/api/enterprise/collectors?${new URLSearchParams(params).toString()}`);
}