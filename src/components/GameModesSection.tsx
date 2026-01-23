import { useState } from "react";

const gameModes = [
  {
    id: "bomb",
    title: "BOMB DEFUSAL",
    subtitle: "5v5 COMPETITIVE",
    description: "Plant or defuse the bomb in this high-stakes competitive mode. Coordinate with your team, control key areas, and outsmart your opponents.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
  },
  {
    id: "hostage",
    title: "HOSTAGE RESCUE",
    subtitle: "TACTICAL OPERATION",
    description: "Extract hostages from heavily fortified locations. Use stealth, strategy, and precision to complete the mission without casualties.",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
  },
  {
    id: "coop",
    title: "CO-OP MISSIONS",
    subtitle: "PVE EXPERIENCE",
    description: "Team up with friends against AI-controlled enemies in challenging cooperative scenarios with dynamic objectives.",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
  },
];

const GameModesSection = () => {
  const [activeMode, setActiveMode] = useState(gameModes[0]);

  return (
    <section className="relative py-24 lg:py-32 bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-wine/20 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-crimson font-heading text-sm tracking-[0.3em] uppercase">Game Modes</span>
          <h2 className="font-heading text-5xl lg:text-6xl text-white mt-4">
            CHOOSE YOUR <span className="text-crimson">BATTLEFIELD</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Mode Selector */}
          <div className="space-y-4">
            {gameModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode)}
                className={`w-full text-left p-6 border transition-all duration-300 group ${
                  activeMode.id === mode.id
                    ? "bg-crimson/10 border-crimson"
                    : "bg-card/30 border-border/50 hover:border-crimson/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs tracking-[0.2em] uppercase ${
                      activeMode.id === mode.id ? "text-crimson" : "text-muted-foreground"
                    }`}>
                      {mode.subtitle}
                    </span>
                    <h3 className="font-heading text-2xl lg:text-3xl text-white mt-1">
                      {mode.title}
                    </h3>
                  </div>
                  <div className={`w-3 h-3 rounded-full transition-colors ${
                    activeMode.id === mode.id ? "bg-crimson" : "bg-muted"
                  }`} />
                </div>
                {activeMode.id === mode.id && (
                  <p className="text-muted-foreground text-sm mt-4 leading-relaxed">
                    {mode.description}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Mode Preview */}
          <div className="relative aspect-video lg:aspect-[4/3]">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent z-10" />
            <img
              src={activeMode.image}
              alt={activeMode.title}
              className="w-full h-full object-cover grayscale contrast-125"
            />
            {/* Red overlay */}
            <div className="absolute inset-0 bg-crimson/10 mix-blend-overlay" />
            {/* Corner frame */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-crimson" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-crimson" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GameModesSection;
