import { httpGet } from "./http";

const FAKE = {
  filters: {
    provinces: ["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"],
    districtsByProvince: {
      "TP. Hồ Chí Minh": ["Quận 1", "Quận 3", "Quận 7", "Thủ Đức"],
      "Hà Nội": ["Quận Cầu Giấy", "Quận Hoàn Kiếm", "Quận Ba Đình"],
      "Đà Nẵng": ["Hải Châu", "Sơn Trà"],
    },
    status: ["Đang hoạt động", "Tạm dừng"],
  },
  stats: { wards: 1245, provinces: 63, pausedAreas: 12 },
  result: {
    total: 124,
    page: 1,
    pageSize: 5,
    rows: [
      { id: "001", province: "TP. Hồ Chí Minh", district: "Quận 1", ward: "Bến Nghé", status: "active" },
      { id: "002", province: "TP. Hồ Chí Minh", district: "Quận 1", ward: "Đa Kao", status: "active" },
      { id: "003", province: "TP. Hồ Chí Minh", district: "Quận 7", ward: "Tân Phong", status: "paused" },
      { id: "004", province: "Hà Nội", district: "Quận Cầu Giấy", ward: "Dịch Vọng", status: "active" },
      { id: "005", province: "Hà Nội", district: "Quận Hoàn Kiếm", ward: "Hàng Bạc", status: "active" },
    ],
  },
};

export async function getServiceAreas(params) {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    const { page = 1, pageSize = 5, province = "Tất cả", district = "Tất cả", status = "Tất cả" } = params || {};
    const all = makeFakeRows();
    const filtered = all.filter((r) => {
      const okProvince = province === "Tất cả" ? true : r.province === province;
      const okDistrict = district === "Tất cả" ? true : r.district === district;
      const okStatus =
        status === "Tất cả"
          ? true
          : status === "Đang hoạt động"
          ? r.status === "active"
          : r.status === "paused";
      return okProvince && okDistrict && okStatus;
    });

    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);

    return {
      filters: FAKE.filters,
      stats: FAKE.stats,
      result: { total: filtered.length, page, pageSize, rows },
    };
  }

  return await httpGet(`/api/enterprise/service-areas?${new URLSearchParams(params).toString()}`);
}

function makeFakeRows() {
  const base = [
    { province: "TP. Hồ Chí Minh", district: "Quận 1", wards: ["Bến Nghé", "Đa Kao", "Bến Thành"] },
    { province: "TP. Hồ Chí Minh", district: "Quận 3", wards: ["Phường 6", "Phường 7", "Phường 8"] },
    { province: "TP. Hồ Chí Minh", district: "Quận 7", wards: ["Tân Phong", "Tân Hưng", "Tân Quy"] },
    { province: "Hà Nội", district: "Quận Cầu Giấy", wards: ["Dịch Vọng", "Mai Dịch", "Nghĩa Tân"] },
    { province: "Hà Nội", district: "Quận Hoàn Kiếm", wards: ["Hàng Bạc", "Hàng Trống", "Hàng Đào"] },
    { province: "Đà Nẵng", district: "Hải Châu", wards: ["Hải Châu I", "Hải Châu II", "Phước Ninh"] },
  ];

  const rows = [];
  let n = 1;

  for (let i = 0; i < 30; i++) {
    const b = base[i % base.length];
    const ward = b.wards[i % b.wards.length];
    const status = i % 7 === 0 ? "paused" : "active";
    rows.push({
      id: String(n).padStart(3, "0"),
      province: b.province,
      district: b.district,
      ward,
      status,
    });
    n++;
  }

  return rows;
}