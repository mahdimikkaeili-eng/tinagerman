"use client";

import { motion } from "framer-motion";
import { MessageCircle, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

export function ContactSection() {
  const { language } = useAppStore();

  return (
    <section id="contact" className="py-20 md:py-28 bg-white">
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
            {t("contactTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            {t("contactSubtitle", language)}
          </p>
        </motion.div>

        {/* Contact cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto"
        >
          {/* WhatsApp */}
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full border-green-200 hover:border-green-300 hover:shadow-lg transition-all duration-300">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <MessageCircle className="size-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t("contactWhatsApp", language)}
                </h3>
                <p className="text-sm text-slate-500">+43 677 6340 1913</p>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm mt-2"
                  onClick={() => window.open("https://wa.me/4367763401913", "_blank")}
                >
                  <MessageCircle className="size-4 mr-1.5" />
                  {language === "en" ? "Open WhatsApp" : "WhatsApp öffnen"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Telegram */}
          <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
            <Card className="h-full border-sky-200 hover:border-sky-300 hover:shadow-lg transition-all duration-300">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center">
                  <Send className="size-8 text-sky-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {t("contactTelegram", language)}
                </h3>
                <p className="text-sm text-slate-500">@Deutschmittintin</p>
                <div className="flex flex-col gap-2 mt-2 w-full">
                  <Button
                    className="bg-sky-500 hover:bg-sky-600 text-white shadow-sm w-full"
                    onClick={() => {
                      // Try opening Telegram app directly via deep link (works in Iran)
                      window.location.href = "tg://resolve?domain=Deutschmittintin"
                    }}
                  >
                    <Send className="size-4 mr-1.5" />
                    {language === "en" ? "Open Telegram App" : "Telegram App öffnen"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-sky-300 text-sky-600 hover:bg-sky-50 w-full"
                    onClick={() => window.open("https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DDdeutschmittintin", "_blank")}
                  >
                    <Globe className="size-4 mr-1.5" />
                    {language === "en" ? "Open Telegram Web" : "Telegram Web öffnen"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center text-sm text-slate-400 mt-8"
        >
          💬 {t("contactNote", language)}
        </motion.p>
      </div>
    </section>
  );
}
