import React from "react";

const stats = [
	{
		label: "Người tham gia",
		value: "10,000+",
		change: "+21%"
	},
	{
		label: "Đã tái chế",
		value: "500 Tấn",
		change: "+25%"
	},
	{
		label: "Cây xanh đã trồng",
		value: "2,500",
		change: "+5%"
	}
];

const StatusSection = () => {
	return (
		<section className="status-section" style={{ display: "flex", justifyContent: "center", gap: "32px", margin: "48px 0" }}>
			{stats.map((stat, idx) => (
				<div key={idx} style={{ background: "#fff", borderRadius: "16px", boxShadow: "0 2px 8px #e0e0e0", padding: "32px 48px", textAlign: "center", minWidth: "220px" }}>
					<div style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>{stat.value}</div>
					<div style={{ fontSize: "1rem", color: "#4CAF50", fontWeight: "bold", marginBottom: "4px" }}>{stat.label}</div>
					<div style={{ fontSize: "0.95rem", color: "#888" }}>{stat.change}</div>
				</div>
			))}
		</section>
	);
};

export default StatusSection;
