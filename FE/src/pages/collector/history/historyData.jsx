export const PAGE_SIZE = 5;

export const AREA_FILTER_OPTIONS = [
	{ value: "all", label: "Tất cả khu vực" },
	{ value: "quan1", label: "Quận 1" },
	{ value: "quan3", label: "Quận 3" },
	{ value: "quan5", label: "Quận 5" },
	{ value: "binhthanh", label: "Bình Thạnh" },
];

export const SLA_FILTER_OPTIONS = [
	{ value: "all", label: "Tất cả SLA" },
	{ value: "on_time", label: "Đúng hạn" },
	{ value: "late", label: "Trễ hạn" },
];

export const DATE_FILTER_OPTIONS = [
	{ value: "this_month", label: "Tháng này" },
	{ value: "last_month", label: "Tháng trước" },
	{ value: "all", label: "Tất cả" },
];

export const ALL_JOBS = [
	{
		id: "COL-8829",
		completedDate: "12/10/2023",
		completedTime: "14:30 PM",
		area: "Quận 1, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8825",
		completedDate: "12/10/2023",
		completedTime: "10:15 AM",
		area: "Quận 3, TP. HCM",
		status: "collected",
		slaResult: "late",
		lateMinutes: 15,
	},
	{
		id: "COL-8812",
		completedDate: "11/10/2023",
		completedTime: "16:45 PM",
		area: "Quận 1, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8805",
		completedDate: "11/10/2023",
		completedTime: "09:00 AM",
		area: "Bình Thạnh, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8798",
		completedDate: "10/10/2023",
		completedTime: "15:20 PM",
		area: "Quận 5, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8790",
		completedDate: "10/10/2023",
		completedTime: "08:45 AM",
		area: "Quận 1, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8783",
		completedDate: "09/10/2023",
		completedTime: "14:00 PM",
		area: "Quận 3, TP. HCM",
		status: "collected",
		slaResult: "late",
		lateMinutes: 30,
	},
	{
		id: "COL-8775",
		completedDate: "09/10/2023",
		completedTime: "10:30 AM",
		area: "Bình Thạnh, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8768",
		completedDate: "08/10/2023",
		completedTime: "16:15 PM",
		area: "Quận 5, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
	{
		id: "COL-8761",
		completedDate: "08/10/2023",
		completedTime: "09:30 AM",
		area: "Quận 1, TP. HCM",
		status: "collected",
		slaResult: "on-time",
	},
];
