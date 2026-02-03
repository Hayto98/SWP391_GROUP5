import React from "react";
import Header from "@/components/ui/homepageUI/header";
import PrimarySection from "@/components/ui/homepageUI/primarySection";
import StatusSection from "@/components/ui/homepageUI/statusSection";
import FeatureSection from "@/components/ui/homepageUI/featureSection";
import CTASection from "@/components/ui/homepageUI/CTASection";
import Footer from "@/components/ui/homepageUI/footer";

const Homepage = () => {
	return (
		<>
			<Header />
			<main>
				<PrimarySection />
				<StatusSection />
				<FeatureSection />
				<CTASection />
			</main>
			<Footer />
		</>
	);
};

export default Homepage;
