import { httpGet } from "./http";
import { notificationService } from "./notification.service";

// Helper: get access token from localStorage (adjust if you store elsewhere)
function getAccessToken() {
  return localStorage.getItem("accessToken") || "";
}

// Map BE waste type to FE keys/colors
const WASTE_TYPE_KEY = {
  "Nhựa": "plastic",
  "Giấy": "paper",
  "Kim loại": "metal",
};

export async function getEnterpriseOverview(params = {}) {
  try {
    const token = getAccessToken();
    // Build API URL with params
    let { fromDate, toDate, groupBy } = params;
    let url = "http://localhost:3000/enterprise/dashboard/statistics";
    const query = [];
    if (fromDate) query.push(`fromDate=${encodeURIComponent(fromDate)}`);
    if (toDate) query.push(`toDate=${encodeURIComponent(toDate)}`);
    if (groupBy) query.push(`groupBy=${encodeURIComponent(groupBy)}`);
    if (query.length) url += "?" + query.join("&");
    const res = await httpGet(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res?.success || !res.data) throw new Error("No data");
    const d = res.data;

    // Waste breakdown
    const totalWaste = d.wasteByType.reduce((sum, w) => sum + Number(w.quantity || 0), 0);
    const breakdown = d.wasteByType.map((w) => ({
      label: w.wasteType,
      percent: totalWaste ? Math.round((w.quantity / totalWaste) * 100) : 0,
      key: WASTE_TYPE_KEY[w.wasteType] || "other",
    }));

    // Chart (by time)
    const chartLabels = d.reportsByTime.map((r) => r.time);
    const chartValues = d.reportsByTime.map((r) => r.reports);


    // Fetch notifications for enterprise and map to activities
    let activities = [];
    try {
      const notifRes = await notificationService.getNotifications("enterprise", { page: 1, limit: 10 });
      const notifications = notifRes?.data?.items || [];
      activities = notifications.map((n) => {
        // Parse code from message if possible (e.g., WR-2026-0006)
        const codeMatch = n.message.match(/(WR-[\d-]+)/);
        const code = codeMatch ? codeMatch[1] : n.wasteReportId?.slice(0, 8) || "-";
        // Type from notification type or message
        let type = "-";
        if (n.type === "NEW_REPORT_PENDING") type = "Chờ xử lý";
        else if (n.type === "REPORT_COMPLETED") type = "Đã hoàn tất";
        // Time: format createdAt to HH:mm DD/MM
        const date = new Date(n.createdAt);
        const time = date.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + date.toLocaleDateString("vi-VN");
        // Status and badge
        let status = "-", badge = "default";
        if (n.type === "NEW_REPORT_PENDING") { status = "CHỜ XỬ LÝ"; badge = "default"; }
        else if (n.type === "REPORT_COMPLETED") { status = "ĐÃ THU GOM"; badge = "success"; }
        return {
          code,
          district: "-", // Not available
          type,
          time,
          status,
          badge,
        };
      });
    } catch {}

    return {
      summary: {
        pending: d.pendingReports,
        inProgress: d.inProgressReports,
        done: d.totalReports - d.pendingReports - d.inProgressReports,
        slaWarning: 0, // Not available in BE response
        pendingDelta: 0,
        inProgressDelta: 0,
        doneDelta: 0,
        slaDelta: 0,
      },
      chart: {
        active: {
          labels: chartLabels,
          values: chartValues,
        },
      },
      waste: {
        totalText: totalWaste ? `${totalWaste}` : "0",
        totalSubText: "TỔNG CỘNG",
        ringPercent: 100, // Always 100% for total
        breakdown,
      },
      activities,
    };
  } catch (e) {
    return {
      summary: {
        pending: 0,
        inProgress: 0,
        done: 0,
        slaWarning: 0,
        pendingDelta: 0,
        inProgressDelta: 0,
        doneDelta: 0,
        slaDelta: 0,
      },
      chart: { active: { labels: [], values: [] } },
      waste: { totalText: "0", totalSubText: "TỔNG CỘNG", ringPercent: 0, breakdown: [] },
      activities: [],
    };
  }
}