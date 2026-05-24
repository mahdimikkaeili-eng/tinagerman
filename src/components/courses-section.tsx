"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

interface Course {
  level: string;
  levelColor: string;
  bgColor: string;
  borderColor: string;
  titleKey: "courseA1Title" | "courseA2Title" | "courseB1Title" | "courseB2Title" | "courseB2ExamTitle";
  descKey: "courseA1Desc" | "courseA2Desc" | "courseB1Desc" | "courseB2Desc" | "courseB2ExamDesc";
  icon: string;
}

const courses: Course[] = [
  {
    level: "A1",
    levelColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    titleKey: "courseA1Title",
    descKey: "courseA1Desc",
    icon: "🌱",
  },
  {
    level: "A2",
    levelColor: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    titleKey: "courseA2Title",
    descKey: "courseA2Desc",
    icon: "🌿",
  },
  {
    level: "B1",
    levelColor: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    titleKey: "courseB1Title",
    descKey: "courseB1Desc",
    icon: "🌳",
  },
  {
    level: "B2",
    levelColor: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    titleKey: "courseB2Title",
    descKey: "courseB2Desc",
    icon: "🏔️",
  },
  {
    level: "B2",
    levelColor: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    titleKey: "courseB2ExamTitle",
    descKey: "courseB2ExamDesc",
    icon: "🎓",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function CoursesSection() {
  const { language } = useAppStore();

  return (
    <section id="courses" className="py-20 md:py-28 bg-slate-50/50">
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
            {t("coursesSectionTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("coursesSectionSubtitle", language)}
          </p>
        </motion.div>

        {/* Course cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {courses.map((course, index) => (
            <motion.div key={`${course.level}-${index}`} variants={cardVariants} whileHover={{ y: -4 }}>
              <Card className="h-full flex flex-col border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Level header bar */}
                <div className={`${course.bgColor} px-6 pt-5 pb-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{course.icon}</span>
                      <Badge
                        className={`${course.bgColor} ${course.levelColor} border ${course.borderColor} font-bold text-sm`}
                        variant="outline"
                      >
                        {course.level}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-slate-900">
                    {t(course.titleKey, language)}
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1">
                  <CardDescription className="text-slate-500 leading-relaxed">
                    {t(course.descKey, language)}
                  </CardDescription>
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {t("courseDuration", language)}
                    </div>
                  </div>
                  <p className="text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md">
                    💰 {t("coursePrice", language)}
                  </p>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mt-1"
                    onClick={() => window.open("https://wa.me/4367763401913", "_blank")}
                  >
                    {t("courseBookNow", language)}
                    <ArrowRight className="size-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
