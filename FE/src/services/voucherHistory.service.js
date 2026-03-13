const STORAGE_KEY = "enterprise-voucher-history";
const MAX_ENTRIES = 300;

const ACTION_LABELS = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
  toggle_on: "Bật",
  toggle_off: "Tắt",
};

function canUseStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function formatDateTime(isoDate) {
  try {
    return new Date(isoDate).toLocaleString("vi-VN", {
      hour12: false,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function readAll() {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // Ignore storage write errors in development.
  }
}

export function recordVoucherHistory({
  action,
  voucherId,
  voucherCode,
  voucherName,
  detail,
}) {
  const normalizedAction = String(action || "").trim();
  if (!normalizedAction) return null;

  const now = new Date().toISOString();
  const entry = {
    id: `vch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action: normalizedAction,
    actionLabel: ACTION_LABELS[normalizedAction] || normalizedAction,
    voucherId: String(voucherId || ""),
    voucherCode: String(voucherCode || "").toUpperCase(),
    voucherName: voucherName || "Không xác định",
    detail: detail || "",
    createdAt: now,
    createdAtText: formatDateTime(now),
  };

  const all = readAll();
  writeAll([entry, ...all]);
  return entry;
}

export function getAllVoucherHistory() {
  return readAll();
}
