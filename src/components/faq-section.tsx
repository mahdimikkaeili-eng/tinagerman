"use client";

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

const faqKeys = [
  { qKey: "faqQ1" as const, aKey: "faqA1" as const },
  { qKey: "faqQ2" as const, aKey: "faqA2" as const },
  { qKey: "faqQ3" as const, aKey: "faqA3" as const },
  { qKey: "faqQ4" as const, aKey: "faqA4" as const },
  { qKey: "faqQ5" as const, aKey: "faqA5" as const },
  { qKey: "faqQ6" as const, aKey: "faqA6" as const },
  { qKey: "faqQ7" as const, aKey: "faqA7" as const },
  { qKey: "faqQ8" as const, aKey: "faqA8" as const },
];

const faqIcons = ["💻", "📚", "⏱️", "🎁", "📊", "💰", "📅", "🌟"];

export function FaqSection() {
  const { language } = useAppStore();

  return (
    <section id="faq" className="py-20 md:py-28 bg-slate-50/50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <HelpCircle className="size-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("faqTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("faqSubtitle", language)}
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Accordion type="single" collapsible className="w-full">
                {faqKeys.map((faq, index) => (
                  <AccordionItem
                    key={faq.qKey}
                    value={faq.qKey}
                    className={`${index < faqKeys.length - 1 ? "border-b border-slate-100" : ""}`}
                  >
                    <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-emerald-50/50 transition-colors group">
                      <span className="flex items-center gap-3 text-left">
                        <span className="text-lg shrink-0">{faqIcons[index]}</span>
                        <span className="text-base font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          {t(faq.qKey, language)}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-5">
                      <div className="pl-8">
                        <p className="text-slate-600 leading-relaxed">
                          {t(faq.aKey, language)}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
