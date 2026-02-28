import React from "react";
import "./acceptWasteConfig.css";
import EnterpriseLayout from "../../overview/EnterpriseLayout";
import { useAcceptWasteConfig } from "@/hooks/useAcceptWasteConfig";
import {
  FaCheck,
  FaSearch,
  FaChevronRight,
  FaRecycle,
  FaFileAlt,
  FaWineBottle,
  FaCog,
  FaBolt,
} from "react-icons/fa";

const IconByType = ({ type }) => {
  if (type === "paper") return <FaFileAlt />;
  if (type === "recycle") return <FaRecycle />;
  if (type === "glass") return <FaWineBottle />;
  if (type === "metal") return <FaCog />;
  return <FaBolt />;
};

export default function AcceptWasteConfig() {
  const { data, loading, error, savingId, storagePercent, toggleCategory } =
    useAcceptWasteConfig();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  return (
    <EnterpriseLayout>
      <div className="awc">
        <div className="awc-top">
          <div className="awc-top__left">
            <div className="awc-titleSmall">RecycleAdmin</div>
            <div className="awc-tabs">
              <span>Dashboard</span>
              <span>Inventory</span>
              <span>Reports</span>
              <span className="is-active">Settings</span>
            </div>
          </div>

          <div className="awc-top__right">
            <div className="awc-search">
              <FaSearch className="awc-search__icon" />
              <input placeholder="Tìm kiếm cài đặt..." />
            </div>
            <div className="awc-avatar">A</div>
          </div>
        </div>

        <div className="awc-breadcrumb">
          <span>Cài đặt</span> <FaChevronRight /> <span>Cấu hình hệ thống</span>{" "}
          <FaChevronRight /> <b>Cấu hình Loại rác Tiếp nhận</b>
        </div>

        <div className="awc-heading">
          <h1>Cấu hình Loại rác Tiếp nhận</h1>
          <p>Xác định loại vật liệu tái chế mà doanh nghiệp có khả năng xử lý.</p>
        </div>

        <div className="awc-rule">
          <div className="awc-rule__left">
            <div className="awc-rule__dot" />
            <div>
              <div className="awc-rule__title">{data.rule.title}</div>
              <div className="awc-rule__desc">{data.rule.desc}</div>
            </div>
          </div>

          <div className="awc-rule__status">
            <span className="awc-statusPill">
              <FaCheck /> {data.rule.status}
            </span>
          </div>
        </div>

        <div className="awc-grid">
          {data.categories.map((c) => {
            const active = !!c.enabled;
            const disabledCard = !!c.disabledCard;
            const saving = savingId === c.id;

            return (
              <button
                key={c.id}
                className={[
                  "awc-card",
                  active ? "is-active" : "",
                  disabledCard ? "is-disabled" : "",
                ].join(" ")}
                onClick={() => toggleCategory(c.id)}
                disabled={disabledCard || saving}
                type="button"
              >
                <div className="awc-card__head">
                  <div className="awc-card__icon">
                    <IconByType type={c.icon} />
                  </div>

                  <div
                    className={[
                      "awc-check",
                      active ? "is-checked" : "",
                      disabledCard ? "is-off" : "",
                    ].join(" ")}
                  >
                    {active && <FaCheck />}
                  </div>
                </div>

                <div className="awc-card__name">{c.name}</div>
                <div className="awc-card__desc">{c.desc}</div>

                {saving && <div className="awc-saving">Đang lưu...</div>}
              </button>
            );
          })}
        </div>

        <div className="awc-storage">
          <div className="awc-storage__label">Dung lượng kho</div>
          <div className="awc-storage__bar">
            <div className="awc-storage__fill" style={{ width: `${storagePercent}%` }} />
          </div>
          <div className="awc-storage__meta">
            {data.storage.used.toFixed(2)} / {data.storage.total.toFixed(2)} {data.storage.unit}
          </div>
        </div>
      </div>
    </EnterpriseLayout>
  );
}