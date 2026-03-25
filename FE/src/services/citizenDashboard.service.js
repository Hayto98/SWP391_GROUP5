import { request } from "./apiClient";

export function getCitizenDashboardStatistics(params = {}) {
  let url = "/citizen/dashboard/statistics";
  const query = [];
  if (params.month) query.push(`month=${params.month}`);
  if (params.year) query.push(`year=${params.year}`);
  if (query.length) url += `?${query.join("&")}`;
  return request(url);
}

