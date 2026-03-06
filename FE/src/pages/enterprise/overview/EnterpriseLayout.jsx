import React from "react";
import { NavLink } from "react-router-dom";
import "./enterpriseLayout.css";
import {
  FaChartPie,
  FaClipboardList,
  FaWarehouse,
  FaFileAlt,
  FaUsers,
  FaCog,
} from "react-icons/fa";

const Item = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `el-item ${isActive ? "is-active" : ""}`}
      end
    >
      <span className="el-item__icon">{icon}</span>
      <span className="el-item__label">{label}</span>
    </NavLink>
  );
};

export default function EnterpriseLayout({ children }) {
  return (
    <div className="el">
      {/* Sidebar */}
      <aside className="el-sidebar">
        <div className="el-sidebar__top">
          <div className="el-appMark">
            <div className="el-appMark__logo">R</div>
            <div>
              <div className="el-appMark__name">RecycleCorp</div>
              <div className="el-appMark__sub">Quản trị Doanh nghiệp</div>
            </div>
          </div>
        </div>

        <nav className="el-nav">
          <Item to="/enterprise/overview" icon={<FaChartPie />} label="Tổng quan" />
          <Item to="/enterprise/orders" icon={<FaClipboardList />} label="Nhiệm vụ" />
          <Item to="/enterprise/warehouse" icon={<FaWarehouse />} label="Kho bãi" />
          <Item to="/enterprise/reports" icon={<FaFileAlt />} label="Báo cáo" />
          <Item to="/enterprise/employees" icon={<FaUsers />} label="Nhân sự" />
        </nav>

        <div className="el-sidebar__bottom">
          <NavLink to="/settings" className="el-setting">
            <FaCog /> <span>Cài đặt</span>
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <main className="el-main">{children}</main>
    </div>
  );
}