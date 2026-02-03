import React from "react";

const navLinks = [
	{ name: "Về chúng tôi", href: "#about" },
	{ name: "Quy trình", href: "#process" },
	{ name: "Thành tích", href: "#stats" },
	{ name: "Đăng nhập", href: "/login" },
	{ name: "Đăng ký", href: "/register" }
];

const Header = () => {
	return (
		<header style={{ background: "#fff", boxShadow: "0 2px 8px #e0e0e0", padding: "0 32px" }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px", maxWidth: "1200px", margin: "0 auto" }}>
				   <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					   <img src="/src/assets/img/logo.jpeg" alt="ECOVIET Logo" style={{ height: "72px" }} />
					   <span style={{ fontWeight: "bold", fontSize: "1.25rem", color: "#4CAF50" }}>ECOVIET</span>
				   </div>
				<nav>
					<ul style={{ display: "flex", gap: "32px", listStyle: "none", margin: 0, padding: 0 }}>
						{navLinks.map((link, idx) => (
							<li key={idx}>
								<a href={link.href} style={{ color: idx < 3 ? "#333" : "#4CAF50", fontWeight: idx < 3 ? "500" : "bold", textDecoration: "none", fontSize: "1rem", padding: "8px 16px", borderRadius: "6px", border: idx > 2 ? "2px solid #4CAF50" : "none", background: idx > 2 ? "#fff" : "none" }}>
									{link.name}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</div>
		</header>
	);
};

export default Header;
