export default function JobHistoryTable({
  jobs,
  total,
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
        Tổng kết quả: <span className="font-semibold text-gray-900">{total}</span>
      </div>

      {jobs.length === 0 ? (
        <div className="py-14 text-center text-gray-500 text-sm">
          Không có dữ liệu phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Mã CV</th>
                <th className="text-left px-4 py-3 font-semibold">Ngày hoàn thành</th>
                <th className="text-left px-4 py-3 font-semibold">Khu vực</th>
                <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                <th className="text-left px-4 py-3 font-semibold">Kết quả SLA</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-900">{job.id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.completedDate} - {job.completedTime}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.area}</td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Đã thu gom
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {job.slaResult === "on-time" ? (
                      <span className="text-green-600 font-medium">Đúng hạn</span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        Trễ {job.lateMinutes || 0} phút
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50"
        >
          Trước
        </button>
        <span className="text-xs text-gray-600">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
