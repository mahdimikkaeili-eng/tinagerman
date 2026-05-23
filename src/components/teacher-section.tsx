"use client";

import { motion } from "framer-motion";
import { Award, Users, Languages, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

const credentials = [
  {
    icon: Award,
    labelEn: "C1 Certificate",
    labelDe: "C1-Zertifikat",
  },
  {
    icon: Users,
    labelEn: "200+ Students",
    labelDe: "200+ Schüler",
  },
  {
    icon: Languages,
    labelEn: "German, English",
    labelDe: "Deutsch, Englisch",
  },
];

export function TeacherSection() {
  const { language } = useAppStore();

  return (
    <section id="about" className="py-20 md:py-28 bg-white">
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
            {t("teacherSectionTitle", language)}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-slate-200 shadow-lg">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-[320px_1fr]">
                {/* Left — Photo & Quick Info */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-8 flex flex-col items-center justify-center text-center">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-xl mb-4">
                    <AvatarFallback className="bg-emerald-600 text-white text-4xl font-bold">
                      T
                    </AvatarFallback>
                  </Avatar>

                  <h3 className="text-2xl font-bold text-slate-900">
                    {t("teacherName", language)}
                  </h3>

                  {/* Star rating */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="size-4 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-sm font-semibold text-slate-700 ml-1">
                      {t("teacherRating", language)}
                    </span>
                  </div>

                  {/* Language badges */}
                  <div className="flex gap-2 mt-4">
                    <Badge
                      variant="secondary"
                      className="bg-white text-emerald-700 border border-emerald-200"
                    >
                      🇩🇪 Deutsch
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white text-emerald-700 border border-emerald-200"
                    >
                      🇬🇧 English
                    </Badge>
                  </div>

                  <Button
                    className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md w-full max-w-[220px]"
                    onClick={() => window.open("https://wa.me/4367763401913", "_blank")}
                  >
                    {t("teacherCta", language)}
                  </Button>
                </div>

                {/* Right — Bio & Credentials */}
                <div className="p-8">
                  <p className="text-slate-600 leading-relaxed text-base">
                    {t("teacherBio", language)}
                  </p>

                  <Separator className="my-6" />

                  {/* Credential cards */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    {credentials.map((cred, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ y: -2 }}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-emerald-50 hover:border-emerald-100"
                      >
                        <cred.icon className="size-6 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-700 text-center">
                          {language === "en" ? cred.labelEn : cred.labelDe}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Teaching highlights */}
                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    {(
                      language === "en"
                        ? [
                            "Personalized lesson plans",
                            "Conversation-focused approach",
                            "Flexible scheduling",
                            "Homework & feedback included",
                          ]
                        : [
                            "Personalisierte Lernpläne",
                            "Konversationsorientierter Ansatz",
                            "Flexible Zeiteinteilung",
                            "Hausaufgaben & Feedback inklusive",
                          ]
                    ).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
