export default function StatsCards({ jobs }) {
  const onTime = jobs.filter((j) => j.slaResult === "on-time").length;
  const late = jobs.filter((j) => j.slaResult === "late").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">Công việc đã hoàn thành</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{jobs.length}</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-gray-500 font-medium">SLA đúng hạn</p>
        <p className="text-2xl font-bold text-green-600 mt-1">{onTime}</p>
      </div>
      <div className="bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-red-600 font-medium">SLA trễ hạn</p>
        <p className="text-2xl font-bold text-red-600 mt-1">{late}</p>
      </div>
    </div>
  );
}
