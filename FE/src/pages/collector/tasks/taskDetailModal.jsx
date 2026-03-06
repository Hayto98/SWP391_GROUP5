export function TaskDetailModal({ task, onClose, onConfirm }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4">
			<div className="absolute inset-0 bg-black/30" onClick={onClose} />
			<div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-6">
				<h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">Chi tiết nhiệm vụ</h3>
				<p className="text-xs lg:text-sm text-gray-500 mb-5">Xác nhận nhận nhiệm vụ để bắt đầu xử lý.</p>

				<div className="space-y-3 text-xs lg:text-sm">
					<div className="flex justify-between gap-3">
						<span className="text-gray-400">Mã báo cáo</span>
						<span className="font-semibold text-gray-800">{task.id}</span>
					</div>
					<div className="flex justify-between gap-3">
						<span className="text-gray-400">Khu vực</span>
						<span className="font-semibold text-gray-800 text-right">{task.area}</span>
					</div>
					<div className="flex justify-between gap-3">
						<span className="text-gray-400">Loại rác</span>
						<span className="font-semibold text-gray-800">{task.wasteType}</span>
					</div>
					<div className="flex justify-between gap-3">
						<span className="text-gray-400">SLA</span>
						<span
							className={`font-semibold ${
								task.slaUrgent ? "text-red-600" : "text-gray-800"
							}`}
						>
							{task.sla}
						</span>
					</div>
				</div>

				<div className="mt-6 flex justify-end gap-2">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
					>
						Đóng
					</button>
					<button
						onClick={onConfirm}
						className="px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600"
					>
						Xác nhận nhận
					</button>
				</div>
			</div>
		</div>
	);
}
