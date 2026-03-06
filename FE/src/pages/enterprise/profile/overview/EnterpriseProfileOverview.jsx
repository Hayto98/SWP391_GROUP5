import React from "react";
import "./enterpriseProfileOverview.css";
import { useEnterpriseProfile } from "../../../../hooks/useEnterpriseProfile";
import { FaBuilding, FaShieldAlt, FaCheckCircle, FaChevronRight } from "react-icons/fa";

const CardTitle = ({ icon, title, right }) => (
  <div className="ep-cardHead">
    <div className="ep-cardTitle">
      <span className="ep-cardIcon">{icon}</span>
      <span>{title}</span>
    </div>
    {right}
  </div>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    className={`ep-toggle ${checked ? "is-on" : ""}`}
    onClick={onChange}
    disabled={disabled}
  >
    <span className="ep-toggleDot" />
  </button>
);

export default function EnterpriseProfileOverview() {
  const { data, loading, error, toggling2FA, toggle2FA } = useEnterpriseProfile();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  return (
    <div className="ep-shell">
      <div className="ep-topbar">
        <div className="ep-topLeft">
          <div className="ep-appMark">
            <div className="ep-appLogo">♻</div>
            <div className="ep-appName">Recycling Enterprise</div>
          </div>
          <div className="ep-topNav">
            <span>Tổng quan</span>
            <span>Kho hàng</span>
            <span>Đơn hàng</span>
            <span>Báo cáo</span>
          </div>
        </div>

        <div className="ep-topRight">
          <div className="ep-topSearch">
            <input placeholder="Tìm kiếm dữ liệu..." />
          </div>
          <button className="ep-topBtn" type="button">🔔</button>
          <div className="ep-userDot">A</div>
        </div>
      </div>

      <div className="ep-body">
        <main className="ep-main">
          <div className="ep-hero">
            <div className="ep-heroLeft">
              <div className="ep-logoBox">{data.company.logoText}</div>
              <div className="ep-heroInfo">
                <div className="ep-heroName">{data.company.name}</div>
                <div className="ep-heroMeta">Mã Hệ Thống: {data.company.code}</div>
                <div className="ep-heroMeta2">{data.company.memberSince}</div>
              </div>
            </div>

            <button className="ep-heroBtn" type="button">Chỉnh sửa hồ sơ</button>
          </div>

          <div className="ep-grid">
            <div className="ep-card">
              <CardTitle icon={<FaBuilding />} title="Thông tin doanh nghiệp" />
              <div className="ep-infoGrid">
                <div className="ep-infoBlock">
                  <div className="ep-infoLabel">TÊN PHÁP LÝ</div>
                  <div className="ep-infoValue">{data.businessInfo.legalName}</div>
                </div>
                <div className="ep-info2col">
                  <div className="ep-infoBlock">
                    <div className="ep-infoLabel">GIẤY PHÉP KINH DOANH</div>
                    <div className="ep-infoValue">{data.businessInfo.license}</div>
                  </div>
                  <div className="ep-infoBlock">
                    <div className="ep-infoLabel">MÃ SỐ THUẾ</div>
                    <div className="ep-infoValue">{data.businessInfo.tax}</div>
                  </div>
                </div>
                <div className="ep-infoBlock">
                  <div className="ep-infoLabel">ĐỊA CHỈ TRỤ SỞ</div>
                  <div className="ep-infoValue">{data.businessInfo.hq}</div>
                </div>
              </div>
            </div>

            <div className="ep-card">
              <CardTitle icon={<FaCheckCircle />} title="Liên hệ & Phạm vi" />
              <div className="ep-contactGrid">
                <div className="ep-contactItem">
                  <div className="ep-infoLabel">EMAIL LIÊN HỆ</div>
                  <div className="ep-link">{data.contactScope.email}</div>
                </div>
                <div className="ep-contactItem">
                  <div className="ep-infoLabel">SỐ ĐIỆN THOẠI</div>
                  <div className="ep-infoValue">{data.contactScope.phone}</div>
                </div>

                <div className="ep-contactItem ep-contactFull">
                  <div className="ep-infoLabel">KHU VỰC HOẠT ĐỘNG HOẠT ĐỘNG</div>
                  <div className="ep-tags">
                    {data.contactScope.regions.map((r) => (
                      <span key={r} className="ep-tag">{r}</span>
                    ))}
                    <span className="ep-tag ep-tagMuted">{data.contactScope.more}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ep-card">
              <CardTitle
                icon={<span className="ep-miniIco">🕘</span>}
                title="Lịch sử hoạt động"
                right={<button className="ep-linkBtn" type="button">{data.activity.viewAll}</button>}
              />

              <div className="ep-timeline">
                {data.activity.items.map((it, idx) => (
                  <div className="ep-tlRow" key={idx}>
                    <div className="ep-tlDotWrap">
                      <div className="ep-tlDot" />
                      {idx !== data.activity.items.length - 1 && <div className="ep-tlLine" />}
                    </div>
                    <div className="ep-tlBody">
                      <div className="ep-tlTitle">{it.title}</div>
                      <div className="ep-tlSub">{it.by}</div>
                    </div>
                    <div className="ep-tlDate">{it.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ep-card">
              <CardTitle icon={<FaShieldAlt />} title="Bảo mật tài khoản" />

              <div className="ep-secRow">
                <div className="ep-secLeft">
                  <div className="ep-secName">Mật khẩu</div>
                  <div className="ep-secSub">{data.security.passwordLastChanged}</div>
                </div>
                <button className="ep-miniBtn" type="button">Thay đổi</button>
              </div>

              <div className="ep-secRow">
                <div className="ep-secLeft">
                  <div className="ep-secName">Xác thực 2 yếu tố (2FA)</div>
                  <div className="ep-secSub">Tăng cường bảo mật cho tài khoản của bạn</div>
                </div>
                <Toggle checked={data.security.twoFAEnabled} onChange={toggle2FA} disabled={toggling2FA} />
              </div>

              <div className="ep-alert">
                <div className="ep-alertTitle">{data.security.alert.title}</div>
                <div className="ep-alertDesc">{data.security.alert.desc}</div>
                <button className="ep-alertLink" type="button">
                  {data.security.alert.action} <FaChevronRight />
                </button>
              </div>
            </div>
          </div>

          <div className="ep-footer">
            © 2024 Recycling Enterprise Management System. All rights reserved.
          </div>
        </main>
      </div>
    </div>
  );
}