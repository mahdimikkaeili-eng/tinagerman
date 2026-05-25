"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleHeart, Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

interface Testimonial {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    germanLevel: string | null;
  };
}

export function TestimonialsSection() {
  const { language, isAuthenticated, user, setShowAuthModal, setAuthMode } = useAppStore();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Submit form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load approved testimonials
  useEffect(() => {
    fetch("/api/testimonials?approvedOnly=true")
      .then((res) => res.json())
      .then((data) => {
        setTestimonials(data.testimonials || []);
        setLoading(false);
      })
      .catch(() => {
        setTestimonials([]);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim() || comment.trim().length < 10) {
      setSubmitError(language === "en" ? "Please write at least 10 characters" : "Bitte schreiben Sie mindestens 10 Zeichen");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Failed to submit");
        return;
      }

      setSubmitted(true);
      setComment("");
      setRating(5);
    } catch {
      setSubmitError(language === "en" ? "Network error" : "Netzwerkfehler");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenForm = () => {
    if (!isAuthenticated) {
      setAuthMode("signup");
      setShowAuthModal(true);
      return;
    }
    setShowForm(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      language === "de" ? "de-DE" : "en-US",
      { year: "numeric", month: "short" }
    );
  };

  return (
    <section id="testimonials" className="py-20 md:py-28 bg-slate-50/50">
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
            {language === "en"
              ? "What our students say about learning with Tina"
              : "Was unsere Schüler über den Unterricht mit Tina sagen"}
          </p>
        </motion.div>

        {/* Testimonials grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-emerald-600" />
          </div>
        ) : testimonials.length === 0 ? (
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
                  {language === "en"
                    ? "Be the first to share your experience learning German with Tina!"
                    : "Seien Sie der Erste, der seine Erfahrung mit dem Deutschlernen bei Tina teilt!"}
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleOpenForm}
                >
                  <Star className="size-4 mr-1" />
                  {language === "en" ? "Write a Review" : "Bewertung schreiben"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="h-full border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                    <CardContent className="pt-6">
                      {/* Stars */}
                      <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`size-4 ${
                              star <= testimonial.rating
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Comment */}
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-4">
                        &ldquo;{testimonial.comment}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        <Avatar className="size-8 bg-emerald-100">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {testimonial.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {testimonial.user.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {testimonial.user.germanLevel && `${testimonial.user.germanLevel} · `}
                            {formatDate(testimonial.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Write review button */}
            <div className="text-center">
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                onClick={handleOpenForm}
              >
                <Star className="size-4 mr-1" />
                {language === "en" ? "Write a Review" : "Bewertung schreiben"}
              </Button>
            </div>
          </>
        )}

        {/* Review form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                {submitted ? (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <CheckCircle2 className="size-12 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      {language === "en" ? "Thank You!" : "Danke!"}
                    </h3>
                    <p className="text-sm text-slate-500 text-center">
                      {language === "en"
                        ? "Your review has been submitted and will appear after Tina approves it."
                        : "Ihre Bewertung wurde eingereicht und erscheint nach Tinas Freigabe."}
                    </p>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setShowForm(false);
                        setSubmitted(false);
                      }}
                    >
                      {t("close", language)}
                    </Button>
                  </div>
                ) : (
                  <>
                    <CardHeader className="p-0 mb-4">
                      <CardTitle className="text-xl">
                        {language === "en" ? "Share Your Experience" : "Teilen Sie Ihre Erfahrung"}
                      </CardTitle>
                    </CardHeader>

                    {/* Star rating */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === "en" ? "Rating" : "Bewertung"}
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`size-7 ${
                                star <= rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-200 hover:text-amber-200"
                              } transition-colors`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === "en" ? "Your Review" : "Ihre Bewertung"}
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={
                          language === "en"
                            ? "What was your experience learning German with Tina?"
                            : "Wie war Ihre Erfahrung beim Deutschlernen mit Tina?"
                        }
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {submitError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
                        {submitError}
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowForm(false)}
                      >
                        {t("cancel", language)}
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleSubmit}
                        disabled={submitting || comment.trim().length < 10}
                      >
                        {submitting ? (
                          <Loader2 className="size-4 animate-spin mr-1" />
                        ) : (
                          <Send className="size-4 mr-1" />
                        )}
                        {language === "en" ? "Submit Review" : "Bewertung senden"}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
