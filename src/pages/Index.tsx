import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import FeaturesSection from "@/components/FeaturesSection";
import GameModesSection from "@/components/GameModesSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ScrollReveal>
        <StatsSection />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <FeaturesSection />
      </ScrollReveal>
      <ScrollReveal delay={0.1} direction="left">
        <GameModesSection />
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <CTASection />
      </ScrollReveal>
      <ScrollReveal delay={0.1} direction="up">
        <Footer />
      </ScrollReveal>
    </div>
  );
};

export default Index;
