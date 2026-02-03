import React from "react";
import { TruckElectric, Gift, Trees } from "lucide-react";

const features = [
	{
		icon: "truck",
		title: "Thu gom dễ dàng",
		desc: "Chúng tôi hỗ trợ thu gom rác tái chế nhanh chóng tại các điểm đổi quà khắp thành phố, thuận tiện quanh khu vực cư dân."
	},
	{
		icon: "gift",
		title: "Tích điểm đổi quà",
		desc: "Hoạt động tái chế giúp bạn dễ dàng nhận thưởng, tích điểm đổi quà sinh thái, voucher giảm giá."
	},
	{
		icon: "trees",
		title: "Bảo vệ môi trường",
		desc: "Góp phần giảm thiểu rác thải và bảo vệ môi trường sống, cùng nhau xây dựng thành phố xanh sạch đẹp."
	}
];

const FeatureSection = () => {
	return (
		<section className="feature-section" style={{ padding: "48px 0", background: "#F7FAF7" }}>
			<h3 style={{ textAlign: "center", fontSize: "2rem", fontWeight: "bold", marginBottom: "32px" }}>
				Quy trình đơn giản
			</h3>
			<div style={{ display: "flex", justifyContent: "center", gap: "32px" }}>
				{features.map((feature, idx) => (
					<div
						key={idx}
						style={{
							background: "#fff",
							borderRadius: "16px",
							boxShadow: "0 2px 8px #e0e0e0",
							padding: "32px",
							width: "280px",
							textAlign: "center"
						}}
					>
						<div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "2.5rem", marginBottom: "16px" }}>
							{idx === 0 && <TruckElectric size={40} color="#4CAF50" />}
							{idx === 1 && <Gift size={40} color="#4CAF50" />}
							{idx === 2 && <Trees size={40} color="#4CAF50" />}
						</div>
						<h4 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "12px" }}>{feature.title}</h4>
						<p style={{ color: "#555" }}>{feature.desc}</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default FeatureSection;
