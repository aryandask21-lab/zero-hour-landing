import { Twitter, Youtube, MessageCircle, Gamepad2 } from "lucide-react";

const footerLinks = {
  game: ["Buy Now", "Features", "Game Modes", "Roadmap"],
  community: ["Discord", "Forums", "Esports", "Content Creators"],
  support: ["FAQ", "Contact", "Bug Report", "System Requirements"],
  legal: ["Terms of Service", "Privacy Policy", "Refund Policy", "EULA"],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: MessageCircle, href: "#", label: "Discord" },
  { icon: Gamepad2, href: "#", label: "Steam" },
];

const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border/30">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-crimson rounded flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="font-heading text-2xl text-white">eArena</span>
            </div>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              A tactical first-person shooter developed in Bangladesh. Experience realistic close-quarter combat.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-crimson hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-white mb-4">GAME</h4>
            <ul className="space-y-3">
              {footerLinks.game.map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-crimson transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-white mb-4">COMMUNITY</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-crimson transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-white mb-4">SUPPORT</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-crimson transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-white mb-4">LEGAL</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground text-sm hover:text-crimson transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/30 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2026 eArena. All rights reserved.
          </p>
          <p className="text-muted-foreground text-xs">
            Made with passion in Bangladesh 🇧🇩
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
