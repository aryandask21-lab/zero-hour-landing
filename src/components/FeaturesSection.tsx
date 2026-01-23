import { Crosshair, Shield, Users, Zap, Target, Radio } from "lucide-react";

const features = [
  {
    icon: Crosshair,
    title: "CLOSE QUARTER COMBAT",
    description: "Intense room-clearing action with realistic weapon handling and tactical positioning.",
  },
  {
    icon: Shield,
    title: "STRATEGIC GAMEPLAY",
    description: "Plan your approach, coordinate with teammates, and execute precision strikes.",
  },
  {
    icon: Users,
    title: "5V5 MULTIPLAYER",
    description: "Team-based tactical operations with voice communication and role assignments.",
  },
  {
    icon: Zap,
    title: "REALISTIC BALLISTICS",
    description: "Authentic weapon physics, penetration mechanics, and damage modeling.",
  },
  {
    icon: Target,
    title: "MISSION OBJECTIVES",
    description: "Dynamic objectives from hostage rescue to bomb defusal scenarios.",
  },
  {
    icon: Radio,
    title: "TACTICAL EQUIPMENT",
    description: "Breaching tools, flashbangs, drones, and specialized operator gear.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-24 lg:py-32 bg-secondary/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, hsl(var(--border)) 50px, hsl(var(--border)) 51px),
                           repeating-linear-gradient(90deg, transparent, transparent 50px, hsl(var(--border)) 50px, hsl(var(--border)) 51px)`
        }} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-crimson font-heading text-sm tracking-[0.3em] uppercase">Core Features</span>
          <h2 className="font-heading text-5xl lg:text-6xl text-white mt-4">
            BUILT FOR <span className="text-crimson">TACTICAL</span> PLAYERS
          </h2>
          <div className="w-24 h-1 bg-crimson mx-auto mt-6" />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card/50 border border-border/50 p-8 transition-all duration-300 hover:border-crimson/50 hover:bg-card/80"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Corner Accent */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-crimson/50 group-hover:border-crimson transition-colors" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-crimson/50 group-hover:border-crimson transition-colors" />
              
              {/* Icon */}
              <div className="w-14 h-14 bg-crimson/10 border border-crimson/30 flex items-center justify-center mb-6 group-hover:bg-crimson/20 transition-colors">
                <feature.icon className="w-7 h-7 text-crimson" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-xl text-white mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
