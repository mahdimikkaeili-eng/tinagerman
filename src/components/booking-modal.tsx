"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, BookOpen, Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";
import { convertViennaTimeToLocal, getUserTimezone } from "@/lib/timezone";

interface Course {
  id: string;
  title: string;
  titleDe: string;
  level: string;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTrial?: boolean;
  timezone?: string;
}

// Vienna time slots (teacher's availability)
const viennaTimeSlots = [
  "09:00",
  "09:50",
  "10:40",
  "11:30",
  "13:00",
  "13:50",
  "14:40",
  "15:30",
  "16:20",
  "17:10",
];

export function BookingModal({ open, onOpenChange, isTrial = false, timezone }: BookingModalProps) {
  const { language, user } = useAppStore();

  // Detect user's timezone
  const userTimezone = useMemo(() => timezone || getUserTimezone(), [timezone]);
  const isViennaTime = userTimezone === "Europe/Vienna";

  // Convert Vienna time slots to user's local timezone for display
  const displayTimeSlots = useMemo(() => {
    return viennaTimeSlots.map((viennaTime) => {
      const localTime = convertViennaTimeToLocal(viennaTime, userTimezone);
      return { viennaTime, localTime };
    });
  }, [userTimezone]);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(""); // Always stores Vienna time
  const [isTrialBooking, setIsTrialBooking] = useState(isTrial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Load courses
  useEffect(() => {
    if (open) {
      setCoursesLoading(true);
      fetch(`/api/courses?lang=${language}`)
        .then((res) => res.json())
        .then((data) => {
          setCourses(data.courses || data || []);
          setCoursesLoading(false);
        })
        .catch(() => {
          setCourses([]);
          setCoursesLoading(false);
        });
    }
  }, [open, language]);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setSelectedCourse("");
      setSelectedDate("");
      setSelectedTime("");
      setIsTrialBooking(isTrial);
      setSuccess(false);
      setError("");
    }
  }, [open, isTrial]);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCourse || !selectedDate || !selectedTime) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          courseId: selectedCourse,
          date: selectedDate,
          time: selectedTime, // Vienna time
          isTrial: isTrialBooking,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Booking failed");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format timezone label for display
  const timezoneLabel = useMemo(() => {
    if (isViennaTime) {
      return language === "de" ? "Wiener Zeit" : "Vienna Time";
    }
    try {
      const now = new Date();
      const formatted = now.toLocaleTimeString(language === "de" ? "de-DE" : "en-US", {
        timeZone: userTimezone,
        timeZoneName: "short",
      });
      const tzName = formatted.split(" ").pop() || userTimezone;
      return `${tzName} (${userTimezone.split("/").pop()?.replace(/_/g, " ")})`;
    } catch {
      return userTimezone;
    }
  }, [userTimezone, isViennaTime, language]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {t("bookingConfirmed", language)}
            </h3>
            <p className="text-sm text-slate-500 text-center">
              {t("bookingSuccess", language)}
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t("close", language)}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">
                {isTrialBooking ? t("bookTrial", language) : t("bookLesson", language)}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm">
                {isTrialBooking
                  ? language === "en"
                    ? "Book your free 50-minute trial lesson with Tina."
                    : "Buchen Sie Ihre kostenlose 50-minütige Probestunde mit Tina."
                  : language === "en"
                    ? "Choose a course and schedule your next lesson."
                    : "Wählen Sie einen Kurs und planen Sie Ihre nächste Unterrichtsstunde."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Course selector */}
              <div className="space-y-2">
                <Label>{t("selectCourse", language)}</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                  disabled={coursesLoading || loading}
                >
                  <SelectTrigger className="w-full">
                    <BookOpen className="size-4 mr-1 text-slate-400" />
                    <SelectValue
                      placeholder={
                        coursesLoading
                          ? t("loading", language)
                          : t("selectCourse", language)
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {language === "de" ? course.titleDe : course.title} (
                        {course.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date picker */}
              <div className="space-y-2">
                <Label htmlFor="booking-date">{t("selectDate", language)}</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="booking-date"
                    type="date"
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Time slot selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("selectTime", language)}</Label>
                  <span className="text-[11px] text-slate-400">
                    {language === "en" ? "Times shown in" : "Zeiten angezeigt in"} {timezoneLabel}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {displayTimeSlots.map(({ viennaTime, localTime }) => (
                    <button
                      key={viennaTime}
                      type="button"
                      disabled={loading}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-sm transition-all ${
                        selectedTime === viennaTime
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                          : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                      onClick={() => setSelectedTime(viennaTime)}
                      title={isViennaTime ? undefined : `${language === "en" ? "Vienna time" : "Wiener Zeit"}: ${viennaTime}`}
                    >
                      <Clock className="size-3" />
                      {localTime}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trial lesson checkbox */}
              {user && !user.isTrialUsed && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trial-check"
                    checked={isTrialBooking}
                    onCheckedChange={(checked) =>
                      setIsTrialBooking(checked as boolean)
                    }
                    disabled={loading}
                  />
                  <Label
                    htmlFor="trial-check"
                    className="text-sm cursor-pointer"
                  >
                    {t("trialAvailable", language)}
                  </Label>
                </div>
              )}

              {user?.isTrialUsed && isTrialBooking && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                  {t("trialUsed", language)}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  loading ||
                  !selectedCourse ||
                  !selectedDate ||
                  !selectedTime ||
                  (user?.isTrialUsed && isTrialBooking)
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t("loading", language)}
                  </>
                ) : (
                  t("confirmBooking", language)
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
