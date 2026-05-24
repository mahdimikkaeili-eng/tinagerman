"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, ArrowRight, ArrowLeft, RotateCcw, MessageCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  level: string;
  levelColor: string;
  levelBg: string;
}

const questions: QuizQuestion[] = [
  // A1 Level (Q1-3)
  {
    id: 1,
    question: "Wie ___ Sie? — Ich ___ Maria.",
    options: ["heiße / heiße", "heißen / heiße", "heißt / heiße", "heißen / heißt"],
    correctIndex: 1,
    level: "A1",
    levelColor: "text-emerald-700",
    levelBg: "bg-emerald-50",
  },
  {
    id: 2,
    question: "Ich ___ ein Buch. Das Buch ___ sehr interessant.",
    options: ["habe / ist", "haben / sind", "habe / sind", "hat / ist"],
    correctIndex: 0,
    level: "A1",
    levelColor: "text-emerald-700",
    levelBg: "bg-emerald-50",
  },
  {
    id: 3,
    question: "___ du Kaffee oder Tee? — Ich ___ gerne Tee.",
    options: ["Möchtest / möchte", "Möchtet / möchtet", "Möchten / möchte", "Möchtest / möchtest"],
    correctIndex: 0,
    level: "A1",
    levelColor: "text-emerald-700",
    levelBg: "bg-emerald-50",
  },
  // A2 Level (Q4-6)
  {
    id: 4,
    question: "Ich gehe ___ supermarket. Ich muss ___ einkaufen.",
    options: ["ins / Brot", "zum / Brot", "ins / Brote", "in den / Äpfel"],
    correctIndex: 0,
    level: "A2",
    levelColor: "text-teal-700",
    levelBg: "bg-teal-50",
  },
  {
    id: 5,
    question: "Gestern ___ ich mit meinen Freunden ins Kino. Der Film ___ sehr gut.",
    options: ["gehe / war", "ging / war", "ging / wurde", "bin gegangen / ist"],
    correctIndex: 1,
    level: "A2",
    levelColor: "text-teal-700",
    levelBg: "bg-teal-50",
  },
  {
    id: 6,
    question: "Kannst du mir ___ helfen? Ich ___ mein Handy gefunden.",
    options: ["bitte / habe nicht", "mal / bin nicht", "bitte / habe nicht", "kurz / habe nicht"],
    correctIndex: 2,
    level: "A2",
    levelColor: "text-teal-700",
    levelBg: "bg-teal-50",
  },
  // B1 Level (Q7-8)
  {
    id: 7,
    question: "Wenn ich mehr Zeit ___, ___ ich nach Berlin reisen.",
    options: ["hätte / würde", "habe / werde", "hätte / würde", "hätte / wird"],
    correctIndex: 2,
    level: "B1",
    levelColor: "text-amber-700",
    levelBg: "bg-amber-50",
  },
  {
    id: 8,
    question: "Die Frau, ___ dort steht, ___ meine Deutschlehrerin.",
    options: ["die / ist", "welche / wird", "die / war", "der / ist"],
    correctIndex: 0,
    level: "B1",
    levelColor: "text-amber-700",
    levelBg: "bg-amber-50",
  },
  // B2 Level (Q9-10)
  {
    id: 9,
    question: "Das Haus ___ 1920 erbaut und ___ seitdem mehrfach renoviert.",
    options: ["wurde / ist", "wird / wurde", "wurde / hat", "ist / ist"],
    correctIndex: 0,
    level: "B2",
    levelColor: "text-orange-700",
    levelBg: "bg-orange-50",
  },
  {
    id: 10,
    question: "Er behauptet, die Prüfung bestanden zu haben, ___ er kaum ___ hat.",
    options: ["obwohl / gelernt", "trotzdem / gelernt", "weil / studiert", "obwohl / studiert"],
    correctIndex: 0,
    level: "B2",
    levelColor: "text-orange-700",
    levelBg: "bg-orange-50",
  },
];

function calculateLevel(answers: (number | null)[]): "A1" | "A2" | "B1" | "B2" {
  let correct = 0;
  let a1Correct = 0;
  let a2Correct = 0;
  let b1Correct = 0;
  let b2Correct = 0;

  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) {
      correct++;
      if (q.level === "A1") a1Correct++;
      if (q.level === "A2") a2Correct++;
      if (q.level === "B1") b1Correct++;
      if (q.level === "B2") b2Correct++;
    }
  });

  // Scoring logic: progressive difficulty
  if (correct >= 8 && b1Correct >= 1 && b2Correct >= 1) return "B2";
  if (correct >= 6 && b1Correct >= 1) return "B1";
  if (correct >= 4 && a2Correct >= 1) return "A2";
  return "A1";
}

export function PlacementTestSection() {
  const { language } = useAppStore();
  const [currentStep, setCurrentStep] = useState<"intro" | "quiz" | "result">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [resultLevel, setResultLevel] = useState<"A1" | "A2" | "B1" | "B2" | null>(null);

  const progress = currentStep === "quiz" ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  const handleStart = useCallback(() => {
    setCurrentStep("quiz");
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setResultLevel(null);
  }, []);

  const handleAnswer = useCallback(
    (value: string) => {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = parseInt(value, 10);
      setAnswers(newAnswers);
    },
    [answers, currentQuestion]
  );

  const handleNext = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // Submit
      const level = calculateLevel(answers);
      setResultLevel(level);
      setCurrentStep("result");
    }
  }, [currentQuestion, answers]);

  const handlePrev = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const handleRetake = useCallback(() => {
    setCurrentStep("intro");
    setCurrentQuestion(0);
    setAnswers(new Array(questions.length).fill(null));
    setResultLevel(null);
  }, []);

  const levelResultKey = resultLevel
    ? (`placementResult${resultLevel}` as const)
    : "placementResultA1";
  const levelDescKey = resultLevel
    ? (`placementResult${resultLevel}Desc` as const)
    : "placementResultA1Desc";

  const resultColors: Record<string, { text: string; bg: string; border: string }> = {
    A1: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    A2: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
    B1: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    B2: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  };

  const resultEmoji: Record<string, string> = {
    A1: "🌱",
    A2: "🌿",
    B1: "🌳",
    B2: "🏔️",
  };

  return (
    <section id="placement-test" className="py-20 md:py-28 bg-white">
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
              <ClipboardCheck className="size-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("placementTitle", language)}
          </h2>
          <p className="mt-2 text-lg text-emerald-600 font-medium">
            {t("placementSubtitle", language)}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* INTRO STATE */}
          {currentStep === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-emerald-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-6 py-8 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
                  >
                    <ClipboardCheck className="size-10 text-emerald-600" />
                  </motion.div>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto">
                    {t("placementDescription", language)}
                  </p>
                </div>
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    {["A1", "A2", "B1", "B2"].map((level) => (
                      <Badge
                        key={level}
                        variant="outline"
                        className={`${resultColors[level].bg} ${resultColors[level].text} ${resultColors[level].border} font-bold`}
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-400">
                    10 {language === "en" ? "questions" : "Fragen"} · 2-3 {language === "en" ? "minutes" : "Minuten"}
                  </p>
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm mt-2"
                    onClick={handleStart}
                  >
                    {t("placementStart", language)}
                    <ArrowRight className="size-4 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* QUIZ STATE */}
          {currentStep === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-emerald-200 shadow-lg">
                <CardHeader className="pb-4">
                  {/* Progress */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-500">
                      {t("placementQuestion", language)} {currentQuestion + 1} {t("placementOf", language)} {questions.length}
                    </span>
                    <Badge
                      variant="outline"
                      className={`${questions[currentQuestion].levelBg} ${questions[currentQuestion].levelColor} font-bold`}
                    >
                      {questions[currentQuestion].level}
                    </Badge>
                  </div>
                  <Progress value={progress} className="h-2" />
                </CardHeader>

                <CardContent className="pb-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestion}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Question */}
                      <h3 className="text-xl font-semibold text-slate-900 mb-6 leading-relaxed">
                        {questions[currentQuestion].question}
                      </h3>

                      {/* Options */}
                      <RadioGroup
                        value={answers[currentQuestion]?.toString() ?? ""}
                        onValueChange={handleAnswer}
                        className="gap-3"
                      >
                        {questions[currentQuestion].options.map((option, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Label
                              htmlFor={`option-${idx}`}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                answers[currentQuestion] === idx
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                  : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700"
                              }`}
                            >
                              <RadioGroupItem
                                value={idx.toString()}
                                id={`option-${idx}`}
                                className={
                                  answers[currentQuestion] === idx
                                    ? "text-emerald-600 border-emerald-500"
                                    : ""
                                }
                              />
                              <span className="text-base font-medium">{option}</span>
                            </Label>
                          </motion.div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentQuestion === 0}
                      className="gap-1.5"
                    >
                      <ArrowLeft className="size-4" />
                      {t("placementPrev", language)}
                    </Button>

                    {currentQuestion < questions.length - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={answers[currentQuestion] === null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                      >
                        {t("placementNext", language)}
                        <ArrowRight className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={answers[currentQuestion] === null}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                      >
                        {t("placementSubmit", language)}
                        <Trophy className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* RESULT STATE */}
          {currentStep === "result" && resultLevel && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <Card className={`border-2 ${resultColors[resultLevel].border} shadow-xl overflow-hidden`}>
                <div className={`${resultColors[resultLevel].bg} px-6 py-10 text-center`}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
                    className="text-6xl mb-4"
                  >
                    {resultEmoji[resultLevel]}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm font-medium text-slate-500 mb-2"
                  >
                    {t("placementResultLevel", language)}
                  </motion.p>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`text-3xl font-bold ${resultColors[resultLevel].text}`}
                  >
                    {t(levelResultKey, language)}
                  </motion.h3>
                </div>

                <CardContent className="p-6 text-center">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-600 leading-relaxed mb-8 max-w-md mx-auto"
                  >
                    {t(levelDescKey, language)}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                      onClick={() => window.open("https://wa.me/4367763401913", "_blank")}
                    >
                      <MessageCircle className="size-4" />
                      {t("placementBookLesson", language)}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-1.5"
                      onClick={handleRetake}
                    >
                      <RotateCcw className="size-4" />
                      {t("placementRetake", language)}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
