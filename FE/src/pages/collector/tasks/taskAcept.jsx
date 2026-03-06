import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	CheckCircle2,
	Circle,
	Clock3,
	MapPin,
	Navigation,
	PhoneCall,
	Truck,
	X,
} from "lucide-react";
import { ALL_TASKS } from "./taskData";

const WORKFLOW_STEPS = [
	"Đã nhận",
	"Đang di chuyển",
	"Đã đến nơi",
	"Đang thu gom",
	"Hoàn thành",
];

function parseSlaToSeconds(slaText) {
	const match = slaText?.match(/(\d+)/);
	const value = match ? Number(match[1]) : 60;

	if (slaText?.toLowerCase().includes("giờ")) {
		return value * 3600;
	}

	if (slaText?.toLowerCase().includes("phút")) {
		return value * 60;
	}

	return value;
}

function formatDuration(totalSeconds) {
	const safeSeconds = Math.max(0, totalSeconds);
	const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, "0");
	const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, "0");
	const seconds = String(safeSeconds % 60).padStart(2, "0");

	return `${hours}:${minutes}:${seconds}`;
}

function TaskAccept() {
	const navigate = useNavigate();
	const { taskId } = useParams();
	const { state } = useLocation();

	const task = useMemo(() => {
		if (state?.task) {
			return state.task;
		}

		return ALL_TASKS.find((item) => item.id.replace("#", "") === taskId) || null;
	}, [state, taskId]);

	const [currentStep, setCurrentStep] = useState(2);
	const [incidentOpen, setIncidentOpen] = useState(false);
	const [incidentNote, setIncidentNote] = useState("");
	const [incidentNotice, setIncidentNotice] = useState("");
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		parseSlaToSeconds(task?.sla)
	);

	const reporterPhoneLabel = "0909 123 456";
	const reporterPhoneRaw = "0909123456";

	useEffect(() => {
		setRemainingSeconds(parseSlaToSeconds(task?.sla));
	}, [task]);

	useEffect(() => {
		const timer = setInterval(() => {
			setRemainingSeconds((prev) => Math.max(0, prev - 1));
		}, 1000);

		return () => clearInterval(timer);
	}, []);

	if (!task) {
		return (
			<div className="bg-gray-50 min-h-screen font-sans p-6">
				<div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
					<p className="text-gray-500 mb-4">Không tìm thấy nhiệm vụ đã nhận.</p>
					<button
						onClick={() => navigate("/collector/tasks")}
						className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold"
					>
						Quay lại danh sách
					</button>
				</div>
			</div>
		);
	}

	const destination = `${task.area}, ${task.district}, TP. Hồ Chí Minh`;

	const openDirection = () => {
		const query = encodeURIComponent(destination);
		window.open(
			`https://www.google.com/maps/search/?api=1&query=${query}`,
			"_blank",
			"noopener,noreferrer"
		);
	};

	const hasArrived = currentStep >= 3;

	const handleMarkArrived = () => {
		setCurrentStep((prev) => Math.max(prev, 3));
	};

	const openCallSender = () => {
		window.location.href = `tel:${reporterPhoneRaw}`;
	};

	const handleSendIncident = () => {
		if (incidentNote.trim() === "") {
			return;
		}

		setIncidentOpen(false);
		setIncidentNotice("Đã gửi báo cáo sự cố thành công. Quản lý sẽ liên hệ sớm.");
		setIncidentNote("");
	};

	const isOverdue = remainingSeconds === 0;
	const countdownText = formatDuration(remainingSeconds);

	return (
		<div className="bg-gray-50 min-h-screen font-sans pb-10">
			<main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-5">
				<div className="flex items-center justify-between">
					<div className="text-sm">
						<Link to="/collector/tasks" className="text-green-500 font-medium">
							Nhiệm vụ
						</Link>
						<span className="text-gray-400"> / </span>
						<Link
							to={`/collector/tasks/${task.id.replace("#", "")}`}
							state={{ task }}
							className="text-green-500 font-medium"
						>
							Chi tiết nhiệm vụ
						</Link>
						<span className="text-gray-400"> / </span>
						<span className="text-gray-500">Đi tới điểm thu gom</span>
					</div>

					<span className="px-3 py-1.5 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-100 font-medium inline-flex items-center gap-1.5">
						<Truck className="w-4 h-4" />
						Đang di chuyển
					</span>
				</div>

				<div>
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
						Đang xử lý nhiệm vụ {task.id}
					</h1>
					<p className="text-green-600 text-sm lg:text-base mt-1">
						Theo dõi lộ trình và cập nhật tiến độ tại đây.
					</p>
				</div>

				<div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 shadow-sm">
					<div className="grid grid-cols-1 md:grid-cols-5 gap-2">
						{WORKFLOW_STEPS.map((step, idx) => {
							const order = idx + 1;
							const done = order <= currentStep;

							return (
								<div
									key={step}
									className={`rounded-xl border px-3 py-2.5 text-sm ${
										done
											? "bg-green-50 border-green-200 text-green-700"
											: "bg-gray-50 border-gray-200 text-gray-500"
									}`}
								>
									<div className="inline-flex items-center gap-2 font-medium">
										{done ? (
											<CheckCircle2 className="w-4 h-4" />
										) : (
											<Circle className="w-4 h-4" />
										)}
										{step}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
					<div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
						<div className="text-sm font-semibold text-gray-800 inline-flex items-center gap-2 mb-3">
							<MapPin className="w-4 h-4 text-green-500" />
							Lộ trình đến điểm thu gom
						</div>

						<div className="h-105 rounded-xl overflow-hidden border border-gray-100">
							<iframe
								title="Lộ trình nhiệm vụ"
								className="w-full h-full border-0"
								src="https://www.openstreetmap.org/export/embed.html?bbox=106.68,10.76,106.73,10.80&layer=mapnik&marker=10.7769,106.7009"
								loading="lazy"
							/>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
							<div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-[0.12em] uppercase mb-2">
								<Clock3 className="w-4 h-4" />
								Thời hạn xử lý còn lại
							</div>
							<p className={`text-3xl font-bold ${isOverdue ? "text-red-600" : "text-green-600"}`}>
								{countdownText}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								{isOverdue
									? "Đã quá hạn xử lý. Vui lòng cập nhật trạng thái ngay."
									: "Thời gian tự giảm theo giây kể từ lúc nhận nhiệm vụ."}
							</p>
						</div>

						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
							<InfoRow label="Mã nhiệm vụ" value={task.id} />
							<InfoRow label="Khu vực" value={task.area} />
							<InfoRow label="Quận" value={task.district} />
							<InfoRow label="Loại rác" value={task.wasteType} />
							<InfoRow label="Người gửi" value={reporterPhoneLabel} icon={<PhoneCall className="w-4 h-4 text-blue-500" />} />
							<InfoRow label="Điểm đến" value={destination} />
						</div>
					</div>
				</div>

				<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
					<div className="flex flex-wrap lg:flex-nowrap gap-3">
						<button
							onClick={handleMarkArrived}
							disabled={hasArrived}
							className="flex-1 min-w-45 rounded-xl bg-green-500 text-white py-3 font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{hasArrived ? "Đã đến nơi" : "Đã đến nơi"}
						</button>

						<button
							onClick={() => setIncidentOpen(true)}
							className="flex-1 min-w-45 rounded-xl bg-red-50 text-red-700 py-3 font-semibold hover:bg-red-100 inline-flex items-center justify-center gap-2"
						>
							<AlertTriangle className="w-4 h-4" />
							Báo Cáo Sự Cố
						</button>

						<button
							onClick={openCallSender}
							className="flex-1 min-w-45 rounded-xl bg-blue-50 text-blue-700 py-3 font-semibold hover:bg-blue-100 inline-flex items-center justify-center gap-2"
						>
							<PhoneCall className="w-4 h-4" />
							Gọi Người Gửi
						</button>

						<button
							onClick={openDirection}
							className="flex-1 min-w-45 rounded-xl border border-green-200 text-green-700 py-3 font-semibold hover:bg-green-50 inline-flex items-center justify-center gap-2"
						>
							<Navigation className="w-4 h-4" />
							Mở GGMap
						</button>
					</div>

					{incidentNotice && (
						<div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
							{incidentNotice}
						</div>
					)}
				</div>
			</main>

			<IncidentReportModal
				open={incidentOpen}
				note={incidentNote}
				onClose={() => setIncidentOpen(false)}
				onNoteChange={setIncidentNote}
				onConfirm={handleSendIncident}
			/>
		</div>
	);
}

function IncidentReportModal({ open, note, onClose, onNoteChange, onConfirm }) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/35" onClick={onClose} />
			<div className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-100 shadow-2xl p-5">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-gray-900">Báo cáo sự cố</h3>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
					>
						<X className="w-4 h-4 mx-auto" />
					</button>
				</div>

				<p className="text-sm text-gray-600 mb-2">
					Mô tả nhanh sự cố bạn đang gặp phải khi di chuyển hoặc xử lý nhiệm vụ.
				</p>
				<textarea
					value={note}
					onChange={(e) => onNoteChange(e.target.value)}
					rows={4}
					placeholder="Ví dụ: Không thể vào hẻm do đường bị chắn, cần hỗ trợ điều phối..."
					className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
				/>

				<div className="mt-5 flex items-center justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
					>
						Hủy
					</button>
					<button
						onClick={onConfirm}
						disabled={note.trim() === ""}
						className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Gửi báo cáo
					</button>
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value, icon }) {
	return (
		<div>
			<p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
			<p className="text-sm text-gray-800 font-semibold inline-flex items-center gap-2">
				{icon}
				{value}
			</p>
		</div>
	);
}

export default TaskAccept;
