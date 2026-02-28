import { httpGet } from "./http";

const FAKE = {
  filters: {
    from: "01/05/2024",
    to: "24/05/2024",
    provinces: ["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
    districts: ["Tất cả", "Quận 1", "Quận 3", "Quận 7", "Thủ Đức"],
    wards: ["Tất cả", "Bến Nghé", "Đa Kao", "Tân Phong", "Linh Trung"],
    wasteTypes: ["Tất cả", "Giấy", "Nhựa", "Kim loại", "Thủy tinh", "Khác"],
    status: ["Đang hoạt động", "Tạm dừng"],
  },
  kpis: {
    totalKg: 45820,
    reports: 1248,
    collectors: 86,
    onTimeRate: 98.4,
  },
  donut: {
    center: "100%",
    items: [
      { label: "Giấy", value: 45, tone: "green" },
      { label: "Nhựa", value: 35, tone: "blue" },
      { label: "Kim loại", value: 12, tone: "gray" },
      { label: "Thủy tinh", value: 8, tone: "orange" },
    ],
  },
  bars: {
    labels: ["Q.1", "Q.3", "Q.7", "Thủ Đức", "Q.5"],
    values: [42, 68, 95, 61, 30],
  },
  trend: {
    labels: ["01", "05", "10", "15", "20", "24"],
    values: [18, 22, 19, 25, 23, 28],
  },
  table: {
    total: 1248,
    page: 1,
    pageSize: 4,
    rows: [
      { id: "#REP-2024-001", date: "24/05/2024 09:30", location: "Quận 1, TP.HCM", waste: "Nhựa", kg: 125.5, collector: "Nguyễn Văn Tùng", status: "ON" },
      { id: "#REP-2024-002", date: "24/05/2024 09:25", location: "Quận 3, TP.HCM", waste: "Giấy", kg: 84.2, collector: "Lê Hồng Hạnh", status: "ON" },
      { id: "#REP-2024-003", date: "24/05/2024 09:15", location: "Thủ Đức, TP.HCM", waste: "Kim loại", kg: 210.0, collector: "Phạm Văn Võ", status: "ON" },
      { id: "#REP-2024-004", date: "23/05/2024 14:20", location: "Quận 7, TP.HCM", waste: "Thủy tinh", kg: 45.8, collector: "Trần Ngọc Duy", status: "ON" },
    ],
  },
};

export async function getCollectionAnalytics(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.pageSize || 4);

    const all = makeFakeRows(18);
    const start = (page - 1) * pageSize;
    const rows = all.slice(start, start + pageSize);

    return {
      ...FAKE,
      table: { ...FAKE.table, total: all.length, page, pageSize, rows },
    };
  }

  return await httpGet(`/api/enterprise/analytics/collection?${new URLSearchParams(params).toString()}`);
}

function makeFakeRows(n) {
  const base = [
    { location: "Quận 1, TP.HCM", waste: "Nhựa", collector: "Nguyễn Văn Tùng", kg: 125.5 },
    { location: "Quận 3, TP.HCM", waste: "Giấy", collector: "Lê Hồng Hạnh", kg: 84.2 },
    { location: "Thủ Đức, TP.HCM", waste: "Kim loại", collector: "Phạm Văn Võ", kg: 210.0 },
    { location: "Quận 7, TP.HCM", waste: "Thủy tinh", collector: "Trần Ngọc Duy", kg: 45.8 },
    { location: "Quận 5, TP.HCM", waste: "Giấy", collector: "Ngô Minh Khang", kg: 66.1 },
    { location: "Hà Nội", waste: "Nhựa", collector: "Đỗ Anh Tuấn", kg: 98.3 },
  ];

  const rows = [];
  for (let i = 0; i < n; i++) {
    const b = base[i % base.length];
    const day = String((i % 24) + 1).padStart(2, "0");
    rows.push({
      id: `#REP-2024-${String(i + 1).padStart(3, "0")}`,
      date: `${day}/05/2024 ${String((9 + (i % 6))).padStart(2, "0")}:${String((10 + i) % 60).padStart(2, "0")}`,
      location: b.location,
      waste: b.waste,
      kg: Number((b.kg + (i % 7) * 4.3).toFixed(1)),
      collector: b.collector,
      status: "ON",
    });
  }
  return rows;
}