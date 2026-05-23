"use client";

import { motion } from "framer-motion";
import { MessageCircleHeart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

export function TestimonialsSection() {
  const { language } = useAppStore();

  return (
    <section className="py-20 md:py-28 bg-slate-50/50">
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
            {t("testimonialsTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            {t("testimonialsSubtitle", language)}
          </p>
        </motion.div>

        {/* Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="max-w-lg mx-auto border-dashed border-slate-300 bg-white/50">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <MessageCircleHeart className="size-8 text-emerald-600" />
              </div>
              <p className="text-slate-500 text-center leading-relaxed">
                {t("testimonialsPlaceholder", language)}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
