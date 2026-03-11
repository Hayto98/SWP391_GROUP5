import React from "react";
import { useNavigate } from "react-router-dom";


const CTASection = () => {
	const navigate = useNavigate();
	const handleRegister = () => navigate("/register");
	return (
		<section
			className="cta-section"
			style={{
				background: "#1c2926",
				color: "#fff",
				borderRadius: "40px",
				maxWidth: "90vw",
				margin: "64px auto 0 auto",
				padding: "64px 32px 48px 32px",
				textAlign: "center",
				boxShadow: "0 2px 16px #0002"
			}}
		>
			<h2
				style={{
					fontSize: "3rem",
					fontWeight: "bold",
					marginBottom: "24px",
					color: "#fff"
				}}
			>
				Sẵn sàng bắt đầu hành trình xanh?
			</h2>
			<p style={{ fontSize: "1.25rem", color: "#e0f7ea", marginBottom: "32px" }}>
				Đăng ký tài khoản ngay hôm nay để nhận <span style={{ color: "#4CAF50", fontWeight: 600 }}>50 điểm thưởng</span> đầu tiên cho tài khoản mới!
			</p>
			<div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "24px" }}>
				<button
					style={{
						background: "#4CAF50",
						color: "#fff",
						border: "none",
						borderRadius: "12px",
						padding: "16px 40px",
						fontSize: "1.15rem",
						fontWeight: 600,
						cursor: "pointer",
						boxShadow: "0 2px 8px #0001"
					}}
					onClick={handleRegister}
				>
					Đăng ký ngay
				</button>
				<button
					style={{
						background: "#1c2926",
						color: "#fff",
						border: "2px solid #4CAF50",
						borderRadius: "12px",
						padding: "16px 40px",
						fontSize: "1.15rem",
						fontWeight: 600,
						cursor: "pointer"
					}}
				>
					Tải ứng dụng di động
				</button>
			</div>
		</section>
	);
};

export default CTASection;
