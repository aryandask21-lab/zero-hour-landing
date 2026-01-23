import { Play } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-wine via-crimson/80 to-wine" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22%2F%3E%3Cpath%20d%3D%22M30%200v60M0%2030h60%22%20stroke%3D%22%23000%22%20stroke-opacity%3D%22.1%22%2F%3E%3C%2Fsvg%3E')] opacity-30" />
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="font-heading text-5xl lg:text-7xl text-white mb-6">
          READY TO <span className="text-background">DEPLOY?</span>
        </h2>
        <p className="text-white/80 max-w-xl mx-auto mb-10 text-lg">
          Join thousands of tactical operators in the most intense close-quarter combat experience. Your mission awaits.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <button className="btn-tactical bg-background text-white border-2 border-background hover:bg-background/90 group">
            <Play size={16} className="mr-2 transition-transform group-hover:scale-110" />
            WATCH TRAILER
          </button>
          <button className="btn-tactical bg-white text-background border-2 border-white hover:bg-white/90 font-bold">
            BUY NOW — $14.99
          </button>
        </div>

        {/* Platform badges */}
        <div className="mt-12 flex items-center justify-center gap-8 opacity-70">
          <span className="text-white/60 text-sm">Available on</span>
          <div className="flex items-center gap-6">
            <span className="font-heading text-white text-lg">STEAM</span>
            <span className="font-heading text-white text-lg">EPIC</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
