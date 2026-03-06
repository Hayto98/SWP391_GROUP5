import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  ALL_JOBS,
  PAGE_SIZE,
} from "./historyData";
import FilterBar from "../../../components/ui/collectorHistoryUI/FilterBar";
import JobHistoryTable from "../../../components/ui/collectorHistoryUI/JobHistoryTable";
import StatsCards from "../../../components/ui/collectorHistoryUI/StatsCards";

function parseDDMMYYYY(dateStr) {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function toCsvValue(value) {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
}

function History() {
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("this_month");
  const [slaFilter, setSlaFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const now = new Date();

    return ALL_JOBS.filter((job) => {
      const jobDate = parseDDMMYYYY(job.completedDate);

      const matchSearch =
        search === "" ||
        job.id.toLowerCase().includes(search.toLowerCase().replace("#", ""));

      const matchArea =
        areaFilter === "all" ||
        (areaFilter === "quan1" && job.area.includes("Quận 1")) ||
        (areaFilter === "quan3" && job.area.includes("Quận 3")) ||
        (areaFilter === "quan5" && job.area.includes("Quận 5")) ||
        (areaFilter === "binhthanh" && job.area.includes("Bình Thạnh"));

      const matchSla =
        slaFilter === "all" ||
        (slaFilter === "on_time" && job.slaResult === "on-time") ||
        (slaFilter === "late" && job.slaResult === "late");

      const matchDate =
        dateFilter === "all" ||
        (dateFilter === "this_month" &&
          jobDate.getMonth() === now.getMonth() &&
          jobDate.getFullYear() === now.getFullYear()) ||
        (dateFilter === "last_month" && (() => {
          const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return (
            jobDate.getMonth() === lastMonthDate.getMonth() &&
            jobDate.getFullYear() === lastMonthDate.getFullYear()
          );
        })());

      return matchSearch && matchArea && matchSla && matchDate;
    });
  }, [search, areaFilter, slaFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleFilterChange = (setter) => (v) => {
    setter(v);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const handleExportReport = () => {
    if (filtered.length === 0) {
      return;
    }

    const headers = [
      "Ma CV",
      "Ngay hoan thanh",
      "Gio hoan thanh",
      "Khu vuc",
      "Trang thai",
      "Ket qua SLA",
      "Tre phut",
    ];

    const rows = filtered.map((job) => [
      job.id,
      job.completedDate,
      job.completedTime,
      job.area,
      job.status,
      job.slaResult,
      job.lateMinutes || 0,
    ]);

    const csvContent = [
      headers.map(toCsvValue).join(","),
      ...rows.map((row) => row.map(toCsvValue).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateTag = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.setAttribute("download", `collector-history-${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Lịch sử Công việc
            </h1>
            <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
              Xem lại danh sách tất cả các nhiệm vụ đã hoàn thành và đánh giá hiệu suất SLA của bạn trong kỳ vừa qua.
            </p>
          </div>
          <button
            onClick={handleExportReport}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Xuất báo cáo
          </button>
        </div>

        <FilterBar
          searchValue={search}
          onSearchChange={handleFilterChange(setSearch)}
          areaFilter={areaFilter}
          onAreaChange={handleFilterChange(setAreaFilter)}
          dateFilter={dateFilter}
          onDateChange={handleFilterChange(setDateFilter)}
          slaFilter={slaFilter}
          onSlaChange={handleFilterChange(setSlaFilter)}
        />

        <JobHistoryTable
          jobs={paginated}
          total={filtered.length}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <StatsCards jobs={filtered} />
      </div>
    </div>
  );
}

export default History;
