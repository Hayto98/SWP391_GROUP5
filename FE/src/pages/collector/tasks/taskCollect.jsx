import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Camera, ClipboardList, Flag, PackageCheck } from "lucide-react";
import { ALL_TASKS } from "./taskData";
import TaskMissionShell from "./components/TaskMissionShell";

const SORTING_QUALITY_OPTIONS = [
	{ value: "good", label: "Phân loại tốt (sạch, đúng nhóm)" },
	{ value: "mixed", label: "Phân loại chưa chuẩn (lẫn 1 phần)" },
	{ value: "bad", label: "Chưa phân loại" },
];

const COLLECTION_RESULT_OPTIONS = [
	{ value: "completed", label: "Thu gom đầy đủ" },
	{ value: "partial", label: "Thu gom một phần" },
	{ value: "failed", label: "Không thể thu gom" },
];

const VIOLATION_REASON_OPTIONS = [
	{ value: "weight_gap_50", label: "Khối lượng sai lệch quá lớn (>50%)" },
	{ value: "wrong_type", label: "Loại rác thực tế không đúng báo cáo" },
	{ value: "wrong_location", label: "Vị trí báo cáo không chính xác" },
	{ value: "duplicate_spam", label: "Báo cáo trùng lặp / nghi ngờ spam" },
];

function formatDateTime(isoString) {
	if (!isoString) {
		return "Vừa cập nhật";
	}

	const parsed = new Date(isoString);
	if (Number.isNaN(parsed.getTime())) {
		return "Vừa cập nhật";
	}

	return parsed.toLocaleString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function TaskCollect() {
	const navigate = useNavigate();
	const { taskId } = useParams();
	const { state } = useLocation();

	const task = useMemo(() => {
		if (state?.task) {
			return state.task;
		}

		return ALL_TASKS.find((item) => item.id.replace("#", "") === taskId) || null;
	}, [state, taskId]);

	const [actualWeightKg, setActualWeightKg] = useState("");
	const [bagCount, setBagCount] = useState("");
	const [sortingQuality, setSortingQuality] = useState("");
	const [collectionResult, setCollectionResult] = useState("completed");
	const [collectionNote, setCollectionNote] = useState("");
	const [photoFiles, setPhotoFiles] = useState([]);
	const [isUntruthfulReport, setIsUntruthfulReport] = useState(true);
	const [violationReason, setViolationReason] = useState("weight_gap_50");
	const [violationNote, setViolationNote] = useState("");
	const [notice, setNotice] = useState("");

	if (!task) {
		return (
			<div className="bg-gray-50 min-h-screen font-sans p-6">
				<div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
					<p className="text-gray-500 mb-4">Không tìm thấy nhiệm vụ thu gom.</p>
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
	const arrivedAtText = formatDateTime(state?.arrivedAt);

	const summaryItems = [
		{ label: "TASK ID", value: task.id },
		{ label: "REPORT ID", value: `R-${routeTaskId}` },
		{ label: "Địa điểm", value: destination },
		{ label: "Loại rác khai báo", value: task.wasteType },
		{ label: "Hạn chót SLA", value: task.sla },
	];

	const isValidWeight = Number(actualWeightKg) > 0;
	const isValidBagCount = Number(bagCount) > 0;
	const canComplete =
		isValidWeight &&
		isValidBagCount &&
		sortingQuality !== "" &&
		collectionResult !== "" &&
		photoFiles.length > 0;

	const handleFileChange = (event) => {
		const files = Array.from(event.target.files || []);
		setPhotoFiles(files);
	};

	const handleComplete = () => {
		if (!canComplete) {
			setNotice("Vui lòng nhập đủ thông tin bắt buộc trước khi hoàn tất.");
			return;
		}

		if (isUntruthfulReport && violationReason === "") {
			setNotice("Vui lòng chọn lý do vi phạm trước khi xác nhận.");
			return;
		}

		setNotice(
			isUntruthfulReport
				? "Đã đánh dấu báo cáo không trung thực và xác nhận hoàn tất thu gom."
				: "Đã xác nhận hoàn tất thu gom. Đang quay lại danh sách nhiệm vụ..."
		);
		setTimeout(() => {
			navigate("/collector/tasks");
		}, 500);
	};

	return (
		<TaskMissionShell
			task={task}
			currentStep={4}
			statusLabel="Đang thu gom"
			statusTone="amber"
			breadcrumbLabel="Nhập kết quả thu gom"
			title={`Cập nhật kết quả nhiệm vụ ${task.id}`}
			subtitle="Nhập dữ liệu thu gom thực tế trước khi hoàn tất nhiệm vụ."
			summaryItems={summaryItems}
		>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
				<div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 shadow-sm">
					<div className="inline-flex items-center gap-2 text-gray-800 font-semibold mb-4">
						<ClipboardList className="w-4 h-4 text-green-500" />
						Nhập kết quả Thu gom thực tế
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Khối lượng thực tế (kg) <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								min="0"
								step="0.1"
								value={actualWeightKg}
								onChange={(e) => setActualWeightKg(e.target.value)}
								placeholder="Ví dụ: 18.5"
								className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Số túi/kiện đã thu gom <span className="text-red-500">*</span>
							</label>
							<input
								type="number"
								min="1"
								value={bagCount}
								onChange={(e) => setBagCount(e.target.value)}
								placeholder="Ví dụ: 3"
								className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Mức độ phân loại rác <span className="text-red-500">*</span>
							</label>
							<select
								value={sortingQuality}
								onChange={(e) => setSortingQuality(e.target.value)}
								className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
							>
								<option value="">Chọn mức độ phân loại</option>
								{SORTING_QUALITY_OPTIONS.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Kết quả xử lý <span className="text-red-500">*</span>
							</label>
							<select
								value={collectionResult}
								onChange={(e) => setCollectionResult(e.target.value)}
								className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
							>
								{COLLECTION_RESULT_OPTIONS.map((item) => (
									<option key={item.value} value={item.value}>
										{item.label}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="mt-4">
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Ghi chú thu gom
						</label>
						<textarea
							value={collectionNote}
							onChange={(e) => setCollectionNote(e.target.value)}
							rows={4}
							placeholder="Mô tả thêm: tình trạng điểm tập kết, lưu ý cho điều phối..."
							className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
						/>
					</div>

					<div className="mt-4">
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Ảnh xác nhận tại hiện trường <span className="text-red-500">*</span>
						</label>
						<label className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-sm text-gray-600 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100">
							<Camera className="w-4 h-4" />
							Tải ảnh bằng chứng thu gom
							<input
								type="file"
								accept="image/*"
								multiple
								onChange={handleFileChange}
								className="hidden"
							/>
						</label>

						{photoFiles.length > 0 && (
							<ul className="mt-2 space-y-1 text-xs text-gray-500">
								{photoFiles.map((file) => (
									<li key={`${file.name}-${file.lastModified}`}>
										- {file.name}
									</li>
								))}
							</ul>
						)}
					</div>
				</div>

				<div className="space-y-4">
					<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
						<p className="text-xs text-gray-400 uppercase tracking-[0.12em] font-semibold mb-2">
							Cập nhật hiện trường
						</p>
						<div className="space-y-2">
							<QuickInfo label="Đã đến nơi lúc" value={arrivedAtText} />
							<QuickInfo label="Khu vực" value={task.district} />
							<QuickInfo label="Điểm thu gom" value={task.area} />
							<QuickInfo label="Loại rác khai báo" value={task.wasteType} />
						</div>
					</div>

					<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
						<div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
							<label className="inline-flex items-center gap-2 text-red-700 font-semibold cursor-pointer">
								<input
									type="checkbox"
									checked={isUntruthfulReport}
									onChange={(e) => setIsUntruthfulReport(e.target.checked)}
									className="h-4 w-4 accent-red-600"
								/>
								<Flag className="w-4 h-4" />
								Đánh dấu báo cáo không trung thực
							</label>

							{isUntruthfulReport && (
								<div className="mt-4 space-y-3">
									<p className="text-sm text-red-600">Vui lòng chọn lý do vi phạm:</p>
									<select
										value={violationReason}
										onChange={(e) => setViolationReason(e.target.value)}
										className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
									>
										<option value="">Chọn lý do vi phạm</option>
										{VIOLATION_REASON_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>

									<textarea
										value={violationNote}
										onChange={(e) => setViolationNote(e.target.value)}
										rows={4}
										placeholder="Ghi chú thêm về vi phạm (tùy chọn)..."
										className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
									/>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
				<div>
					<button
						onClick={handleComplete}
						className="w-full rounded-xl bg-green-500 text-white py-3 font-semibold hover:bg-green-600 inline-flex items-center justify-center gap-2"
					>
						<PackageCheck className="w-4 h-4" />
						Xác nhận hoàn tất
					</button>
				</div>

				{notice && (
					<div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
						{notice}
					</div>
				)}
			</div>
		</TaskMissionShell>
	);
}

function QuickInfo({ label, value }) {
	return (
		<div>
			<p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
			<p className="text-sm text-gray-800 font-semibold">{value}</p>
		</div>
	);
}

export default TaskCollect;
