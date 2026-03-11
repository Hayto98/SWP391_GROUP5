import React from "react";
import { NavLink } from "react-router-dom";
import "./adminPortalLayout.css";
import { FaThLarge, FaRecycle, FaSlidersH, FaClipboardList } from "react-icons/fa";

const Item = ({ to, icon, label }) => (
  <NavLink to={to} className={({ isActive }) => `apl-item ${isActive ? "is-active" : ""}`} end>
    <span className="apl-ico">{icon}</span>
    <span className="apl-label">{label}</span>
  </NavLink>
);

export default function AdminPortalLayout({ children }) {
  return (
    <div className="apl">
      <aside className="apl-side">
        <div className="apl-brand">
          <div className="apl-brandName">Admin Portal</div>
          <div className="apl-brandSub">HỆ THỐNG THU GOM RÁC</div>
        </div>

        <nav className="apl-nav">
          <Item to="/admin/dashboard" icon={<FaThLarge />} label="Tổng quan" />
          <Item to="/admin/waste" icon={<FaRecycle />} label="Quản lý rác thải" />
          <Item to="/admin/reward-rules" icon={<FaSlidersH />} label="Quy tắc điểm thưởng" />
          <Item to="/admin/system-report" icon={<FaClipboardList />} label="Báo cáo hệ thống" />
        </nav>

        <div className="apl-user">
          <div className="apl-avatar">AD</div>
          <div>
            <div className="apl-userName">Admin User</div>
            <div className="apl-userRole">Quản trị viên</div>
          </div>
        </div>
      </aside>

      <main className="apl-main">
        <div className="apl-topbar">
          <div />
          <div className="apl-topRight">
            <button className="apl-topBtn" type="button">🔔</button>
            <a className="apl-help" href="#" onClick={(e) => e.preventDefault()}>Hỗ trợ</a>
          </div>
        </div>

        <div className="apl-content">{children}</div>
      </main>
    </div>
  );
}