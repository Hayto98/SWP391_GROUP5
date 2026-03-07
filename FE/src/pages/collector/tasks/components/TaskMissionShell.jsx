import { CheckCircle2, Circle, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const WORKFLOW_STEPS = [
  "Đã nhận",
  "Đang di chuyển",
  "Đã đến nơi",
  "Đang thu gom",
  "Hoàn thành",
];

const STATUS_TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-green-50 text-green-700 border-green-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export default function TaskMissionShell({
  task,
  currentStep,
  statusLabel,
  statusTone = "blue",
  breadcrumbLabel,
  title,
  subtitle,
  summaryItems,
  children,
}) {
  const taskRouteId = task?.id ? task.id.replace("#", "") : "";
  const statusClass = STATUS_TONE_CLASSES[statusTone] || STATUS_TONE_CLASSES.blue;

  const defaultSummaryItems = [
    {
      label: "TASK ID",
      value: task?.id || "-",
    },
    {
      label: "REPORT ID",
      value: task?.id ? `R-${taskRouteId}` : "-",
    },
    {
      label: "Địa điểm",
      value: task ? `${task.area}, ${task.district}` : "-",
    },
    {
      label: "Loại rác khai báo",
      value: task?.wasteType || "-",
    },
    {
      label: "Hạn chót SLA",
      value: task?.sla || "-",
    },
  ];

  const items = summaryItems && summaryItems.length > 0 ? summaryItems : defaultSummaryItems;

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-10">
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/collector/tasks" className="text-green-500 font-medium">
              Nhiệm vụ
            </Link>
            <span className="text-gray-400"> / </span>
            {taskRouteId ? (
              <>
                <Link
                  to={`/collector/tasks/${taskRouteId}`}
                  state={{ task }}
                  className="text-green-500 font-medium"
                >
                  Chi tiết nhiệm vụ
                </Link>
                <span className="text-gray-400"> / </span>
              </>
            ) : null}
            <span className="text-gray-500">{breadcrumbLabel}</span>
          </div>

          <span
            className={`px-3 py-1.5 rounded-xl text-sm border font-medium inline-flex items-center gap-1.5 ${statusClass}`}
          >
            <Truck className="w-4 h-4" />
            {statusLabel}
          </span>
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle ? <p className="text-green-600 text-sm lg:text-base mt-1">{subtitle}</p> : null}
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 lg:p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const order = idx + 1;
              const done = order <= currentStep;
              const active = order === currentStep;

              return (
                <div
                  key={step}
                  className={`rounded-xl border px-3 py-2.5 text-sm ${
                    done
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  <div className={`inline-flex items-center gap-2 font-medium ${active ? "font-semibold" : ""}`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs tracking-[0.12em] uppercase text-gray-400 font-semibold mb-3">
            Thông tin khai báo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {items.map((item) => (
              <div key={item.label}>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-gray-800 leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
