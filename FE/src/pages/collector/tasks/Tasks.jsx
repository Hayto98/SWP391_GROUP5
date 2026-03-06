import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import {
  ALL_TASKS,
  AREAS,
  ITEMS_PER_PAGE,
  SLA_SORTS,
  WASTE_TYPES,
} from "./taskData";

const SEARCH_ICON = (
  <Search className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
);

const CHEVRON_DOWN = (
  <ChevronDown className="w-3.5 h-3.5" />
);

const PIN_ICON = (
  <MapPin className="w-3.5 h-3.5" />
);

const TRASH_ICON = (
  <Trash2 className="w-3.5 h-3.5" />
);

const CLOCK_ICON = (
  <Clock3 className="w-3.5 h-3.5" />
);

function Tasks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("Tất cả");
  const [wasteFilter, setWasteFilter] = useState("Nhựa");
  const [slaFilter, setSlaFilter] = useState("Sớm nhất");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let tasks = ALL_TASKS;

    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q) ||
          t.wasteType.toLowerCase().includes(q)
      );
    }
    if (areaFilter !== "Tất cả") {
      tasks = tasks.filter((t) => t.district === areaFilter);
    }
    if (wasteFilter !== "Tất cả") {
      tasks = tasks.filter((t) =>
        t.wasteType.toLowerCase().includes(wasteFilter.toLowerCase())
      );
    }
    if (slaFilter === "Sớm nhất") {
      tasks = [...tasks].sort((a, b) =>
        a.slaUrgent === b.slaUrgent ? 0 : a.slaUrgent ? -1 : 1
      );
    }

    return tasks;
  }, [search, areaFilter, wasteFilter, slaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  const urgentCount = ALL_TASKS.filter((t) => t.slaUrgent).length;

  const handleFilterChange = (setter) => (v) => {
    setter(v);
    setCurrentPage(1);
  };

  const toRouteTaskId = (id) => id.replace("#", "");

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-10">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="font-bold text-gray-900 text-lg lg:text-2xl tracking-tight">
            Danh sách Nhiệm vụ
          </h1>
          <p className="text-green-600 text-sm lg:text-base mt-1">
            Quản lý và xử lý các báo cáo thu gom rác thải được phân công.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-green-100">
            <p className="text-gray-500 text-xs lg:text-sm font-medium mb-3">
              Tổng Nhiệm Vụ
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                {ALL_TASKS.length}
              </span>
              <span className="text-xs lg:text-sm text-gray-500 font-medium">Báo cáo</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 lg:p-6 shadow-sm border border-red-100 transition-all hover:shadow-md">
            <p className="text-red-600 text-xs lg:text-sm font-medium mb-3">
              Sắp Hết Hạn
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-red-600">
                {urgentCount}
              </span>
              <span className="text-xs lg:text-sm text-red-600 font-medium">
                Cần xử lý ngay
              </span>
            </div>
          </div>
        </div>

        <div className="relative mb-4 lg:mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2">
            {SEARCH_ICON}
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm kiếm mã báo cáo (VD: #REP-2023)..."
            className="w-full bg-white border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-gray-700 placeholder-gray-400 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center mb-6 lg:mb-8">
          <FilterDropdown
            icon={<span className="text-gray-500">{PIN_ICON}</span>}
            label="Khu vực"
            value={areaFilter}
            options={AREAS}
            onChange={handleFilterChange(setAreaFilter)}
          />
          <FilterDropdown
            icon={<span className="text-gray-500">{TRASH_ICON}</span>}
            label="Loại rác"
            value={wasteFilter}
            options={WASTE_TYPES}
            onChange={handleFilterChange(setWasteFilter)}
          />
          <FilterDropdown
            icon={<span className="text-gray-500">{CLOCK_ICON}</span>}
            label="Hạn xử lý"
            value={slaFilter}
            options={SLA_SORTS}
            onChange={handleFilterChange(setSlaFilter)}
          />
          <button
            onClick={() => {
              setAreaFilter("Tất cả");
              setWasteFilter("Tất cả");
              setSlaFilter("Sớm nhất");
              setSearch("");
              setCurrentPage(1);
            }}
            className="ml-auto text-xs lg:text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>

        {paginated.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center shadow-sm border border-gray-100">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm lg:text-base font-medium">
              Không tìm thấy nhiệm vụ phù hợp.
            </p>
            <p className="text-gray-500 text-xs lg:text-sm mt-1">
              Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {paginated.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                confirmed={false}
                onDetail={() =>
                  navigate(`/collector/tasks/${toRouteTaskId(task.id)}`, {
                    state: { task },
                  })
                }
              />
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs lg:text-sm text-gray-500">
              Hiển thị <span className="font-semibold text-gray-700">{(safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}</span> trên <span className="font-semibold text-gray-700">{filtered.length}</span> nhiệm vụ
            </p>
            <div className="flex items-center gap-1">
              <PageBtn
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 12L6 8l4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </PageBtn>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <PageBtn
                  key={p}
                  active={p === safePage}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </PageBtn>
              ))}
              <PageBtn
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </PageBtn>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

function TaskRow({ task, confirmed, onDetail }) {
  return (
    <div className="bg-white rounded-2xl px-5 py-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      <div className="min-w-28">
        <p className="text-gray-500 text-xs font-medium mb-1">
          Mã Báo Cáo
        </p>
        <p className="text-base lg:text-lg font-bold text-gray-900">{task.id}</p>
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <AreaIcon />
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium mb-0.5">
            Khu Vực
          </p>
          <p className="text-sm lg:text-base font-semibold text-gray-800 leading-tight truncate">
            {task.area}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <WasteIcon type={task.wasteTypeKey} />
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium mb-0.5">
            Loại Rác
          </p>
          <p className="text-sm lg:text-base font-semibold text-gray-800 truncate">
            {task.wasteType}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <SlaIcon urgent={task.slaUrgent} />
        <div className="min-w-0">
          <p className="text-gray-500 text-xs font-medium mb-0.5">
            Hạn Xử Lý (SLA)
          </p>
          <p
            className={`text-sm lg:text-base font-bold truncate ${
              task.slaUrgent ? "text-red-600" : "text-gray-700"
            }`}
          >
            {task.sla}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto shrink-0">
        <span
          className={`px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium border ${
            confirmed
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-green-50 text-green-600 border-green-100"
          }`}
        >
          {confirmed ? "Đã nhận" : "Chờ xử lý"}
        </span>
        <button
          onClick={onDetail}
          className="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold text-sm lg:text-base rounded-xl px-5 py-2.5 transition-all shadow-sm"
        >
          Chi tiết
        </button>
      </div>
    </div>
  );
}

function AreaIcon() {
  return (
    <span className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
      <MapPin className="w-4 h-4" />
    </span>
  );
}

function WasteIcon({ type }) {
  const colorByType = {
    plastic: "text-sky-600 bg-sky-50",
    paper: "text-amber-700 bg-amber-50",
    metal: "text-zinc-600 bg-zinc-100",
    glass: "text-emerald-700 bg-emerald-50",
  };

  const colorClass = colorByType[type] || "text-gray-600 bg-gray-100";

  return (
    <span className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
      <Trash2 className="w-4 h-4" />
    </span>
  );
}

function SlaIcon({ urgent }) {
  return (
    <span
      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        urgent ? "bg-orange-50 text-orange-500" : "bg-gray-100 text-gray-500"
      }`}
    >
      <Clock3 className="w-4 h-4" />
    </span>
  );
}

function FilterDropdown({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3.5 py-2 text-xs lg:text-sm text-gray-700 font-medium shadow-sm hover:bg-green-50 transition-colors"
      >
        {icon}
        <span className="text-gray-400">{label}:</span>
        <span className="text-gray-800 font-semibold">{value}</span>
        <span className="text-gray-400">{CHEVRON_DOWN}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 min-w-37.5 py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs lg:text-sm hover:bg-green-50 transition-colors ${
                  opt === value
                    ? "text-green-600 font-bold bg-green-50"
                    : "text-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all ${
        active
          ? "bg-green-500 text-white shadow-sm"
          : disabled
            ? "text-gray-300 cursor-not-allowed bg-white border border-green-50"
            : "bg-white text-gray-600 hover:bg-green-50 border border-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default Tasks;
