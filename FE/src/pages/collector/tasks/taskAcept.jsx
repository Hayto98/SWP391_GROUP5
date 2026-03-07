import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
	AlertTriangle,
	Clock3,
	MapPin,
	Navigation,
	PhoneCall,
	X,
} from "lucide-react";
import { ALL_TASKS } from "./taskData";
import TaskMissionShell from "./components/TaskMissionShell";

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

	const [incidentOpen, setIncidentOpen] = useState(false);
	const [incidentNote, setIncidentNote] = useState("");
	const [incidentNotice, setIncidentNotice] = useState("");
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		parseSlaToSeconds(task?.sla)
	);

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

	const routeTaskId = task.id.replace("#", "");
	const destination = `${task.area}, ${task.district}, TP. Hồ Chí Minh`;

	const openDirection = () => {
		const query = encodeURIComponent(destination);
		window.open(
			`https://www.google.com/maps/search/?api=1&query=${query}`,
			"_blank",
			"noopener,noreferrer"
		);
	};

	const handleArrived = () => {
		const arrivedAt = new Date().toISOString();
		navigate(`/collector/tasks/${routeTaskId}/collect`, {
			state: { task, arrivedAt },
		});
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

	const summaryItems = [
		{ label: "TASK ID", value: task.id },
		{ label: "REPORT ID", value: `R-${routeTaskId}` },
		{ label: "Địa điểm", value: destination },
		{ label: "Loại rác khai báo", value: task.wasteType },
		{ label: "Hạn chót SLA", value: task.sla },
	];

	return (
		<>
			<TaskMissionShell
				task={task}
				currentStep={2}
				statusLabel="Đang di chuyển"
				statusTone="blue"
				breadcrumbLabel="Đi tới điểm thu gom"
				title={`Đang xử lý nhiệm vụ ${task.id}`}
				subtitle="Theo dõi lộ trình và cập nhật tiến độ tại đây."
				summaryItems={summaryItems}
			>
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

						<SwipeToConfirmArrived onComplete={handleArrived} />
					</div>
				</div>

				<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
					<div className="flex flex-wrap lg:flex-nowrap gap-3">
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
			</TaskMissionShell>

			<IncidentReportModal
				open={incidentOpen}
				note={incidentNote}
				onClose={() => setIncidentOpen(false)}
				onNoteChange={setIncidentNote}
				onConfirm={handleSendIncident}
			/>
		</>
	);
}

function SwipeToConfirmArrived({ onComplete }) {
	const THUMB_SIZE = 48;
	const TRACK_PADDING = 4;
	const [progress, setProgress] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [isCompleted, setIsCompleted] = useState(false);
	const [usableWidth, setUsableWidth] = useState(0);

	const trackRef = useRef(null);
	const holdTimerRef = useRef(null);
	const pointerIdRef = useRef(null);
	const completedRef = useRef(false);
	const progressRef = useRef(0);

	useEffect(() => {
		const updateWidth = () => {
			if (!trackRef.current) {
				return;
			}

			const nextWidth =
				trackRef.current.clientWidth - THUMB_SIZE - TRACK_PADDING * 2;
			setUsableWidth(Math.max(0, nextWidth));
		};

		updateWidth();
		window.addEventListener("resize", updateWidth);

		return () => {
			window.removeEventListener("resize", updateWidth);
		};
	}, []);

	useEffect(() => {
		return () => {
			if (holdTimerRef.current) {
				clearTimeout(holdTimerRef.current);
			}
		};
	}, []);

	const getProgressFromClientX = (clientX) => {
		if (!trackRef.current || usableWidth <= 0) {
			return 0;
		}

		const rect = trackRef.current.getBoundingClientRect();
		const x = clientX - rect.left - TRACK_PADDING - THUMB_SIZE / 2;
		const ratio = x / usableWidth;
		return Math.max(0, Math.min(100, ratio * 100));
	};

	const syncProgress = (nextProgress) => {
		progressRef.current = nextProgress;
		setProgress(nextProgress);
	};

	const completeSwipe = () => {
		if (completedRef.current) {
			return;
		}

		completedRef.current = true;
		setIsCompleted(true);
		syncProgress(100);
		setTimeout(() => {
			onComplete();
		}, 420);
	};

	const handlePointerDown = (event) => {
		if (isCompleted) {
			return;
		}

		pointerIdRef.current = event.pointerId;
		setIsDragging(true);
		syncProgress(getProgressFromClientX(event.clientX));
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event) => {
		if (!isDragging || pointerIdRef.current !== event.pointerId || isCompleted) {
			return;
		}

		syncProgress(getProgressFromClientX(event.clientX));
	};

	const finalizePointer = () => {
		if (!isDragging || isCompleted) {
			return;
		}

		setIsDragging(false);
		if (progressRef.current >= 83) {
			completeSwipe();
		} else {
			syncProgress(0);
		}
	};

	const startHoldConfirm = () => {
		if (isCompleted) {
			return;
		}

		holdTimerRef.current = setTimeout(() => {
			completeSwipe();
		}, 1000);
	};

	const cancelHoldConfirm = () => {
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
			holdTimerRef.current = null;
		}
	};

	return (
		<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
			<p className="text-sm font-semibold text-gray-800 mb-2">Vuốt để xác nhận đã đến nơi</p>
			<p className="text-xs text-gray-500 mb-3">
				Kéo thanh sang phải, hoặc nhấn giữ 1 giây nếu bạn đang dùng chuột.
			</p>

			<div
				ref={trackRef}
				className="relative h-14 rounded-full select-none touch-none"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={finalizePointer}
				onPointerCancel={finalizePointer}
			>
				<div className="absolute inset-0 rounded-full border border-gray-200 bg-gray-100" />
				<div
					className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-[width] duration-150"
					style={{ width: `${progress}%` }}
				/>
				<div
					className="absolute top-1 left-1 h-12 w-12 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-green-600 transition-transform duration-75"
					style={{ transform: `translateX(${(usableWidth * progress) / 100}px)` }}
				>
					<Navigation className="w-5 h-5" />
				</div>
				<div
					className={`absolute inset-0 flex items-center justify-center text-sm font-semibold pointer-events-none ${
						progress > 45 || isCompleted ? "text-white" : "text-gray-500"
					}`}
				>
					{isCompleted ? "Đã xác nhận đã đến nơi" : "Kéo sang phải để xác nhận"}
				</div>
			</div>

			<button
				onMouseDown={startHoldConfirm}
				onMouseUp={cancelHoldConfirm}
				onMouseLeave={cancelHoldConfirm}
				onTouchStart={startHoldConfirm}
				onTouchEnd={cancelHoldConfirm}
				disabled={isCompleted}
				className="mt-3 w-full rounded-xl border border-gray-200 bg-white text-gray-700 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Nhấn giữ 1 giây để xác nhận
			</button>
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

export default TaskAccept;
