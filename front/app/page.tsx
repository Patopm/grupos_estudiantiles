import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";
import GroupsCarousel from "@/components/landing/GroupsCarousel";
import HeroSection from "@/components/landing/HeroSection";
import Navigation from "@/components/landing/Navigation";
import StatsSection from "@/components/landing/StatsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="bg-gradient-to-br from-primary/5 to-primary/10">
        <HeroSection />
      </div>
      <GroupsCarousel />
      <StatsSection />
      <FeaturesSection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
