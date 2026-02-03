import React from "react";

const Footer = () => {
	return (
		<footer style={{ background: "#fff", borderTop: "1px solid #e0e0e0", padding: "32px 0", marginTop: "48px" }}>
			<div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
				<div style={{ display: "flex", gap: "32px", fontSize: "1rem", color: "#4CAF50" }}>
					<a href="#process" style={{ textDecoration: "none", color: "#4CAF50" }}>Quy trình</a>
					<a href="#stats" style={{ textDecoration: "none", color: "#4CAF50" }}>Thành tích</a>
					<a href="#contact" style={{ textDecoration: "none", color: "#4CAF50" }}>Liên hệ</a>
				</div>
				<div style={{ fontSize: "0.95rem", color: "#888" }}>
					© 2026 RecycleSystem. Đóng góp vì tương lai xanh.
				</div>
			</div>
		</footer>
	);
};

export default Footer;
