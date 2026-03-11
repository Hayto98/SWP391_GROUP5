import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Nhớ cài đặt: npm install react-router-dom
import { Calendar, AlertTriangle, CheckSquare } from "lucide-react"; // Nhớ cài đặt: npm install lucide-react
import { toast } from "sonner";
import {
  getCollectorWorkingStatus,
  updateCollectorWorkingStatus,
} from "../../../services/collectorWorkingStatus.service";

// Component Toggle
const Toggle = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${
        checked ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

function Dashboard() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadWorkingStatus = async () => {
      try {
        const response = await getCollectorWorkingStatus();
        setIsAvailable(Boolean(response?.isWorking));
      } catch (error) {
        toast.error(error?.message || "Không tải được trạng thái làm việc");
      } finally {
        setIsLoadingStatus(false);
      }
    };

    loadWorkingStatus();
  }, []);

  const handleToggleWorkingStatus = async () => {
    if (isLoadingStatus || isUpdatingStatus) return;

    const nextStatus = !isAvailable;
    setIsAvailable(nextStatus);
    setIsUpdatingStatus(true);

    try {
      const response = await updateCollectorWorkingStatus(nextStatus);
      setIsAvailable(Boolean(response?.isWorking));
    } catch (error) {
      setIsAvailable(!nextStatus);
      toast.error(error?.message || "Cập nhật trạng thái làm việc thất bại");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-10">
      {/* Container responsive cho cả Mobile và PC */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* --- KHU VỰC 1: PROFILE & TRẠNG THÁI --- */}
          <div className="lg:col-span-4 flex flex-col gap-4 lg:gap-6">
            {/* Profile Card */}
            <div className="flex items-center gap-4 bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50">
                  <svg viewBox="0 0 80 80" className="w-full h-full block">
                    <rect width="80" height="80" fill="#CBD5E1" />
                    <circle cx="40" cy="30" r="14" fill="#94A3B8" />
                    <path
                      d="M10 70c0-16.569 13.431-30 30-30s30 13.431 30 30"
                      fill="#94A3B8"
                    />
                    <rect
                      x="26"
                      y="16"
                      width="28"
                      height="5"
                      rx="2.5"
                      fill="#64748B"
                    />
                    <path
                      d="M22 70c0-10 8-18 18-18s18 8 18 18"
                      fill="#EAB308"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 text-base lg:text-xl leading-tight truncate">
                  Chào buổi sáng, Nguyễn Văn A
                </h2>
                <p className="text-green-600 text-sm lg:text-base mt-1 truncate">
                  Nhân viên thu gom cấp cao • Quận 1
                </p>
              </div>
            </div>

            {/* Ready Toggle */}
            <div className="bg-white rounded-xl p-4 lg:p-6 flex items-center gap-3 lg:gap-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
              <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6 lg:w-7 lg:h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                  <path d="M5 17H3V10l3-5h6l2 3h3l2 4H5" />
                  <path d="M13 8h5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm lg:text-base">
                  Sẵn sàng làm việc
                </p>
                <p className="text-gray-500 text-xs lg:text-sm mt-1 leading-relaxed">
                  Bật để nhận nhiệm vụ mới trong khu vực
                </p>
              </div>
              <Toggle
                checked={isAvailable}
                onChange={handleToggleWorkingStatus}
                disabled={isLoadingStatus || isUpdatingStatus}
              />
            </div>
          </div>

          {/* --- KHU VỰC 2: TỔNG QUAN NHIỆM VỤ --- */}
          <div className="lg:col-span-8 flex flex-col gap-4 lg:gap-6 mt-2 lg:mt-0">
            <h3 className="font-bold text-gray-900 text-lg lg:text-2xl px-1">
              Tổng quan nhiệm vụ
            </h3>

            {/* Task Stats & CTA Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
              <div className="md:col-span-2 grid grid-cols-2 gap-4 lg:gap-6">
                {/* Pending Tasks */}
                <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md hover:border-green-100">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <span className="text-gray-500 text-xs lg:text-sm font-medium">
                      Đang chờ
                    </span>
                    <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                        12
                      </span>
                    </div>
                    <p className="text-green-600 text-xs lg:text-sm font-medium mt-2">
                      +2 nhiệm vụ mới
                    </p>
                  </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-red-50 rounded-2xl p-4 lg:p-6 shadow-sm border border-red-100 flex flex-col justify-between transition-all hover:shadow-md">
                  <div className="flex items-center justify-between mb-4 lg:mb-6">
                    <span className="text-red-600 text-xs lg:text-sm font-medium">
                      Sắp quá hạn
                    </span>
                    <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl lg:text-5xl font-bold text-red-600">
                        3
                      </span>
                    </div>
                    <button className="text-red-600 text-xs lg:text-sm font-semibold underline mt-2 hover:text-red-700 transition-colors">
                      SLA Cảnh báo
                    </button>
                  </div>
                </div>
              </div>

              {/* CTA Banner */}
              <Link
                to="/collector/tasks"
                className="md:col-span-1 block bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all rounded-2xl p-6 text-center shadow-md flex flex-col items-center justify-center h-full min-h-[160px] group"
              >
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckSquare className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-white font-extrabold text-lg lg:text-xl tracking-wide uppercase mb-2">
                  Xem Danh Sách
                </h4>
                <p className="text-white/90 text-sm">
                  Bạn có 12 điểm dừng thu gom dự kiến
                </p>
              </Link>
            </div>
          </div>

          {/* --- MAP KHU VỰC LÀM VIỆC (FULL WIDTH) --- */}
          <div className="lg:col-span-12 mt-4 lg:mt-2">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-grow flex flex-col">
              <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-50">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-6 h-6 lg:w-8 lg:h-8 rounded bg-green-100 flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-600"
                      fill="currentColor"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-800 text-sm lg:text-base">
                    Khu vực làm việc
                  </span>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs lg:text-sm font-medium px-3 lg:px-4 py-1.5 rounded-full">
                  Quận 1, HCM
                </span>
              </div>

              {/* Map Embed */}
              <div className="w-full h-52 lg:h-[400px] xl:h-[500px] relative bg-gray-200">
                <iframe
                  title="Khu vực làm việc"
                  className="w-full h-full border-0"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=106.68,10.76,106.73,10.80&layer=mapnik&marker=10.7769,106.7009"
                  loading="lazy"
                />
                {/* Location label overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-700 text-xs lg:text-sm font-medium px-4 lg:px-6 py-2 rounded-full shadow-md border border-gray-100">
                  Vị trí của bạn
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
