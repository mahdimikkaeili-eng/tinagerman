"use client";

import { useState, useEffect } from "react";
import { Menu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

const navItems = [
  { key: "home", labelKey: "navHome" as const, href: "#home" },
  { key: "courses", labelKey: "navCourses" as const, href: "#courses" },
  { key: "placement", labelKey: "navPlacement" as const, href: "#placement-test" },
  { key: "resources", labelKey: "navResources" as const, href: "#resources" },
  { key: "about", labelKey: "navAbout" as const, href: "#about" },
  { key: "contact", labelKey: "navContact" as const, href: "#contact" },
  { key: "faq", labelKey: "navFaq" as const, href: "#faq" },
];

export function Header() {
  const {
    language,
    setLanguage,
    mobileMenuOpen,
    setMobileMenuOpen,
    setShowAuthModal,
    setAuthMode,
  } = useAppStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openLogin = () => {
    setAuthMode("login");
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  const openSignup = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick("#home");
            }}
            className="flex items-center gap-2 group"
          >
            <div className="flex items-center gap-1">
              {/* German flag accent */}
              <div className="flex flex-col w-1.5 h-6 rounded-full overflow-hidden">
                <div className="flex-1 bg-slate-900" />
                <div className="flex-1 bg-red-500" />
                <div className="flex-1 bg-amber-500" />
              </div>
              <span className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Deutsch mit Tina
              </span>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all"
              >
                {t(item.labelKey, language)}
              </a>
            ))}
          </nav>

          {/* Right side: language switcher + auth + mobile menu */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "de" : "en")}
              className="hidden sm:flex items-center gap-1.5 text-slate-600 hover:text-emerald-600"
              aria-label={`Switch language to ${language === "en" ? "German" : "English"}`}
            >
              <Globe className="size-4" />
              <span className="text-xs font-semibold">{language === "en" ? "DE" : "EN"}</span>
            </Button>

            {/* Auth buttons (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-emerald-600"
                onClick={openLogin}
              >
                {t("login", language)}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={openSignup}
              >
                {t("signup", language)}
              </Button>
            </div>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-slate-600"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex flex-col w-1.5 h-6 rounded-full overflow-hidden">
                      <div className="flex-1 bg-slate-900" />
                      <div className="flex-1 bg-red-500" />
                      <div className="flex-1 bg-amber-500" />
                    </div>
                    Deutsch mit Tina
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4 mt-4" aria-label="Mobile navigation">
                  {navItems.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(item.href);
                      }}
                      className="flex items-center px-4 py-3 text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    >
                      {t(item.labelKey, language)}
                    </a>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 px-4 mt-6">
                  {/* Language switcher in mobile */}
                  <Button
                    variant="outline"
                    onClick={() => setLanguage(language === "en" ? "de" : "en")}
                    className="justify-start gap-2"
                  >
                    <Globe className="size-4" />
                    {language === "en" ? "Auf Deutsch anzeigen" : "Show in English"}
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={openLogin}
                  >
                    {t("login", language)}
                  </Button>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={openSignup}
                  >
                    {t("signup", language)}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
