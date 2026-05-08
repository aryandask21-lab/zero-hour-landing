import { Play } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroOperators from "@/assets/hero-operators.jpg";

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.3, 0.8]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden film-grain">
      {/* Parallax Background Image */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${heroOperators})`,
          y: backgroundY,
          scale: backgroundScale
        }}
      >
        {/* Gradient Overlay with dynamic opacity */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent"
          style={{ opacity: overlayOpacity }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </motion.div>

      {/* Red Light Beam Effect */}
      <div className="absolute top-0 right-1/3 w-32 h-full bg-gradient-to-b from-crimson/30 via-crimson/10 to-transparent blur-3xl animate-pulse-glow" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-crimson/60 rounded-full animate-float-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Smoke Effect */}
      <div className="absolute bottom-0 left-0 w-96 h-64 bg-gradient-to-t from-wine/20 to-transparent blur-3xl animate-smoke" />

      {/* Parallax Content */}
      <motion.div 
        className="container mx-auto px-6 pt-20 lg:pt-0 relative z-10"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="max-w-2xl">
          {/* Title */}
          <h1 
            className="font-heading text-7xl sm:text-8xl lg:text-9xl text-crimson glow-red opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            eArena
          </h1>

          {/* Subtitle */}
          <div 
            className="mt-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white">
              Tactical FPS Action
            </h2>
            <div className="w-32 h-1 bg-crimson mt-3" />
          </div>

          {/* Description */}
          <p 
            className="mt-6 text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            Experience intense close-quarter battles, strategic gameplay, and realistic gunfights in this Bangladesh-developed tactical shooter.
          </p>

          {/* CTA Buttons */}
          <div 
            className="mt-8 flex flex-wrap gap-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.8s" }}
          >
            <button className="btn-outline-tactical group">
              <Play size={16} className="mr-2 transition-transform group-hover:scale-110" />
              WATCH TRAILER
            </button>
            <button className="btn-primary-tactical">
              BUY NOW
            </button>
          </div>

          {/* Platform Icons */}
          <div 
            className="mt-12 flex items-center gap-6 opacity-0 animate-fade-in"
            style={{ animationDelay: "1.2s" }}
          >
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Available on</span>
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-white transition-colors" fill="currentColor">
                <path d="M3 3h18v18H3V3zm2.5 2.5v13h13v-13h-13zM8 8h8v2H8V8zm0 3h8v2H8v-2zm0 3h5v2H8v-2z"/>
              </svg>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-muted-foreground hover:text-white transition-colors" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
