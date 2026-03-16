const STORAGE_KEY = "enterprise-report-assignment-history";
const MAX_ENTRIES = 300;

function canUseStorage() {
	return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
	} catch {
		// Ignore storage write errors in development.
	}
}

export function recordReportAssignment({ reportId, reportCode, collectorId, collectorName }) {
	const normalizedReportId = String(reportId || "").replace(/^#/, "");
	const normalizedReportCode = String(reportCode || "").trim();
	if (!normalizedReportId) return null;

	const now = new Date().toISOString();
	const entry = {
		id: `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		reportId: normalizedReportId,
		reportCode: normalizedReportCode || `#${normalizedReportId}`,
		collectorId: String(collectorId || ""),
		collectorName: collectorName || "Không xác định",
		assignedAt: now,
		assignedAtText: formatDateTime(now),
	};

	const all = readAll();
	writeAll([entry, ...all]);
	return entry;
}

export function getReportAssignmentHistory(reportId) {
	const normalizedReportId = String(reportId || "").replace(/^#/, "");
	if (!normalizedReportId) return [];

	return readAll().filter((entry) => String(entry.reportId) === normalizedReportId);
}

export function getLatestReportAssignment(reportId) {
	const history = getReportAssignmentHistory(reportId);
	return history.length ? history[0] : null;
}

export function getAllReportAssignmentHistory() {
	return readAll();
}
