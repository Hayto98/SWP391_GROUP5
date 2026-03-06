import { Search } from "lucide-react";
import {
  AREA_FILTER_OPTIONS,
  DATE_FILTER_OPTIONS,
  SLA_FILTER_OPTIONS,
} from "../../../pages/collector/history/historyData";

export default function FilterBar({
  searchValue,
  onSearchChange,
  areaFilter,
  onAreaChange,
  dateFilter,
  onDateChange,
  slaFilter,
  onSlaChange,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="relative block md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã công việc (VD: COL-8829)"
            className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>
        <select
          value={areaFilter}
          onChange={(e) => onAreaChange(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {AREA_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={slaFilter}
          onChange={(e) => onSlaChange(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {SLA_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-gray-500">Thời gian:</span>
        {DATE_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDateChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              dateFilter === opt.value
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
