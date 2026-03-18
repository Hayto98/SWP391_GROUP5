import { getWasteTypes, toggleWasteTypeStatus } from "./enterpriseWasteType.service";

const FAKE_META = {
  orgName: "Doanh nghiệp Tái chế A",
  rule: {
    title: "Quy định tiếp nhận",
    desc: "Chỉ nhận báo cáo thuộc loại vật đã chọn. Việc thay đổi sẽ ảnh hưởng trực tiếp đến các đề xuất gom được gắn tới doanh nghiệp tự động.",
    status: "ĐANG HIỆU LỰC",
  },
  storage: {
    used: 4.02,
    total: 24.0,
    unit: "tấn",
  },
};

// Icon theo tên loại rác (đơn giản hóa)
function guessIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("giấy") || n.includes("carton") || n.includes("paper")) return "paper";
  if (n.includes("nhựa") || n.includes("plastic") || n.includes("pet")) return "recycle";
  if (n.includes("thủy tinh") || n.includes("glass") || n.includes("chai")) return "glass";
  if (n.includes("kim loại") || n.includes("sắt") || n.includes("nhôm") || n.includes("lon")) return "metal";
  return "bolt";
}

export async function getAcceptWasteConfig() {
  // Gọi API thật: GET /enterprise/waste-types
  const res = await getWasteTypes({ page: 1, limit: 100 });
  const wasteTypes = res.data || [];

  const categories = wasteTypes.map((wt) => ({
    id: String(wt.wasteTypeId),
    wasteTypeId: wt.wasteTypeId,
    name: wt.wasteTypeName,
    desc: `Đơn vị: ${wt.unitType}`,
    icon: guessIcon(wt.wasteTypeName),
    enabled: wt.isActive !== false, // active mặc định = true
    disabledCard: false,
  }));

  return { ...FAKE_META, categories };
}

// Gọi API PATCH /enterprise/waste-types/:wasteTypeId/status
export async function updateAcceptWasteCategory({ categoryId, enabled }) {
  // enabled=true → isActive=true | enabled=false → isActive=false
  const res = await fetch(`http://localhost:3000/enterprise/waste-types/${categoryId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive: enabled })
  });
  if (!res.ok) throw new Error('Cập nhật trạng thái loại rác thất bại');
  return res.json();
}