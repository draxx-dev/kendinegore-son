import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full fixed top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/90 backdrop-blur-xl border-b border-white/30 shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">
              KendineGöre
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" className="text-foreground hover:text-foreground hover:bg-secondary/50" asChild>
              <Link to="/auth">Giriş Yap</Link>
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" asChild>
              <Link to="/auth">İşletmeni Kaydet</Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-secondary/50" asChild>
              <Link to="/auth">Giriş</Link>
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/auth">Kayıt</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};