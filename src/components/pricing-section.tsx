"use client";

import { motion } from "framer-motion";
import { Check, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

export function PricingSection() {
  const { language, isAuthenticated, user, setShowAuthModal, setAuthMode, setPendingAction } = useAppStore();

  const handleBookTrial = () => {
    if (!isAuthenticated) {
      setPendingAction("whatsapp-trial");
      setAuthMode("signup");
      setShowAuthModal(true);
      return;
    }
    // If authenticated, redirect to WhatsApp
    const message = language === "en"
      ? "Hi Tina! I'd like to book a free trial lesson."
      : "Hallo Tina! Ich möchte eine kostenlose Probestunde buchen.";
    window.open(`https://wa.me/4367763401913?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleBookLesson = () => {
    if (!isAuthenticated) {
      setPendingAction("whatsapp-lesson");
      setAuthMode("signup");
      setShowAuthModal(true);
      return;
    }
    const message = language === "en"
      ? "Hi Tina! I'd like to book a German lesson."
      : "Hallo Tina! Ich möchte eine Deutschstunde buchen.";
    window.open(`https://wa.me/4367763401913?text=${encodeURIComponent(message)}`, "_blank");
  };

  const plans = [
    {
      name: language === "en" ? "Trial Lesson" : "Probestunde",
      nameDe: "Probestunde",
      price: "0",
      priceNote: language === "en" ? "First lesson free" : "Erste Stunde kostenlos",
      description: language === "en"
        ? "Try before you commit — a full 50-minute lesson to see if Tina's teaching style works for you."
        : "Probieren Sie vor dem Commit — eine vollständige 50-minütige Unterrichtsstunde, um zu sehen, ob Tinas Unterrichtsstil zu Ihnen passt.",
      features: language === "en"
        ? ["50-minute lesson", "Level assessment", "Personalized feedback", "No obligation"]
        : ["50-minütige Unterrichtsstunde", "Niveaubestimmung", "Persönliches Feedback", "Unverbindlich"],
      icon: "🌟",
      highlight: true,
      cta: language === "en" ? "Book Free Trial" : "Kostenlose Probestunde",
      onCta: handleBookTrial,
    },
    {
      name: language === "en" ? "Single Lesson" : "Einzelstunde",
      nameDe: "Einzelstunde",
      price: "10+",
      priceNote: language === "en" ? "Per lesson" : "Pro Unterrichtsstunde",
      description: language === "en"
        ? "Flexible, pay-as-you-go lessons. Perfect for students who want to learn at their own pace."
        : "Flexible, Pay-as-you-go Unterrichtsstunden. Perfekt für Schüler, die in ihrem eigenen Tempo lernen möchten.",
      features: language === "en"
        ? ["50-minute lesson", "Any level A1–B2", "Google Meet", "Homework & feedback", "Flexible scheduling"]
        : ["50-minütige Unterrichtsstunde", "Alle Niveaus A1–B2", "Google Meet", "Hausaufgaben & Feedback", "Flexible Terminplanung"],
      icon: "📚",
      highlight: false,
      cta: language === "en" ? "Book a Lesson" : "Stunde buchen",
      onCta: handleBookLesson,
    },
    {
      name: language === "en" ? "Package (10 Lessons)" : "Paket (10 Stunden)",
      nameDe: "Paket (10 Stunden)",
      price: "90+",
      priceNote: language === "en" ? "Save 10%+" : "10%+ sparen",
      description: language === "en"
        ? "Commit to your learning journey with a discounted package. Consistent practice leads to faster progress."
        : "Verpflichten Sie sich Ihrer Lernreise mit einem vergünstigten Paket. Regelmäßige Übung führt zu schnellerem Fortschritt.",
      features: language === "en"
        ? ["10 × 50-min lessons", "Any level A1–B2", "Google Meet", "Homework & feedback", "Priority scheduling", "Best value"]
        : ["10 × 50-minütige Stunden", "Alle Niveaus A1–B2", "Google Meet", "Hausaufgaben & Feedback", "Prioritätsterminplanung", "Bestes Preis-Leistungs-Verhältnis"],
      icon: "🎯",
      highlight: false,
      cta: language === "en" ? "Book a Lesson" : "Stunde buchen",
      onCta: handleBookLesson,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("pricingTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("pricingSubtitle", language)}
          </p>
        </motion.div>

        {/* Pricing cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`h-full flex flex-col relative overflow-hidden ${
                plan.highlight
                  ? "border-2 border-emerald-400 shadow-xl shadow-emerald-100/50"
                  : "border-slate-200 hover:border-emerald-200 hover:shadow-lg"
              } transition-all duration-300`}>
                {plan.highlight && (
                  <div className="absolute top-0 right-0">
                    <Badge className="bg-emerald-600 text-white rounded-none rounded-bl-lg px-3 py-1">
                      <Star className="size-3 mr-1" />
                      {language === "en" ? "Popular" : "Beliebt"}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <span className="text-3xl mb-2">{plan.icon}</span>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm min-h-[40px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{plan.priceNote}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={plan.onCta}
                  >
                    {plan.cta}
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-slate-400 mt-8"
        >
          {language === "en"
            ? "💰 Final pricing discussed during your free trial. We offer flexible options to fit your budget."
            : "💰 Endgültige Preise werden während Ihrer kostenlosen Probestunde besprochen. Wir bieten flexible Optionen für Ihr Budget."}
        </motion.p>
      </div>
    </section>
  );
}
