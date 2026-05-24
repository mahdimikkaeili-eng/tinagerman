"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

export function HeroSection() {
  const { language } = useAppStore();

  const handleScrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-[90vh] flex items-center overflow-hidden pt-16"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-amber-50/30" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Top right decorative circle */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        {/* Bottom left decorative circle */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, #000 25%, #000 26%, transparent 27%, transparent 74%, #000 75%, #000 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
        />
        {/* Floating German-themed decorative shapes */}
        <motion.div
          className="absolute top-32 right-[15%] w-16 h-16 rounded-2xl bg-emerald-200/30 border border-emerald-200/50"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-48 right-[10%] w-10 h-10 rounded-xl bg-amber-200/30 border border-amber-200/50"
          animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute bottom-32 left-[12%] w-12 h-12 rounded-full bg-red-200/20 border border-red-200/40"
          animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1 text-sm font-medium"
              >
                {t("heroBadge", language)}
              </Badge>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              {t("heroTitle", language)}
            </h1>

            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-lg">
              {t("heroSubtitle", language)}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 transition-all text-base px-8 h-12"
                onClick={() => window.open("https://wa.me/4367763401913", "_blank")}
              >
                {t("heroCta", language)}
                <ArrowRight className="size-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 transition-all text-base px-8 h-12"
                onClick={() => handleScrollTo("#courses")}
              >
                <BookOpen className="size-4 mr-1" />
                {t("heroSecondaryCta", language)}
              </Button>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center gap-6 mt-4 text-sm text-slate-400"
            >
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span>5.0</span>
              </div>
              <span>•</span>
              <span>200+ {language === "en" ? "Students" : "Schüler"}</span>
              <span>•</span>
              <span>3+ {language === "en" ? "Years" : "Jahre"}</span>
            </motion.div>
          </motion.div>

          {/* Right content — decorative illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="hidden md:flex justify-center items-center"
          >
            <div className="relative">
              {/* Main illustration card */}
              <div className="relative w-80 h-96 bg-white rounded-3xl shadow-2xl shadow-emerald-100/50 border border-slate-100 overflow-hidden">
                {/* Gradient header */}
                <div className="h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 relative">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMjAgTDIwIDBMNDAgMjBMMjAgNDBaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PC9zdmc+')] opacity-30" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                    <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg border-4 border-white">
                      {/* @ts-expect-error Next.js Image */}
                      <img
                        src="/tina-avatar.jpg"
                        alt="Tina - German Teacher"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-14 px-6 text-center">
                  <h3 className="text-lg font-bold text-slate-900">Tina</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {language === "en" ? "German Teacher" : "Deutschlehrerin"}
                  </p>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2 mt-5">
                    <div className="bg-emerald-50 rounded-xl p-2.5">
                      <div className="text-lg font-bold text-emerald-600">B2</div>
                      <div className="text-[10px] text-slate-400">
                        {language === "en" ? "Level" : "Niveau"}
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2.5">
                      <div className="text-lg font-bold text-amber-600">200+</div>
                      <div className="text-[10px] text-slate-400">
                        {language === "en" ? "Students" : "Schüler"}
                      </div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-2.5">
                      <div className="text-lg font-bold text-emerald-600">5.0</div>
                      <div className="text-[10px] text-slate-400">
                        {language === "en" ? "Rating" : "Bewertung"}
                      </div>
                    </div>
                  </div>

                  {/* Language tags */}
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      🇩🇪 Deutsch
                    </Badge>
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      🇬🇧 English
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Floating elements around the card */}
              <motion.div
                className="absolute -top-4 -left-8 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-2"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-2xl">🇩🇪</span>
                <span className="text-sm font-semibold text-slate-700">A1→B2</span>
              </motion.div>

              <motion.div
                className="absolute -bottom-4 -right-6 bg-white rounded-2xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-2"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <span className="text-2xl">🎓</span>
                <span className="text-sm font-semibold text-slate-700">
                  {language === "en" ? "Certified" : "Zertifiziert"}
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
