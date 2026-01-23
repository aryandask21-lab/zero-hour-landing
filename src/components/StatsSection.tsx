const stats = [
  { value: "500K+", label: "ACTIVE PLAYERS" },
  { value: "15M+", label: "MATCHES PLAYED" },
  { value: "4.8", label: "STEAM RATING" },
  { value: "50+", label: "WEAPONS & GEAR" },
];

const StatsSection = () => {
  return (
    <section className="relative py-16 lg:py-20 bg-background overflow-hidden">
      {/* Red Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-crimson/10 blur-[100px] rounded-full" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center group">
              <div className="relative inline-block">
                <span className="font-heading text-5xl lg:text-6xl xl:text-7xl text-white group-hover:text-crimson transition-colors duration-300">
                  {stat.value}
                </span>
                {/* Underline */}
                <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-crimson to-transparent opacity-50" />
              </div>
              <p className="text-muted-foreground text-xs lg:text-sm mt-4 tracking-[0.2em] uppercase">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
