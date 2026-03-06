import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Clock3, MapPin, Recycle, Scale, X } from "lucide-react";
import { ALL_TASKS } from "./taskData";

const REJECT_REASON_OPTIONS = [
	{
		value: "personal",
		label: "Vấn đề cá nhân",
		hint: "Sức khỏe, phương tiện hoặc lịch trình cá nhân.",
	},
	{
		value: "requester",
		label: "Vấn đề từ người đặt",
		hint: "Thông tin báo cáo thiếu, khó liên hệ hoặc vị trí chưa chính xác.",
	},
	{
		value: "other",
		label: "Khác",
		hint: "Lý do khác không thuộc hai nhóm trên.",
	},
];

function parseSlaMinutes(slaText) {
	const match = slaText?.match(/(\d+)/);
	return match ? Number(match[1]) : 60;
}

function formatClock(secondsLeft) {
	const total = Math.max(0, secondsLeft);
	const hours = String(Math.floor(total / 3600)).padStart(2, "0");
	const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
	const seconds = String(total % 60).padStart(2, "0");
	return { hours, minutes, seconds };
}

function TaskDetail() {
	const navigate = useNavigate();
	const { taskId } = useParams();
	const { state } = useLocation();

	const task = useMemo(() => {
		if (state?.task) {
			return state.task;
		}

		return ALL_TASKS.find((item) => item.id.replace("#", "") === taskId) || null;
	}, [state, taskId]);

	const [status, setStatus] = useState("Đang chờ xử lý");
	const [rejectOpen, setRejectOpen] = useState(false);
	const [warningOpen, setWarningOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [rejectNote, setRejectNote] = useState("");
	const [rejectSummary, setRejectSummary] = useState("");
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		parseSlaMinutes(task?.sla) * 60
	);

	useEffect(() => {
		setRemainingSeconds(parseSlaMinutes(task?.sla) * 60);
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
				<div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
					<p className="text-gray-500 mb-4">Không tìm thấy nhiệm vụ.</p>
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

	const clock = formatClock(remainingSeconds);
	const selectedRejectReason = REJECT_REASON_OPTIONS.find((item) => item.value === rejectReason);
	const canConfirmReject = rejectReason !== "" && rejectNote.trim().length > 0;
	const isFinalized = status === "Đã từ chối" || status === "Đã nhận nhiệm vụ";

	const statusStyle =
		status === "Đã từ chối"
			? "bg-red-50 text-red-700 border-red-100"
			: status === "Đã nhận nhiệm vụ"
				? "bg-blue-50 text-blue-700 border-blue-100"
				: "bg-green-50 text-green-700 border-green-100";

	const handleOpenReject = () => {
		if (isFinalized) {
			return;
		}

		setRejectOpen(true);
		setRejectReason("");
		setRejectNote("");
	};

	const toRouteTaskId = (id) => id.replace("#", "");

	const handleConfirmReject = () => {
		if (!canConfirmReject) {
			return;
		}

		setRejectOpen(false);
		setWarningOpen(true);
	};

	const handleFinalReject = () => {

		setStatus("Đã từ chối");
		setRejectSummary(`${selectedRejectReason?.label}: ${rejectNote.trim()}`);
		setWarningOpen(false);
		navigate("/collector/tasks");
	};

	return (
		<div className="bg-gray-50 min-h-screen font-sans pb-8">
			<main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
				<div className="flex items-center justify-between mb-3">
					<div className="text-sm">
						<Link to="/collector/tasks" className="text-green-500 font-medium">
							Nhiệm vụ
						</Link>
						<span className="text-gray-400"> / </span>
						<span className="text-gray-500">Chi tiết nhiệm vụ</span>
					</div>
					<span className={`px-3 py-1.5 rounded-xl text-sm border font-medium ${statusStyle}`}>
						{status}
					</span>
				</div>

				<h1 className="text-3xl font-bold text-gray-900">Nhiệm vụ #{task.id.replace("#", "WST-")}</h1>
				<p className="text-green-600 text-sm mt-1 mb-6">Báo cáo thu gom rác thải từ người dân</p>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
					<div className="lg:col-span-2 space-y-4">
						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2 text-gray-800 font-semibold">
									<MapPin className="w-4 h-4 text-green-500" />
									Vị trí thu gom
								</div>
								<span className="text-sm text-gray-500">{task.district}, TP. Hồ Chí Minh</span>
							</div>
							<div className="h-64 rounded-xl overflow-hidden border border-gray-100">
								<iframe
									title="Vị trí nhiệm vụ"
									className="w-full h-full border-0"
									src="https://www.openstreetmap.org/export/embed.html?bbox=106.68,10.76,106.73,10.80&layer=mapnik&marker=10.7769,106.7009"
									loading="lazy"
								/>
							</div>
						</div>

						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
							<div className="flex items-center gap-2 text-gray-800 font-semibold mb-3">
								<Recycle className="w-4 h-4 text-green-500" />
								Hình ảnh hiện trường (Từ người dân)
							</div>
							<div className="grid grid-cols-2 gap-3">
								<img
									className="w-full h-56 object-cover rounded-xl"
									src="https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=900&q=80"
									alt="Rac nhua"
								/>
								<img
									className="w-full h-56 object-cover rounded-xl"
									src="https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=900&q=80"
									alt="Rac giay"
								/>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
							<div className="flex items-center gap-2 text-gray-500 text-xs font-semibold tracking-[0.12em] uppercase mb-3">
								<Clock3 className="w-4 h-4" />
								Thời gian phản hồi còn lại
							</div>
							<div className="grid grid-cols-3 gap-2 text-center">
								<TimeBox value={clock.hours} label="Giờ" />
								<TimeBox value={clock.minutes} label="Phút" />
								<TimeBox value={clock.seconds} label="Giây" highlight />
							</div>
						</div>

						<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
							<InfoRow label="Loại rác thải" value={task.wasteType} />
							<InfoRow label="Khối lượng ước tính" value="~15.5 kg" icon={<Scale className="w-4 h-4 text-green-500" />} />
							<InfoRow label="Địa chỉ chi tiết" value="123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM" />
							<div className="grid grid-cols-2 gap-3">
								<InfoRow label="Thời gian tạo" value="Hôm nay, 14:20" />
								<InfoRow label="Người báo cáo" value="Nguyễn Văn A" />
							</div>
							<blockquote className="bg-gray-50 border-l-2 border-green-400 rounded-r-lg px-3 py-2 text-sm italic text-gray-500">
								"Rác đã được phân loại sẵn trong 3 túi lớn, để ngay trước cửa hàng."
							</blockquote>
						</div>

						<div className="pt-2 flex gap-3">
							<button
								onClick={handleOpenReject}
								disabled={isFinalized}
								className="flex-1 rounded-xl bg-gray-100 text-gray-700 py-3 font-semibold hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<X className="w-4 h-4" />
								Từ chối
							</button>
							<button
								onClick={() =>
									navigate(`/collector/tasks/${toRouteTaskId(task.id)}/accept`, {
										state: { task },
									})
								}
								disabled={isFinalized}
								className="flex-1 rounded-xl bg-green-500 text-white py-3 font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Nhận nhiệm vụ
							</button>
						</div>

						{rejectSummary && (
							<div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
								Lý do từ chối: {rejectSummary}
							</div>
						)}
					</div>
				</div>
			</main>

			<RejectReasonModal
				open={rejectOpen}
				reason={rejectReason}
				note={rejectNote}
				onClose={() => setRejectOpen(false)}
				onReasonChange={setRejectReason}
				onNoteChange={setRejectNote}
				onConfirm={handleConfirmReject}
				canConfirm={canConfirmReject}
			/>

			<RejectWarningModal
				open={warningOpen}
				onBack={() => {
					setWarningOpen(false);
					setRejectOpen(true);
				}}
				onConfirm={handleFinalReject}
			/>
		</div>
	);
}

function RejectWarningModal({ open, onBack, onConfirm }) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-60 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/40" onClick={onBack} />
			<div className="relative w-full max-w-md rounded-2xl bg-white border border-red-100 shadow-2xl p-5">
				<h3 className="text-lg font-bold text-gray-900">Xác nhận từ chối nhiệm vụ</h3>
				<p className="text-sm text-gray-600 mt-2 leading-relaxed">
					<span className="font-semibold text-red-600">Lưu ý:</span> Nếu từ chối liên tục 3 lần sẽ bị khóa tài khoản trong vòng 24 giờ.
				</p>

				<div className="mt-5 flex items-center justify-end gap-2">
					<button
						onClick={onBack}
						className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
					>
						Quay lại
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
					>
						Xác nhận hủy
					</button>
				</div>
			</div>
		</div>
	);
}

function RejectReasonModal({
	open,
	reason,
	note,
	onClose,
	onReasonChange,
	onNoteChange,
	onConfirm,
	canConfirm,
}) {
	if (!open) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/35" onClick={onClose} />
			<div className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-100 shadow-2xl p-5">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-bold text-gray-900">Lý do từ chối</h3>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500"
					>
						<X className="w-4 h-4 mx-auto" />
					</button>
				</div>

				<div className="space-y-2">
					{REJECT_REASON_OPTIONS.map((item) => {
						const active = reason === item.value;

						return (
							<label
								key={item.value}
								className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
									active
										? "bg-green-50 border-green-200"
										: "bg-white border-gray-200 hover:bg-gray-50"
								}`}
							>
								<input
									type="radio"
									name="rejectReason"
									value={item.value}
									checked={active}
									onChange={(e) => onReasonChange(e.target.value)}
									className="mt-1 h-4 w-4 accent-green-600"
								/>
								<div>
									<p className="text-sm font-semibold text-gray-800">{item.label}</p>
									<p className="text-xs text-gray-500 mt-0.5">{item.hint}</p>
								</div>
							</label>
						);
					})}
				</div>

				{reason && (
					<div className="mt-4">
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Ghi chú chi tiết
						</label>
						<textarea
							value={note}
							onChange={(e) => onNoteChange(e.target.value)}
							rows={4}
							placeholder="Nhập nội dung ghi chú để xác nhận từ chối..."
							className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
						/>
					</div>
				)}

				<div className="mt-5 flex items-center justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
					>
						Hủy
					</button>
					<button
						onClick={onConfirm}
						disabled={!canConfirm}
						className="px-4 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
					>
						Xác nhận từ chối
					</button>
				</div>
			</div>
		</div>
	);
}

function TimeBox({ value, label, highlight }) {
	return (
		<div className={`rounded-xl py-3 ${highlight ? "bg-green-100" : "bg-gray-100"}`}>
			<p className={`text-3xl font-bold ${highlight ? "text-green-600" : "text-gray-900"}`}>{value}</p>
			<p className="text-xs text-gray-500 mt-1 uppercase">{label}</p>
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

export default TaskDetail;
