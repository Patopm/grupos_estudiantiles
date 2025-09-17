import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import GroupsCarousel from '@/components/landing/GroupsCarousel';
import StatsSection from '@/components/landing/StatsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className='min-h-screen'>
      <Navigation />
      <div className='bg-gradient-to-br from-primary/5 to-primary/10'>
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
