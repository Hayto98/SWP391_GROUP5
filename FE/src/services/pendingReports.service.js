import { httpGet } from "./http";

const FAKE = {
  filters: {
    wards: ["Tất cả Quận", "Quận 1", "Quận 3", "Quận 5", "Quận 7", "Thủ Đức"],
    wasteTypes: ["Tất cả", "Nhựa", "Giấy & Carton", "Kim loại", "Điện tử"],
    wasteSubTypes: ["Tất cả", "PET", "HDPE", "Giấy", "Carton", "Nhôm", "Sắt", "F-voiet"],
    weights: ["Tất cả", "< 20kg", "20kg", "20–50kg", "> 50kg", "> 20kg"],
    sorts: ["Hết hạn SLA", "Mới nhất", "Khối lượng lớn"],
  },
  summary: { pending: 12 },
};

function fakeRows() {
  return [
    {
      code: "#RP001",
      ward: "Phường Bến Nghé",
      district: "Quận 1, TP. Hồ Chí Minh",
      waste: "Nhựa (PET)",
      wasteTone: "blue",
      weightKg: 45.0,
      sla: { type: "left", text: "2 giờ còn lại", tone: "orange" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP002",
      ward: "Phường Tân Phong",
      district: "Quận 7, TP. Hồ Chí Minh",
      waste: "Giấy & Carton",
      wasteTone: "green",
      weightKg: 120.5,
      sla: { type: "left", text: "5 giờ còn lại", tone: "orange" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP003",
      ward: "Phường 2",
      district: "Quận 5, TP. Hồ Chí Minh",
      waste: "Kim loại",
      wasteTone: "gray",
      weightKg: 300.0,
      sla: { type: "expired", text: "Quá hạn", tone: "red" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP004",
      ward: "Phường Đa Kao",
      district: "Quận 1, TP. Hồ Chí Minh",
      waste: "Điện tử (F-voiet)",
      wasteTone: "purple",
      weightKg: 15.2,
      sla: { type: "unknown", text: "…", tone: "muted" },
      actions: ["accept", "reject"],
    },
    {
      code: "#RP005",
      ward: "Phường Hiệp Bình Chánh",
      district: "Quận Thủ Đức, TP. Hồ Chí Minh",
      waste: "Nhựa (PET)",
      wasteTone: "blue",
      weightKg: 60.0,
      sla: { type: "left", text: "1 giờ còn lại", tone: "orange" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP006",
      ward: "Phường 8",
      district: "Quận 3, TP. Hồ Chí Minh",
      waste: "Giấy",
      wasteTone: "green",
      weightKg: 22.0,
      sla: { type: "left", text: "8 giờ còn lại", tone: "orange" },
      actions: ["accept", "reject"],
    },
    {
      code: "#RP007",
      ward: "Phường 10",
      district: "Quận 3, TP. Hồ Chí Minh",
      waste: "Nhựa (HDPE)",
      wasteTone: "blue",
      weightKg: 18.0,
      sla: { type: "left", text: "12 giờ còn lại", tone: "orange" },
      actions: ["accept", "reject"],
    },
    {
      code: "#RP008",
      ward: "Phường 5",
      district: "Quận 7, TP. Hồ Chí Minh",
      waste: "Kim loại",
      wasteTone: "gray",
      weightKg: 80.0,
      sla: { type: "expired", text: "Quá hạn", tone: "red" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP009",
      ward: "Phường 1",
      district: "Quận 1, TP. Hồ Chí Minh",
      waste: "Giấy & Carton",
      wasteTone: "green",
      weightKg: 52.0,
      sla: { type: "left", text: "3 giờ còn lại", tone: "orange" },
      actions: ["contact", "reject"],
    },
    {
      code: "#RP010",
      ward: "Phường 14",
      district: "Quận 5, TP. Hồ Chí Minh",
      waste: "Nhựa (PET)",
      wasteTone: "blue",
      weightKg: 26.0,
      sla: { type: "left", text: "6 giờ còn lại", tone: "orange" },
      actions: ["accept", "reject"],
    },
    {
      code: "#RP011",
      ward: "Phường 6",
      district: "Quận 7, TP. Hồ Chí Minh",
      waste: "Điện tử",
      wasteTone: "purple",
      weightKg: 40.0,
      sla: { type: "unknown", text: "…", tone: "muted" },
      actions: ["accept", "reject"],
    },
    {
      code: "#RP012",
      ward: "Phường Linh Trung",
      district: "Quận Thủ Đức, TP. Hồ Chí Minh",
      waste: "Kim loại",
      wasteTone: "gray",
      weightKg: 95.0,
      sla: { type: "expired", text: "Quá hạn", tone: "red" },
      actions: ["contact", "reject"],
    },
  ];
}

export async function getPendingReports(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    const {
      page = 1,
      pageSize = 5,
      ward = "Tất cả Quận",
      wasteType = "Tất cả",
      wasteSubType = "Tất cả",
      weight = "Tất cả",
      sort = "Hết hạn SLA",
      q = "",
    } = params || {};

    let rows = fakeRows();

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.code.toLowerCase().includes(s) ||
          r.ward.toLowerCase().includes(s) ||
          r.district.toLowerCase().includes(s)
      );
    }

    if (ward !== "Tất cả Quận") rows = rows.filter((r) => r.district.includes(ward));

    if (wasteType !== "Tất cả") rows = rows.filter((r) => r.waste.toLowerCase().includes(wasteType.toLowerCase()));
    if (wasteSubType !== "Tất cả") rows = rows.filter((r) => r.waste.toLowerCase().includes(wasteSubType.toLowerCase()));

    if (weight !== "Tất cả") {
      rows = rows.filter((r) => {
        const w = r.weightKg;
        if (weight === "< 20kg") return w < 20;
        if (weight === "20kg") return w === 20;
        if (weight === "20–50kg") return w >= 20 && w <= 50;
        if (weight === "> 50kg") return w > 50;
        if (weight === "> 20kg") return w > 20;
        return true;
      });
    }

    if (sort === "Hết hạn SLA") {
      const rank = (r) => (r.sla.type === "expired" ? 0 : r.sla.type === "left" ? 1 : 2);
      rows = [...rows].sort((a, b) => rank(a) - rank(b));
    } else if (sort === "Khối lượng lớn") {
      rows = [...rows].sort((a, b) => b.weightKg - a.weightKg);
    } else {
      rows = [...rows];
    }

    const total = rows.length;
    const start = (page - 1) * pageSize;
    const pageRows = rows.slice(start, start + pageSize);

    return {
      summary: { pending: total },
      filters: FAKE.filters,
      result: { total, page, pageSize, rows: pageRows },
    };
  }

  return await httpGet(`/api/enterprise/reports/pending?${new URLSearchParams(params).toString()}`);
}

export async function exportPendingReports(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 450));
    return { ok: true };
  }

  return await httpGet(`/api/enterprise/reports/pending/export?${new URLSearchParams(params).toString()}`);
}

export async function updatePendingReportStatus(payload) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }

  return await httpGet(`/api/enterprise/reports/pending/action?${new URLSearchParams(payload).toString()}`);
}