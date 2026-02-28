import React, { useState } from "react";
import { Link } from "react-router-dom"; // Nhớ cài đặt: npm install react-router-dom
import { Calendar, AlertTriangle, CheckSquare } from "lucide-react"; // Nhớ cài đặt: npm install lucide-react

// Component Toggle 
const Toggle = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
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

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-10">
      {/* Container giới hạn chiều rộng giống giao diện Mobile App */}
      <main className="max-w-md mx-auto p-4 flex flex-col gap-5">
        {/* --- KHU VỰC 1: PROFILE & TRẠNG THÁI --- */}
        <div className="flex flex-col gap-4">
          {/* Profile Card */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50">
                <svg viewBox="0 0 80 80" className="w-full h-full block">
                  <rect width="80" height="80" fill="#CBD5E1" />
                  <circle cx="40" cy="30" r="14" fill="#94A3B8" />
                  <path d="M10 70c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#94A3B8" />
                  <rect x="26" y="16" width="28" height="5" rx="2.5" fill="#64748B" />
                  <path d="M22 70c0-10 8-18 18-18s18 8 18 18" fill="#EAB308" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base leading-tight truncate">
                Chào buổi sáng, Nguyễn Văn A
              </h2>
              <p className="text-green-600 text-sm mt-0.5 truncate">
                Nhân viên thu gom cấp cao • Quận 1
              </p>
            </div>
          </div>

          {/* Ready Toggle */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border border-gray-100">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path d="M5 17H3V10l3-5h6l2 3h3l2 4H5" />
                <path d="M13 8h5" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">Sẵn sàng làm việc</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                Bật để nhận nhiệm vụ mới trong khu vực
              </p>
            </div>
            <Toggle checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} />
          </div>
        </div>

        {/* --- KHU VỰC 2: TỔNG QUAN NHIỆM VỤ --- */}
        <div className="flex flex-col gap-4 mt-2">
          <h3 className="font-bold text-gray-900 text-lg px-1">Tổng quan nhiệm vụ</h3>

          {/* Task Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Pending Tasks */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs font-medium">Đang chờ</span>
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900">12</span>
              </div>
              <p className="text-green-600 text-xs font-medium mt-1">+2 nhiệm vụ mới</p>
            </div>

            {/* Overdue Tasks */}
            <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-600 text-xs font-medium">Sắp quá hạn</span>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-red-600">3</span>
              </div>
              <button className="text-red-600 text-xs font-semibold underline mt-1">
                SLA Cảnh báo
              </button>
            </div>
          </div>

          {/* CTA Banner */}
          <Link
            to="/nhiem-vu"
            className="block bg-green-500 hover:bg-green-600 transition-colors rounded-2xl p-6 text-center shadow-md"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <h4 className="text-white font-extrabold text-lg tracking-wide uppercase mb-1">
              Xem Danh Sách
            </h4>
            <p className="text-white/90 text-sm">
              Bạn có 12 điểm dừng thu gom dự kiến
            </p>
          </Link>

          {/* Map Section */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-green-600" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-800 text-sm">Khu vực làm việc</span>
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                Quận 1, HCM
              </span>
            </div>

            {/* Map Embed */}
            <div className="w-full h-52 relative bg-gray-200">
              <iframe
                title="Khu vực làm việc"
                className="w-full h-full border-0"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.68,10.76,106.73,10.80&layer=mapnik&marker=10.7769,106.7009"
                loading="lazy"
              />
              {/* Location label overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
                Vị trí của bạn
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default Dashboard;