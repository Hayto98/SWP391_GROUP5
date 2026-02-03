import React from "react";
import { useNavigate } from "react-router-dom";

const PrimarySection = () => {
	const navigate = useNavigate();
	const handleLogin = () => navigate("/login");
	return (
		<section className="primary-section" style={{ padding: "56px 0 32px 0", background: "#F7FAF7" }}>
			<div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
				<div style={{ marginBottom: "16px", fontSize: "1rem", color: "#4CAF50", fontWeight: "bold" }}>
					# Sứ mệnh hành trình xanh
				</div>
				<h1 style={{ fontSize: "2.8rem", fontWeight: "bold", marginBottom: "12px" }}>
					Cùng nhau tái chế – <span style={{ color: "#4CAF50", fontStyle: "italic" }}>Nhận điểm thưởng</span>
				</h1>
				<p style={{ fontSize: "1.2rem", color: "#555", marginBottom: "32px" }}>
					Tham gia cộng đồng của chúng tôi để biến rác thải thành giá trị! Mỗi món đồ được tái chế sẽ mang lại cho bạn điểm thưởng để đổi những món quà sinh thái độc đáo.
				</p>
				<div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px" }}>
					       <button
						       className="primary-btn"
						       style={{ background: "#4CAF50", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 32px", fontSize: "1rem", cursor: "pointer" }}
						       onClick={handleLogin}
					       >
						       Bắt đầu ngay
					       </button>
					<button className="primary-btn-secondary" style={{ background: "#fff", color: "#4CAF50", border: "2px solid #4CAF50", borderRadius: "8px", padding: "12px 32px", fontSize: "1rem", cursor: "pointer" }}>
						Tìm hiểu thêm
					</button>
				</div>
				   <div style={{ width: "100%", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px #e0e0e0", margin: "0 auto" }}>
					   <img src="/src/assets/img/bannerpage.png" alt="ECOVIET Banner" style={{ width: "100%", height: "auto", objectFit: "cover" }} />
				   </div>
			</div>
		</section>
	);
};

export default PrimarySection;
