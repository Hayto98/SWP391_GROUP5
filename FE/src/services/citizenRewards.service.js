import { request } from "./apiClient";

function buildParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
}

export function getAvailableVouchers({ page = 1, limit = 10 } = {}) {
  return request("/vouchers", {
    params: buildParams({ page, limit }),
  });
}

export function getRedeemedVouchers() {
  return request("/citizen/vouchers/redeemed");
}

export function getMyPoints() {
  return request("/citizen/me/points");
}

export function getPointHistory({ page = 1, limit = 20, ...filters } = {}) {
  return request("/citizen/points/history", {
    params: buildParams({ page, limit, ...filters }),
  });
}

export function redeemVoucher(voucherId) {
  return request("/citizen/vouchers/redeem", {
    method: "POST",
    data: { voucherId },
  });
}
