import Navigation from '@/components/landing/Navigation';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-primary/5 to-primary/10'>
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
