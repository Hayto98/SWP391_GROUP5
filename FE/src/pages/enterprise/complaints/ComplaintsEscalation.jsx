import React from "react";
import "./complaintsEscalation.css";
import { useComplaints } from "../../../hooks/useComplaints";
import { FaSearch, FaDownload, FaChevronDown, FaPaperPlane } from "react-icons/fa";

const Tab = ({ active, children, onClick }) => (
  <button type="button" className={`cex-tab ${active ? "is-active" : ""}`} onClick={onClick}>
    {children}
  </button>
);

const Severity = ({ v }) => (
  <span className={`cex-sev ${v === "CAO" ? "is-high" : v === "TRUNG BÌNH" ? "is-mid" : "is-low"}`}>{v}</span>
);

const Status = ({ v }) => (
  <span className={`cex-st ${v === "Chờ xử lý" ? "is-pending" : v === "Đang xử lý" ? "is-proc" : "is-done"}`}>
    {v.toUpperCase()}
  </span>
);

export default function ComplaintsEscalation() {
  const {
    data,
    detail,
    loading,
    error,
    tab,
    reason,
    q,
    selectedId,
    message,
    sending,
    setTab,
    setReason,
    setQ,
    pick,
    setMessage,
    send,
    escalate,
    list,
  } = useComplaints();

  if (loading) return <div style={{ padding: 16 }}>Đang tải...</div>;
  if (error) return <div style={{ padding: 16, color: "#991b1b" }}>Lỗi: {error}</div>;
  if (!data) return null;

  return (
    <div className="cex-shell">
      <aside className="cex-side">
        <div className="cex-brand">
          <div className="cex-brandName">Recycling Ent.</div>
          <div className="cex-brandSub">OPERATIONAL STAFF</div>
        </div>

        <nav className="cex-nav">
          <a className="cex-item" href="#" onClick={(e) => e.preventDefault()}>Dashboard</a>
          <a className="cex-item" href="#" onClick={(e) => e.preventDefault()}>Lịch thu gom</a>
          <a className="cex-item" href="#" onClick={(e) => e.preventDefault()}>Báo cáo</a>
          <a className="cex-item is-active" href="#" onClick={(e) => e.preventDefault()}>Khiếu nại</a>
          <a className="cex-item" href="#" onClick={(e) => e.preventDefault()}>Cài đặt</a>
        </nav>

        <div className="cex-user">
          <div className="cex-ava">NV</div>
          <div>
            <div className="cex-userName">Nguyễn Văn A</div>
            <div className="cex-userRole">ID: STAFF-882</div>
          </div>
        </div>
      </aside>

      <main className="cex-main">
        <div className="cex-topbar">
          <div className="cex-searchWrap">
            <FaSearch className="cex-searchIcon" />
            <input
              className="cex-search"
              placeholder="Tìm kiếm mã báo cáo, lý do hoặc khách hàng..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="cex-topRight">
            <button className="cex-iconBtn" type="button">🔔</button>
            <button className="cex-iconBtn" type="button">👤</button>
          </div>
        </div>

        <div className="cex-head">
          <div>
            <h1>Quản lý Khiếu nại &amp; Escalation</h1>
            <p>Theo dõi và giải quyết các khiếu nại từ người dân và đối tác.</p>
          </div>

          <button className="cex-export" type="button">
            <FaDownload /> Xuất báo cáo
          </button>
        </div>

        <div className="cex-controls">
          <div className="cex-tabs">
            {data.tabs.map((t) => (
              <Tab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Tab>
            ))}
          </div>

          <div className="cex-rightControls">
            <div className="cex-dd">
              <select className="cex-ddSel" value={reason} onChange={(e) => setReason(e.target.value)}>
                {data.reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <FaChevronDown className="cex-ddIco" />
            </div>
          </div>
        </div>

        <div className="cex-grid">
          <section className="cex-card">
            <div className="cex-table">
              <div className="cex-tr cex-th">
                <div>MÃ BÁO CÁO</div>
                <div>LÝ DO</div>
                <div>NGÀY GỬI</div>
                <div>TRẠNG THÁI</div>
                <div>MỨC ĐỘ</div>
              </div>

              {list.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`cex-tr cex-rowBtn ${selectedId === r.id ? "is-selected" : ""}`}
                  onClick={() => pick(r.id)}
                >
                  <div className="cex-idCell">
                    <div className="cex-idMain">{r.id}</div>
                    <div className="cex-idSub">{r.citizen}</div>
                  </div>
                  <div className={`cex-reason ${r.reason === "Sai khối lượng" ? "is-red" : r.reason === "Bỏ lỡ thu gom" ? "is-orange" : "is-purple"}`}>
                    {r.reason}
                  </div>
                  <div className="cex-date">{r.createdAt}</div>
                  <div><Status v={r.status} /></div>
                  <div><Severity v={r.severity} /></div>
                </button>
              ))}
            </div>
          </section>

          <aside className="cex-card cex-detail">
            <div className="cex-detailHead">
              <div className="cex-detailTitle">Chi tiết Khiếu nại</div>
              {detail?.urgent && <span className="cex-urgent">URGENTLY REQUIRED</span>}
            </div>

            <div className="cex-detailMeta">
              <div>Mã báo cáo: <b>{detail?.id}</b></div>
              <div>{detail?.createdAt}</div>
            </div>

            <div className="cex-thread">
              {(detail?.timeline || []).map((m, idx) => (
                <div className="cex-msg" key={idx}>
                  <div className={`cex-msgDot ${m.tone}`} />
                  <div className="cex-msgBody">
                    <div className="cex-msgTop">
                      <div className={`cex-msgWho ${m.tone}`}>{m.who}</div>
                      <div className="cex-msgTime">{m.time}</div>
                    </div>
                    {m.text && <div className="cex-msgText">{m.text}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="cex-actionsBox">
              <div className="cex-actionsTitle">Đề xuất hành động:</div>
              <button className="cex-actionPrimary" type="button" disabled={sending}>
                XỬ LÝ TRỰC TIẾP
              </button>
              <button className="cex-actionDanger" type="button" onClick={escalate} disabled={sending}>
                GỬI LÊN HỆ THỐNG (ESCALATE)
              </button>
            </div>

            <div className="cex-inputBox">
              <textarea
                className="cex-textarea"
                placeholder="Nhập ghi chú hoặc phản hồi cho citizen..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="cex-send" type="button" onClick={send} disabled={sending || !message.trim()}>
                <FaPaperPlane />
              </button>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}