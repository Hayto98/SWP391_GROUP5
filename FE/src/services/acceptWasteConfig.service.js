import { httpGet } from "./http";

const FAKE = {
  orgName: "Doanh nghiệp Tái chế A",
  rule: {
    title: "Quy định tiếp nhận",
    desc:
      "Chỉ nhận báo cáo thuộc loại vật đã chọn. Việc thay đổi sẽ ảnh hưởng trực tiếp đến các đề xuất gom được gắn tới doanh nghiệp tự động.",
    status: "ĐANG HIỆU LỰC",
  },
  storage: {
    used: 4.02,
    total: 24.0,
    unit: "tấn",
  },
  categories: [
    {
      id: "paper",
      name: "Giấy",
      desc: "Sách, vở, báo, bìa carton, tài liệu...",
      icon: "paper",
      enabled: true,
    },
    {
      id: "plastic",
      name: "Nhựa",
      desc: "Chai nhựa, can nhựa, bao bì...",
      icon: "recycle",
      enabled: true,
    },
    {
      id: "metal",
      name: "Kim loại",
      desc: "Sắt vụn, nhôm, đồng, vỏ lon...",
      icon: "metal",
      enabled: false,
    },
    {
      id: "glass",
      name: "Thủy tinh",
      desc: "Chai lọ thủy tinh, kính vỡ...",
      icon: "glass",
      enabled: true,
    },
    {
      id: "mixed",
      name: "Rác tái chế tổng hợp",
      desc: "Khó phân loại, nhiều thành phần, rác tổng hợp tái chế...",
      icon: "mixed",
      enabled: true,
    },
    {
      id: "metal2",
      name: "Kim loại",
      desc: "Sắt vụn, nhôm, tong, vỏ lon...",
      icon: "metal",
      enabled: false,
      disabledCard: true,
    },
  ],
};

export async function getAcceptWasteConfig() {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) return FAKE;

  try {
    return await httpGet("/api/enterprise/accept-waste-config");
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function updateAcceptWasteCategory() {
  const USE_FAKE_FOR_NOW = true;

  if (USE_FAKE_FOR_NOW) {
    await new Promise((r) => setTimeout(r, 350));
    return { ok: true };
  }

  return { ok: true };
}