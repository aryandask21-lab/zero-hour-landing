import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";

const navLinks = [
  { name: "HOME", href: "/" },
  { name: "TOURNAMENTS", href: "/tournaments" },
  { name: "TEAMS", href: "/teams" },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const { isAdmin } = useRoles();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-crimson flex items-center justify-center">
              <span className="font-heading text-white text-lg">ZH</span>
            </div>
            <span className="font-heading text-2xl text-white tracking-wide">ZERO HOUR</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`nav-link ${location.pathname === link.href ? "active" : ""}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <>
                {isAdmin() && (
                  <Link 
                    to="/admin" 
                    className={`flex items-center gap-2 text-crimson hover:text-crimson/80 transition-colors ${location.pathname === '/admin' ? 'text-white' : ''}`}
                  >
                    <Shield size={16} />
                    <span className="text-sm font-medium">ADMIN</span>
                  </Link>
                )}
                <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors">
                  <User size={16} />
                  <span className="text-sm">{profile?.username || "Dashboard"}</span>
                </Link>
                <button onClick={signOut} className="btn-outline-tactical text-sm py-2 px-4">
                  <LogOut size={14} className="mr-1" /> LOGOUT
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn-primary-tactical">
                SIGN IN
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-t border-border/30">
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`nav-link ${location.pathname === link.href ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                {isAdmin() && (
                  <Link 
                    to="/admin" 
                    className="nav-link text-crimson flex items-center gap-2" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield size={16} />
                    ADMIN PANEL
                  </Link>
                )}
                <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                  DASHBOARD
                </Link>
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="btn-outline-tactical mt-2">
                  LOGOUT
                </button>
              </>
            ) : (
              <Link to="/auth" className="btn-primary-tactical mt-4" onClick={() => setMobileMenuOpen(false)}>
                SIGN IN
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
