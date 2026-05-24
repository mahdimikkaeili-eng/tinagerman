"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, MessageSquare, PenTool, Volume2, ChevronRight, ChevronLeft, Lightbulb, Languages, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

// ─── Data: Common German Phrases ───────────────────────────────────
const phrases = {
  en: [
    { german: "Guten Morgen!", english: "Good morning!", level: "A1" },
    { german: "Wie geht es Ihnen?", english: "How are you? (formal)", level: "A1" },
    { german: "Ich möchte bitte einen Kaffee.", english: "I would like a coffee, please.", level: "A1" },
    { german: "Können Sie das bitte wiederholen?", english: "Could you please repeat that?", level: "A2" },
    { german: "Ich verstehe nicht ganz.", english: "I don't quite understand.", level: "A2" },
    { german: "Wie spät ist es?", english: "What time is it?", level: "A1" },
    { german: "Kann ich mit Karte zahlen?", english: "Can I pay by card?", level: "A2" },
    { german: "Ich habe eine Reservierung.", english: "I have a reservation.", level: "A2" },
    { german: "Könnten Sie mir helfen?", english: "Could you help me?", level: "B1" },
    { german: "Das macht nichts.", english: "That doesn't matter / No problem.", level: "B1" },
    { german: "Ich stimme Ihnen zu.", english: "I agree with you.", level: "B1" },
    { german: "Im Vergleich zu letztem Jahr...", english: "Compared to last year...", level: "B2" },
    { german: "Es kommt darauf an.", english: "It depends.", level: "B2" },
    { german: "Meiner Meinung nach...", english: "In my opinion...", level: "B2" },
    { german: "Ich wäre Ihnen dankbar, wenn...", english: "I would be grateful if...", level: "B2" },
  ],
  de: [
    { german: "Guten Morgen!", english: "Guten Morgen!", level: "A1" },
    { german: "Wie geht es Ihnen?", english: "Wie geht es Ihnen? (formell)", level: "A1" },
    { german: "Ich möchte bitte einen Kaffee.", english: "Ich möchte bitte einen Kaffee.", level: "A1" },
    { german: "Können Sie das bitte wiederholen?", english: "Können Sie das bitte wiederholen?", level: "A2" },
    { german: "Ich verstehe nicht ganz.", english: "Ich verstehe nicht ganz.", level: "A2" },
    { german: "Wie spät ist es?", english: "Wie spät ist es?", level: "A1" },
    { german: "Kann ich mit Karte zahlen?", english: "Kann ich mit Karte zahlen?", level: "A2" },
    { german: "Ich habe eine Reservierung.", english: "Ich habe eine Reservierung.", level: "A2" },
    { german: "Könnten Sie mir helfen?", english: "Könnten Sie mir helfen?", level: "B1" },
    { german: "Das macht nichts.", english: "Das macht nichts.", level: "B1" },
    { german: "Ich stimme Ihnen zu.", english: "Ich stimme Ihnen zu.", level: "B1" },
    { german: "Im Vergleich zu letztem Jahr...", english: "Im Vergleich zu letztem Jahr...", level: "B2" },
    { german: "Es kommt darauf an.", english: "Es kommt darauf an.", level: "B2" },
    { german: "Meiner Meinung nach...", english: "Meiner Meinung nach...", level: "B2" },
    { german: "Ich wäre Ihnen dankbar, wenn...", english: "Ich wäre Ihnen dankbar, wenn...", level: "B2" },
  ],
};

// ─── Data: Grammar Tips ────────────────────────────────────────────
const grammarTips = {
  en: [
    {
      title: "Der, Die, Das — German Articles",
      content: "Every German noun has a gender: masculine (der), feminine (die), or neuter (das). There's no shortcut — learn the article with every noun! Tip: 68% of nouns ending in -e are feminine (die).",
      example: 'der Tisch (table), die Lampe (lamp), das Buch (book)',
      level: "A1",
    },
    {
      title: "Verb Position — The V2 Rule",
      content: "In main clauses, the conjugated verb is always in second position. Even if you start with something other than the subject, the verb stays second!",
      example: "Heute gehe ich ins Kino. (Today I go to the cinema.)",
      level: "A1",
    },
    {
      title: "Separable Verbs (Trennbare Verben)",
      content: 'Some German verbs have a prefix that separates and goes to the end of the sentence. The prefix changes the verb\'s meaning completely.',
      example: "an·rufen → Ich rufe dich an. (I\'ll call you.)",
      level: "A2",
    },
    {
      title: "Weil & Dass — Subordinating Conjunctions",
      content: 'Subordinating conjunctions (weil, dass, wenn, ob) push the conjugated verb to the end of the clause. This is one of the most common mistakes learners make!',
      example: "Ich lerne Deutsch, weil ich in Deutschland leben will. (verb 'will' goes to the end)",
      level: "B1",
    },
    {
      title: "Konjunktiv II — The Subjunctive",
      content: "Use Konjunktiv II for polite requests, hypothetical situations, and wishes. The most common forms: würde + infinitive, and special forms of möchten, könnten, sollten.",
      example: "Ich hätte gerne ein Wasser. (I would like a water.) — Könnten Sie mir helfen? (Could you help me?)",
      level: "B1",
    },
    {
      title: "Passiv — The Passive Voice",
      content: "German has two passive forms: Vorgangspassiv (werden + Partizip II) for actions, and Zustandspassiv (sein + Partizip II) for states.",
      example: "Das Haus wird gebaut. (The house is being built.) — Das Haus ist gebaut. (The house is built.)",
      level: "B2",
    },
  ],
  de: [
    {
      title: "Der, Die, Das — Artikel im Deutschen",
      content: "Jedes deutsche Substantiv hat ein Genus: männlich (der), weiblich (die) oder sächlich (das). Es gibt keine Abkürzung — lernen Sie den Artikel mit jedem Substantiv! Tipp: 68% der Substantive auf -e sind weiblich (die).",
      example: "der Tisch, die Lampe, das Buch",
      level: "A1",
    },
    {
      title: "Verbposition — Die V2-Regel",
      content: "In Hauptsätzen steht das konjugierte Verb immer an zweiter Stelle. Auch wenn Sie mit etwas anderem als dem Subjekt beginnen, bleibt das Verb an zweiter Stelle!",
      example: "Heute gehe ich ins Kino.",
      level: "A1",
    },
    {
      title: "Trennbare Verben",
      content: "Einige deutsche Verben haben einen Präfix, der sich trennt und ans Ende des Satzes geht. Der Präfix verändert die Bedeutung des Verbs vollständig.",
      example: "an·rufen → Ich rufe dich an.",
      level: "A2",
    },
    {
      title: "Weil & Dass — Nebensatzkonjunktionen",
      content: "Nebensatzkonjunktionen (weil, dass, wenn, ob) schieben das konjugierte Verb ans Ende des Nebensatzes. Das ist einer der häufigsten Fehler von Deutschlernern!",
      example: "Ich lerne Deutsch, weil ich in Deutschland leben will.",
      level: "B1",
    },
    {
      title: "Konjunktiv II",
      content: "Verwenden Sie den Konjunktiv II für höfliche Bitten, hypothetische Situationen und Wünsche. Die häufigsten Formen: würde + Infinitiv und Sonderformen von möchten, könnten, sollten.",
      example: "Ich hätte gerne ein Wasser. — Könnten Sie mir helfen?",
      level: "B1",
    },
    {
      title: "Passiv — Die Leideform",
      content: "Deutsch hat zwei Passivformen: Vorgangspassiv (werden + Partizip II) für Handlungen und Zustandspassiv (sein + Partizip II) für Zustände.",
      example: "Das Haus wird gebaut. — Das Haus ist gebaut.",
      level: "B2",
    },
  ],
};

// ─── Data: Vocabulary by Category ──────────────────────────────────
const vocabulary = {
  en: [
    {
      category: "Food & Drink 🍽️",
      words: [
        { german: "das Brötchen", english: "bread roll" },
        { german: "der Kaffee", english: "coffee" },
        { german: "die Suppe", english: "soup" },
        { german: "das Mineralwasser", english: "mineral water" },
        { german: "der Apfelkuchen", english: "apple cake" },
        { german: "die Wurst", english: "sausage" },
      ],
    },
    {
      category: "Travel ✈️",
      words: [
        { german: "der Bahnhof", english: "train station" },
        { german: "die Fahrkarte", english: "ticket" },
        { german: "der Flug", english: "flight" },
        { german: "die Unterkunft", english: "accommodation" },
        { german: "die Abfahrt", english: "departure" },
        { german: "der Anschluss", english: "connection" },
      ],
    },
    {
      category: "Work & Office 💼",
      words: [
        { german: "die Besprechung", english: "meeting" },
        { german: "der Kollege", english: "colleague" },
        { german: "die Gehaltserhöhung", english: "salary increase" },
        { german: "der Feierabend", english: "end of workday" },
        { german: "die Bewerbung", english: "job application" },
        { german: "die Überstunde", english: "overtime" },
      ],
    },
    {
      category: "Daily Life 🏠",
      words: [
        { german: "der Müll", english: "garbage" },
        { german: "die Miete", english: "rent" },
        { german: "der Termin", english: "appointment" },
        { german: "die Apotheke", english: "pharmacy" },
        { german: "die Heizung", english: "heating" },
        { german: "der Nachbar", english: "neighbor" },
      ],
    },
  ],
  de: [
    {
      category: "Essen & Trinken 🍽️",
      words: [
        { german: "das Brötchen", english: "das Brötchen" },
        { german: "der Kaffee", english: "der Kaffee" },
        { german: "die Suppe", english: "die Suppe" },
        { german: "das Mineralwasser", english: "das Mineralwasser" },
        { german: "der Apfelkuchen", english: "der Apfelkuchen" },
        { german: "die Wurst", english: "die Wurst" },
      ],
    },
    {
      category: "Reisen ✈️",
      words: [
        { german: "der Bahnhof", english: "der Bahnhof" },
        { german: "die Fahrkarte", english: "die Fahrkarte" },
        { german: "der Flug", english: "der Flug" },
        { german: "die Unterkunft", english: "die Unterkunft" },
        { german: "die Abfahrt", english: "die Abfahrt" },
        { german: "der Anschluss", english: "der Anschluss" },
      ],
    },
    {
      category: "Arbeit & Büro 💼",
      words: [
        { german: "die Besprechung", english: "die Besprechung" },
        { german: "der Kollege", english: "der Kollege" },
        { german: "die Gehaltserhöhung", english: "die Gehaltserhöhung" },
        { german: "der Feierabend", english: "der Feierabend" },
        { german: "die Bewerbung", english: "die Bewerbung" },
        { german: "die Überstunde", english: "die Überstunde" },
      ],
    },
    {
      category: "Alltag 🏠",
      words: [
        { german: "der Müll", english: "der Müll" },
        { german: "die Miete", english: "die Miete" },
        { german: "der Termin", english: "der Termin" },
        { german: "die Apotheke", english: "die Apotheke" },
        { german: "die Heizung", english: "die Heizung" },
        { german: "der Nachbar", english: "der Nachbar" },
      ],
    },
  ],
};

const levelColors: Record<string, { text: string; bg: string; border: string }> = {
  A1: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  A2: { text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" },
  B1: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  B2: { text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
};

export function LearningResourcesSection() {
  const { language } = useAppStore();
  const [phrasePage, setPhrasePage] = useState(0);
  const phrasesPerPage = 5;
  const totalPages = Math.ceil(phrases[language].length / phrasesPerPage);

  const currentPhrases = phrases[language].slice(
    phrasePage * phrasesPerPage,
    (phrasePage + 1) * phrasesPerPage
  );

  const currentGrammar = grammarTips[language];
  const currentVocab = vocabulary[language];

  return (
    <section id="resources" className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
              <BookOpen className="size-6 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t("resourcesTitle", language)}
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("resourcesSubtitle", language)}
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="phrases" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1">
            <TabsTrigger value="phrases" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">{t("resourcesPhrases", language)}</span>
              <span className="sm:hidden">{t("resourcesPhrasesShort", language)}</span>
            </TabsTrigger>
            <TabsTrigger value="grammar" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <PenTool className="size-4" />
              <span className="hidden sm:inline">{t("resourcesGrammar", language)}</span>
              <span className="sm:hidden">{t("resourcesGrammarShort", language)}</span>
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              <Languages className="size-4" />
              <span className="hidden sm:inline">{t("resourcesVocab", language)}</span>
              <span className="sm:hidden">{t("resourcesVocabShort", language)}</span>
            </TabsTrigger>
          </TabsList>

          {/* ─── Phrases Tab ─────────────────────────────────────── */}
          <TabsContent value="phrases">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-emerald-200 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageSquare className="size-5 text-emerald-600" />
                      {t("resourcesPhrasesTitle", language)}
                    </CardTitle>
                    <span className="text-sm text-slate-400">
                      {phrasePage + 1}/{totalPages}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={phrasePage}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {currentPhrases.map((phrase, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                        >
                          <Badge
                            variant="outline"
                            className={`${levelColors[phrase.level].bg} ${levelColors[phrase.level].text} ${levelColors[phrase.level].border} font-bold shrink-0`}
                          >
                            {phrase.level}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-base">
                              {phrase.german}
                            </p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {phrase.english}
                            </p>
                          </div>
                          <Volume2 className="size-4 text-slate-300 shrink-0" />
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhrasePage((p) => Math.max(0, p - 1))}
                      disabled={phrasePage === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="size-4" />
                      {t("placementPrev", language)}
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhrasePage(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            i === phrasePage ? "bg-emerald-500 scale-110" : "bg-slate-200"
                          }`}
                          aria-label={`Page ${i + 1}`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPhrasePage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={phrasePage === totalPages - 1}
                      className="gap-1"
                    >
                      {t("placementNext", language)}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ─── Grammar Tab ─────────────────────────────────────── */}
          <TabsContent value="grammar">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {currentGrammar.map((tip, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-slate-200 hover:border-emerald-200 transition-colors shadow-sm hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-8 h-8 rounded-lg ${levelColors[tip.level].bg} flex items-center justify-center`}>
                            <Lightbulb className={`size-4 ${levelColors[tip.level].text}`} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-base">{tip.title}</h3>
                            <Badge
                              variant="outline"
                              className={`${levelColors[tip.level].bg} ${levelColors[tip.level].text} ${levelColors[tip.level].border} font-bold text-xs`}
                            >
                              {tip.level}
                            </Badge>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed mb-2">
                            {tip.content}
                          </p>
                          <div className="bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-100">
                            <p className="text-sm font-medium text-emerald-700">
                              💡 {tip.example}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* ─── Vocabulary Tab ───────────────────────────────────── */}
          <TabsContent value="vocabulary">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {currentVocab.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Card className="border-slate-200 hover:border-emerald-200 transition-colors shadow-sm hover:shadow-md h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="size-4 text-emerald-600" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {category.words.map((word, wIdx) => (
                        <div
                          key={wIdx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/50 transition-colors"
                        >
                          <span className="font-medium text-slate-900 text-sm">
                            {word.german}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {word.english}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mt-12"
        >
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-6 md:p-8">
              <GraduationCap className="size-10 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t("resourcesCtaTitle", language)}
              </h3>
              <p className="text-slate-600 mb-4 max-w-md mx-auto">
                {t("resourcesCtaDesc", language)}
              </p>
              <Button
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                onClick={() => {
                  const el = document.querySelector("#placement-test");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t("resourcesCtaButton", language)}
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
