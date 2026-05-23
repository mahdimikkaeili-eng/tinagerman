"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Video, Rocket } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

const steps = [
  {
    icon: CalendarCheck,
    titleKey: "howStep1Title" as const,
    descKey: "howStep1Desc" as const,
    color: "emerald",
    number: "01",
  },
  {
    icon: Video,
    titleKey: "howStep2Title" as const,
    descKey: "howStep2Desc" as const,
    color: "amber",
    number: "02",
  },
  {
    icon: Rocket,
    titleKey: "howStep3Title" as const,
    descKey: "howStep3Desc" as const,
    color: "emerald",
    number: "03",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorksSection() {
  const { language } = useAppStore();

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("howTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            {t("howSubtitle", language)}
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-3 gap-8 md:gap-12 relative"
        >
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-24 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-emerald-200 via-amber-200 to-emerald-200" />

          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number + icon */}
              <div className="relative mb-6">
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                    step.color === "emerald"
                      ? "bg-emerald-100 shadow-emerald-100/50"
                      : "bg-amber-100 shadow-amber-100/50"
                  }`}
                >
                  <step.icon
                    className={`size-9 ${
                      step.color === "emerald" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  />
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ${
                    step.color === "emerald" ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                >
                  {step.number}
                </div>
              </div>

              {/* Step text */}
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t(step.titleKey, language)}
              </h3>
              <p className="text-slate-500 leading-relaxed max-w-xs">
                {t(step.descKey, language)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
