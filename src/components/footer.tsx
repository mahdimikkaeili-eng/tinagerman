"use client";

import { MessageCircle, Send, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

const footerNavItems = [
  { labelKey: "navHome" as const, href: "#home" },
  { labelKey: "navCourses" as const, href: "#courses" },
  { labelKey: "navAbout" as const, href: "#about" },
  { labelKey: "navContact" as const, href: "#contact" },
];

export function Footer() {
  const { language } = useAppStore();

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex flex-col w-1.5 h-6 rounded-full overflow-hidden">
                <div className="flex-1 bg-slate-400" />
                <div className="flex-1 bg-red-400" />
                <div className="flex-1 bg-amber-400" />
              </div>
              <a href="/" className="text-lg font-bold text-white hover:text-emerald-400 transition-colors">Deutsch mit Tina</a>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              {language === "en"
                ? "Personalized German lessons from A1 to B2. Learn with a certified teacher from Austria."
                : "Personalisierter Deutschunterricht von A1 bis B2. Lernen Sie mit einer zertifizierten Lehrerin aus Österreich."}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              {t("footerQuickLinks", language)}
            </h4>
            <ul className="space-y-2.5">
              {footerNavItems.map((item) => (
                <li key={item.labelKey}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.href);
                    }}
                    className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {t(item.labelKey, language)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">
              {t("footerContact", language)}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://wa.me/4367763401913"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="tg://resolve?domain=Deutschmittintin"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors"
                >
                  <Send className="size-4" />
                  Telegram
                </a>
              </li>
              <li>
                
                <a
                  href="mailto:tina@tinagerman.com"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
                >
                  <Mail className="size-4" />
                  tina@tinagerman.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-slate-700" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>{t("footerCopyright", language)}</p>
          <div className="flex items-center gap-4 text-xs">
            <span>tinagerman.com</span>
            <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
