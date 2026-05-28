"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  MessageCircle,
  Clock,
  LogOut,
  Globe,
  Video,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Star,
  Trash2,
  BookOpen,
  Plus,
  Menu,
  Home,
  GraduationCap,
  DollarSign,
  ClipboardList,
  Info,
  Mail,
  Edit3,
  Paperclip,
  Download,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";
import { NotificationBell } from "./notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface TeacherBooking {
  id: string;
  date: string;
  time: string;
  status: string;
  isTrial: boolean;
  meetLink: string | null;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    nativeLanguage: string | null;
    germanLevel: string | null;
    avatar: string | null;
  };
  course: {
    id: string;
    title: string;
    titleDe: string;
    level: string;
  };
}

interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string | null;
  germanLevel: string | null;
  avatar: string | null;
  phone: string | null;
  isTrialUsed: boolean;
  createdAt: string;
  bookingCount: number;
}

interface TeacherStats {
  totalStudents: number;
  upcomingLessons: number;
  pendingBookings: number;
  completedLessons: number;
  totalBookings: number;
  confirmedBookings: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

const nativeLanguages: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  fa: "Farsi",
  ar: "Arabic",
  tr: "Türkçe",
  ru: "Russian",
  es: "Español",
  fr: "Français",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  pt: "Português",
  it: "Italiano",
  uk: "Ukrainian",
  other: "Other",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

// Google Calendar URL generator
function generateGoogleCalendarUrl(booking: TeacherBooking, timezone?: string) {
  const startDate = new Date(`${booking.date}T${booking.time}:00`);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = encodeURIComponent(`${booking.course.level} German Lesson - Deutsch mit Tina`);
  const details = encodeURIComponent(
    `German lesson with ${booking.user.name}\nLevel: ${booking.course.level}${booking.isTrial ? "\n(Free Trial)" : ""}`
  );
  const location = encodeURIComponent(booking.meetLink || "");
  const ctz = timezone || "Europe/Vienna";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}&ctz=${encodeURIComponent(ctz)}`;
}

export function TeacherDashboard() {
  const { language, setLanguage, user, logout } = useAppStore();

  const [activeTab, setActiveTab] = useState("overview");
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Stats
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Bookings
  const [bookings, setBookings] = useState<TeacherBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState("all");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  // Students
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Chat
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<ReturnType<typeof import("socket.io-client").io> | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Schedule
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // Testimonials/Reviews
  const [reviews, setReviews] = useState<Array<{
    id: string;
    rating: number;
    comment: string;
    isApproved: boolean;
    createdAt: string;
    user: { id: string; name: string; germanLevel: string | null };
  }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);

  // Homework
  interface TeacherHomework {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
    status: string;
    feedback: string | null;
    attachment: string | null;
    studentAttachment: string | null;
    createdAt: string;
    student: { id: string; name: string; avatar: string | null };
    teacher: { id: string; name: string; avatar: string | null };
  }
  const [teacherHomework, setTeacherHomework] = useState<TeacherHomework[]>([]);
  const [homeworkLoading, setHomeworkLoading] = useState(true);
  const [showNewHomeworkForm, setShowNewHomeworkForm] = useState(false);
  const [newHomework, setNewHomework] = useState({ studentId: "", title: "", description: "", dueDate: "", attachment: "" });
  const [homeworkUploading, setHomeworkUploading] = useState(false);
  const [homeworkFilter, setHomeworkFilter] = useState("all");
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({});
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [assigningHomework, setAssigningHomework] = useState(false);

  // Load reviews
  useEffect(() => {
    if (activeTab !== "reviews") return;
    setReviewsLoading(true);
    fetch("/api/testimonials?approvedOnly=false", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.testimonials || []);
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviews([]);
        setReviewsLoading(false);
      });
  }, [activeTab]);

  // Load homework
  useEffect(() => {
    if (activeTab !== "homework" || !user) return;
    setHomeworkLoading(true);
    fetch(`/api/homework?teacherId=${user.id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch homework");
        return res.json();
      })
      .then((data) => {
        setTeacherHomework(data.homeworks || []);
        setHomeworkLoading(false);
      })
      .catch(() => {
        setTeacherHomework([]);
        setHomeworkLoading(false);
      });
  }, [activeTab, user]);

  // Also load students when homework tab is active (for the assign form)
  useEffect(() => {
    if (activeTab !== "homework") return;
    if (students.length > 0) return;
    fetch("/api/teacher/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
      })
      .catch(() => {
        // silently fail
      });
  }, [activeTab, students.length]);

  const handleApproveReview = async (id: string, isApproved: boolean) => {
    setReviewActionId(id);
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isApproved }),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isApproved } : r))
      );
    } catch {
      // silently fail
    } finally {
      setReviewActionId(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setReviewActionId(id);
    try {
      await fetch(`/api/testimonials/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // silently fail
    } finally {
      setReviewActionId(null);
    }
  };

  // Load stats and bookings
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "bookings" || activeTab === "schedule") {
      setStatsLoading(true);
      setBookingsLoading(true);
      fetch("/api/teacher/bookings")
        .then((res) => res.json())
        .then((data) => {
          setStats(data.stats);
          setBookings(data.bookings || []);
          setStatsLoading(false);
          setBookingsLoading(false);
        })
        .catch(() => {
          setStatsLoading(false);
          setBookingsLoading(false);
        });
    }
  }, [activeTab]);

  // Load students
  useEffect(() => {
    if (activeTab !== "students") return;
    setStudentsLoading(true);
    fetch("/api/teacher/students")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setStudentsLoading(false);
      })
      .catch(() => {
        setStudentsLoading(false);
      });
  }, [activeTab]);

  // Load chat messages when a student is selected
  useEffect(() => {
    if (!user || !selectedStudentId || activeTab !== "chat") return;
    setChatLoading(true);
    fetch(`/api/messages?otherUserId=${selectedStudentId}`)
      .then((res) => res.json())
      .then((data) => {
        setChatMessages(data.messages || []);
        setChatLoading(false);
      })
      .catch(() => {
        setChatMessages([]);
        setChatLoading(false);
      });
  }, [user, selectedStudentId, activeTab]);

  // Socket.io for chat
  useEffect(() => {
    if (!user || !selectedStudentId || activeTab !== "chat") return;

    let socketInstance: ReturnType<typeof import("socket.io-client").io> | null = null;

    import("socket.io-client").then(({ io }) => {
      socketInstance = io("/?XTransformPort=3003", {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      socketInstance.on("connect", () => {
        socketInstance!.emit("join", { userId: user.id });
        socketInstance!.emit("joinRoom", { otherUserId: selectedStudentId });
      });

      socketInstance.on("newMessage", (message: ChatMessage) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.senderId === selectedStudentId) {
          socketInstance!.emit("markRead", { otherUserId: selectedStudentId });
        }
      });

      socketInstance.on("userTyping", ({ userId: typingUserId }: { userId: string }) => {
        if (typingUserId === selectedStudentId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      });

      setSocket(socketInstance);
    });

    return () => {
      if (socketInstance) socketInstance.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [user, selectedStudentId, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle booking status update
  const handleUpdateBooking = async (bookingId: string, status: string) => {
    setUpdatingBookingId(bookingId);
    try {
      const res = await fetch(`/api/teacher/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const bookingsRes = await fetch("/api/teacher/bookings");
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
          setStats(data.stats);
        }
      }
    } catch {
      // silently fail
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !socket || !selectedStudentId || !user) return;
    socket.emit("sendMessage", {
      receiverId: selectedStudentId,
      content: chatInput.trim(),
    });
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: selectedStudentId,
        content: chatInput.trim(),
      }),
    }).catch(console.error);
    setChatInput("");
  }, [chatInput, socket, selectedStudentId, user]);

  const handleChatInput = (value: string) => {
    setChatInput(value);
    if (socket && selectedStudentId) {
      socket.emit("typing", { receiverId: selectedStudentId });
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // continue anyway
    }
    logout();
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Update user profile with new avatar
      const updateRes = await fetch("/api/auth/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: user.name,
          phone: user.phone || "",
          nativeLanguage: user.nativeLanguage || "",
          germanLevel: user.germanLevel || "",
          avatar: url,
        }),
      });

      if (updateRes.ok) {
        const updatedUser = { ...user, avatar: url };
        useAppStore.getState().login(updatedUser);
      }
    } catch {
      // silently fail
    } finally {
      setAvatarUploading(false);
    }
  };

  // Homework status colors
  const homeworkStatusColors: Record<string, string> = {
    assigned: "bg-blue-100 text-blue-700 border-blue-200",
    submitted: "bg-amber-100 text-amber-700 border-amber-200",
    reviewed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  // Filter homework
  const filteredHomework =
    homeworkFilter === "all"
      ? teacherHomework
      : teacherHomework.filter((hw) => hw.status === homeworkFilter);

  // Handle assign homework
  const handleAssignHomework = async () => {
    if (!newHomework.studentId || !newHomework.title || !newHomework.description) return;
    setAssigningHomework(true);
    try {
      const res = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: newHomework.studentId,
          title: newHomework.title,
          description: newHomework.description,
          dueDate: newHomework.dueDate || null,
          attachment: newHomework.attachment || null,
        }),
      });
      if (res.ok) {
        setNewHomework({ studentId: "", title: "", description: "", dueDate: "", attachment: "" });
        setShowNewHomeworkForm(false);
        // Reload homework
        if (user) {
          const homeworkRes = await fetch(`/api/homework?teacherId=${user.id}`, { credentials: "include" });
          if (homeworkRes.ok) {
            const data = await homeworkRes.json();
            setTeacherHomework(data.homeworks || []);
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setAssigningHomework(false);
    }
  };

  // Handle homework feedback / mark as reviewed
  const handleHomeworkFeedback = async (homeworkId: string, feedback: string, markReviewed: boolean) => {
    setSubmittingHomeworkId(homeworkId);
    try {
      const body: Record<string, string> = {};
      if (feedback) body.feedback = feedback;
      if (markReviewed) body.status = "reviewed";
      const res = await fetch(`/api/homework/${homeworkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok && user) {
        const homeworkRes = await fetch(`/api/homework?teacherId=${user.id}`, { credentials: "include" });
        if (homeworkRes.ok) {
          const data = await homeworkRes.json();
          setTeacherHomework(data.homeworks || []);
        }
        setFeedbackInput((prev) => {
          const next = { ...prev };
          delete next[homeworkId];
          return next;
        });
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingHomeworkId(null);
    }
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    return `${hours}:${minutes}`;
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "de" ? "de-DE" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter bookings
  const filteredBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  // Schedule helpers
  const getWeekDays = (): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter((b) => b.date === dateStr && b.status !== "cancelled");
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCurrentWeekStart(newStart);
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const sidebarItems = [
    { id: "overview", label: t("teacherOverview", language), icon: BarChart3 },
    { id: "bookings", label: t("teacherBookingsTab", language), icon: Calendar },
    { id: "students", label: t("teacherStudentsTab", language), icon: Users },
    { id: "homework", label: t("teacherHomework", language), icon: BookOpen },
    { id: "chat", label: t("chatWithStudents", language), icon: MessageCircle },
    { id: "reviews", label: language === "en" ? "Reviews" : "Bewertungen", icon: Star },
    { id: "schedule", label: t("teacherScheduleTab", language), icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex flex-col w-1.5 h-6 rounded-full overflow-hidden">
                  <div className="flex-1 bg-slate-900" />
                  <div className="flex-1 bg-red-500" />
                  <div className="flex-1 bg-amber-500" />
                </div>
                <a href="/" className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">Deutsch mit Tina</a>
              </div>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <span className="text-sm font-medium text-emerald-600 hidden sm:block">
                {t("teacherDashboard", language)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {/* Site Navigation Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-emerald-600">
                    <Menu className="size-4 mr-1" />
                    <span className="hidden sm:inline text-xs font-semibold">{language === "en" ? "Menu" : "Menü"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs text-slate-400">{language === "en" ? "Site Navigation" : "Seitennavigation"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/#home" className="flex items-center gap-2 cursor-pointer"><Home className="size-4" />{t("navHome", language)}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#courses" className="flex items-center gap-2 cursor-pointer"><GraduationCap className="size-4" />{t("navCourses", language)}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#pricing" className="flex items-center gap-2 cursor-pointer"><DollarSign className="size-4" />{t("navPricing", language)}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#placement-test" className="flex items-center gap-2 cursor-pointer"><ClipboardList className="size-4" />{t("navPlacement", language)}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#about" className="flex items-center gap-2 cursor-pointer"><Info className="size-4" />{t("navAbout", language)}</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#contact" className="flex items-center gap-2 cursor-pointer"><Mail className="size-4" />{t("navContact", language)}</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "de" : "en")} className="text-slate-600 hover:text-emerald-600">
                <Globe className="size-4 mr-1" />
                <span className="text-xs font-semibold">{language === "en" ? "DE" : "EN"}</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Avatar className="size-8">
                    <img src={user?.avatar || "/tina-avatar.jpg"} alt="Tina" className="w-full h-full object-cover rounded-full" />
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {avatarUploading ? (
                      <Loader2 className="size-3 text-white animate-spin" />
                    ) : (
                      <Edit3 className="size-3 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                  </label>
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user?.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-600">
                <LogOut className="size-4 mr-1" />
                <span className="hidden sm:inline">{t("logout", language)}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-3">
                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Avatar className="size-10">
                    <img src={user?.avatar || "/tina-avatar.jpg"} alt="Tina" className="w-full h-full object-cover rounded-full" />
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Tina</p>
                    <p className="text-xs text-emerald-600">{language === "en" ? "Teacher" : "Lehrerin"}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="lg:hidden mb-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full grid grid-cols-7">
                  {sidebarItems.map((item) => (
                    <TabsTrigger key={item.id} value={item.id} className="text-xs px-1">
                      <item.icon className="size-4" />
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {t("welcome", language)}, Tina! 👋
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {language === "en" ? "Here's an overview of your teaching activity" : "Hier ist eine Übersicht Ihrer Lehraktivitäten"}
                  </p>
                </div>

                {statsLoading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i}><CardContent className="p-6"><div className="flex items-center justify-center h-16"><Loader2 className="size-6 animate-spin text-emerald-600" /></div></CardContent></Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-emerald-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{t("totalStudents", language)}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.totalStudents || 0}</p>
                          </div>
                          <div className="size-12 rounded-xl bg-emerald-100 flex items-center justify-center"><Users className="size-6 text-emerald-600" /></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-amber-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{t("upcomingLessons", language)}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.upcomingLessons || 0}</p>
                          </div>
                          <div className="size-12 rounded-xl bg-amber-100 flex items-center justify-center"><Calendar className="size-6 text-amber-600" /></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{t("pendingBookingsCount", language)}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.pendingBookings || 0}</p>
                          </div>
                          <div className="size-12 rounded-xl bg-orange-100 flex items-center justify-center"><Clock className="size-6 text-orange-600" /></div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-slate-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">{t("completedLessons", language)}</p>
                            <p className="text-3xl font-bold text-slate-900 mt-1">{stats?.completedLessons || 0}</p>
                          </div>
                          <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center"><CheckCircle2 className="size-6 text-slate-600" /></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recent bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{language === "en" ? "Recent Bookings" : "Neueste Buchungen"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-emerald-600" /></div>
                    ) : bookings.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">{t("noBookingsFound", language)}</p>
                    ) : (
                      <div className="space-y-3">
                        {bookings.slice(0, 5).map((booking) => (
                          <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex flex-col items-center bg-emerald-50 rounded-lg px-3 py-2 min-w-[70px]">
                                <span className="text-xs text-emerald-600 font-medium">
                                  {new Date(booking.date).toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short" })}
                                </span>
                                <span className="text-lg font-bold text-emerald-700">{new Date(booking.date).getDate()}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{booking.user.name}</p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <span>{booking.course.level}</span>
                                  <span>•</span>
                                  <Clock className="size-3" />
                                  <span>{formatTime(booking.time)}</span>
                                  {booking.isTrial && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">Trial</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline" className={statusColors[booking.status] || "bg-slate-100 text-slate-600"}>
                              {t(booking.status as "pending" | "confirmed" | "completed" | "cancelled", language)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{t("teacherBookingsTab", language)}</h2>
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t("allStatuses", language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allStatuses", language)}</SelectItem>
                      <SelectItem value="pending">{t("pending", language)}</SelectItem>
                      <SelectItem value="confirmed">{t("confirmed", language)}</SelectItem>
                      <SelectItem value="completed">{t("completed", language)}</SelectItem>
                      <SelectItem value="cancelled">{t("cancelled", language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bookingsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-emerald-600" /></div>
                ) : filteredBookings.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-slate-400">{t("noBookingsFound", language)}</p></CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {filteredBookings.map((booking) => (
                      <Card key={booking.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              <Avatar className="size-10 bg-emerald-100">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                                  {booking.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900">{booking.user.name}</p>
                                <p className="text-xs text-slate-500">{booking.user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <Badge variant="outline">{booking.course.level}</Badge>
                              <span className="text-slate-600">{formatDate(booking.date)}</span>
                              <span className="text-slate-600">{formatTime(booking.time)}</span>
                              {booking.isTrial && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Trial</Badge>
                              )}
                              <Badge variant="outline" className={statusColors[booking.status] || "bg-slate-100 text-slate-600"}>
                                {t(booking.status as "pending" | "confirmed" | "completed" | "cancelled", language)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {booking.meetLink && (
                                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open(booking.meetLink!, "_blank")}>
                                  <Video className="size-3 mr-1" />
                                  Meet
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => window.open(generateGoogleCalendarUrl(booking, "Europe/Vienna"), "_blank")}>
                                <CalendarPlus className="size-3 mr-1" />
                                {t("addToCalendar", language)}
                              </Button>
                              {booking.status === "pending" && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateBooking(booking.id, "confirmed")} disabled={updatingBookingId === booking.id}>
                                  {updatingBookingId === booking.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3 mr-1" />}
                                  {t("confirmBookingAction", language)}
                                </Button>
                              )}
                              {(booking.status === "pending" || booking.status === "confirmed") && (
                                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleUpdateBooking(booking.id, "cancelled")} disabled={updatingBookingId === booking.id}>
                                  {updatingBookingId === booking.id ? <Loader2 className="size-3 animate-spin" /> : <XCircle className="size-3 mr-1" />}
                                  {t("cancelBookingAction", language)}
                                </Button>
                              )}
                              {booking.status === "confirmed" && (
                                <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" onClick={() => handleUpdateBooking(booking.id, "completed")} disabled={updatingBookingId === booking.id}>
                                  {updatingBookingId === booking.id ? <Loader2 className="size-3 animate-spin" /> : <PlayCircle className="size-3 mr-1" />}
                                  {t("completeBookingAction", language)}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STUDENTS TAB */}
            {activeTab === "students" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">{t("teacherStudentsTab", language)}</h2>
                {studentsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-emerald-600" /></div>
                ) : students.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-slate-400">{t("noStudentsYet", language)}</p></CardContent></Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <Card key={student.id} className="hover:border-emerald-300 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="size-10 bg-emerald-100">
                              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                                {student.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{student.name}</p>
                              <p className="text-xs text-slate-500 truncate">{student.email}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-slate-400">{t("nativeLanguage", language)}</p>
                              <p className="font-medium text-slate-700">{nativeLanguages[student.nativeLanguage || "other"] || student.nativeLanguage || "—"}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-slate-400">{t("germanLevel", language)}</p>
                              <p className="font-medium text-slate-700">{student.germanLevel || "—"}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-slate-400">{t("numberOfBookings", language)}</p>
                              <p className="font-medium text-slate-700">{student.bookingCount}</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2">
                              <p className="text-slate-400">{language === "en" ? "Trial" : "Probestunde"}</p>
                              <Badge variant="outline" className={student.isTrialUsed ? "bg-slate-100 text-slate-500 text-[10px]" : "bg-emerald-100 text-emerald-700 text-[10px]"}>
                                {student.isTrialUsed ? (language === "en" ? "Used" : "Genutzt") : (language === "en" ? "Available" : "Verfügbar")}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === "chat" && (
              <Card className="flex flex-col h-[calc(100vh-12rem)]">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Select value={selectedStudentId || ""} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder={t("selectStudent", language)} />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStudent && (
                      <div className="flex items-center gap-2">
                        <Avatar className="size-8 bg-emerald-100">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                            {selectedStudent.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{selectedStudent.name}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                {selectedStudentId ? (
                  <>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <ScrollArea className="h-full px-4 py-3">
                        {chatLoading ? (
                          <div className="flex items-center justify-center h-full"><Loader2 className="size-6 animate-spin text-emerald-600" /></div>
                        ) : chatMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-12">
                            <MessageCircle className="size-10" />
                            <p className="text-sm">{t("noMessages", language)}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {chatMessages.map((msg) => {
                              const isOwn = msg.senderId === user?.id;
                              return (
                                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isOwn ? "bg-emerald-600 text-white rounded-br-md" : "bg-slate-100 text-slate-800 rounded-bl-md"}`}>
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <p className={`text-[10px] ${isOwn ? "text-emerald-200" : "text-slate-400"}`}>
                                        {formatMessageTime(msg.createdAt)}
                                      </p>
                                      {isOwn && (
                                        <span className={`text-[10px] ${msg.isRead ? "text-emerald-200" : "text-emerald-300/60"}`}>
                                          {msg.isRead ? "✓✓" : "✓"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {isTyping && (
                              <div className="flex justify-start">
                                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                                  <div className="flex gap-1">
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                    <div className="size-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={chatEndRef} />
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                    <div className="p-3 border-t border-slate-200">
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => handleChatInput(e.target.value)}
                          placeholder={t("sendMessage", language)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                          <Send className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <MessageCircle className="size-12" />
                    <p className="text-sm">{t("selectStudent", language)}</p>
                  </CardContent>
                )}
              </Card>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {language === "en" ? "Student Reviews" : "Schülerbewertungen"}
                </h2>

                {reviewsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-emerald-600" />
                  </div>
                ) : reviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Star className="size-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-400">
                        {language === "en" ? "No reviews yet" : "Noch keine Bewertungen"}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Pending reviews */}
                    {reviews.filter((r) => !r.isApproved).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-amber-700 mb-3">
                          {language === "en" ? "⏳ Pending Approval" : "⏳ Ausstehende Freigabe"}
                        </h3>
                        <div className="space-y-3">
                          {reviews.filter((r) => !r.isApproved).map((review) => (
                            <Card key={review.id} className="border-amber-200 bg-amber-50/30">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="size-7 bg-emerald-100">
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                          {review.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium text-slate-900">{review.user.name}</span>
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star key={s} className={`size-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-600">{review.comment}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                      onClick={() => handleApproveReview(review.id, true)}
                                      disabled={reviewActionId === review.id}
                                    >
                                      {reviewActionId === review.id ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3 mr-1" />}
                                      {language === "en" ? "Approve" : "Genehmigen"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                      onClick={() => handleDeleteReview(review.id)}
                                      disabled={reviewActionId === review.id}
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved reviews */}
                    {reviews.filter((r) => r.isApproved).length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-emerald-700 mb-3">
                          {language === "en" ? "✅ Approved Reviews" : "✅ Genehmigte Bewertungen"}
                        </h3>
                        <div className="space-y-3">
                          {reviews.filter((r) => r.isApproved).map((review) => (
                            <Card key={review.id} className="border-emerald-200">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="size-7 bg-emerald-100">
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                          {review.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm font-medium text-slate-900">{review.user.name}</span>
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star key={s} className={`size-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-600">{review.comment}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-amber-300 text-amber-600 hover:bg-amber-50"
                                      onClick={() => handleApproveReview(review.id, false)}
                                      disabled={reviewActionId === review.id}
                                    >
                                      {language === "en" ? "Unapprove" : "Zurückziehen"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-300 text-red-600 hover:bg-red-50"
                                      onClick={() => handleDeleteReview(review.id)}
                                      disabled={reviewActionId === review.id}
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* HOMEWORK TAB */}
            {activeTab === "homework" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{t("teacherHomework", language)}</h2>
                  <div className="flex items-center gap-2">
                    <Select value={homeworkFilter} onValueChange={setHomeworkFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder={t("allStatuses", language)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allStatuses", language)}</SelectItem>
                        <SelectItem value="assigned">{t("assigned", language)}</SelectItem>
                        <SelectItem value="submitted">{t("submitted", language)}</SelectItem>
                        <SelectItem value="reviewed">{t("reviewed", language)}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowNewHomeworkForm(!showNewHomeworkForm)}
                    >
                      <Plus className="size-4 mr-1" />
                      {t("assignHomework", language)}
                    </Button>
                  </div>
                </div>

                {/* New homework form */}
                {showNewHomeworkForm && (
                  <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t("studentName", language)}</Label>
                          <Select value={newHomework.studentId} onValueChange={(v) => setNewHomework((prev) => ({ ...prev, studentId: v }))}>
                            <SelectTrigger>
                              <SelectValue placeholder={t("selectStudentForHomework", language)} />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t("homeworkTitle", language)}</Label>
                          <Input
                            value={newHomework.title}
                            onChange={(e) => setNewHomework((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder={t("homeworkTitle", language)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("homeworkDescription", language)}</Label>
                          <Textarea
                            value={newHomework.description}
                            onChange={(e) => setNewHomework((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder={t("homeworkDescription", language)}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("dueDateOptional", language)}</Label>
                          <Input
                            type="date"
                            value={newHomework.dueDate}
                            onChange={(e) => setNewHomework((prev) => ({ ...prev, dueDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">{t("uploadHomeworkImage", language)}</Label>
                          {newHomework.attachment ? (
                            <div className="relative border-2 border-emerald-300 rounded-xl p-3 bg-emerald-50/50">
                              <div className="flex items-start gap-3">
                                {newHomework.attachment.includes('.pdf') ? (
                                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 flex-1">
                                    <Paperclip className="size-5 text-red-500" />
                                    <span className="text-sm text-slate-700 font-medium">PDF Document</span>
                                    <a href={newHomework.attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline ml-auto">{t("viewFile", language)}</a>
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <img src={newHomework.attachment} alt="Preview" className="max-h-48 rounded-lg border border-emerald-200 object-contain bg-white" />
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="shrink-0"
                                  onClick={() => setNewHomework((prev) => ({ ...prev, attachment: "" }))}
                                >
                                  <XCircle className="size-4 mr-1" />
                                  {t("removeAttachment", language)}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                                homeworkUploading
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30"
                              }`}
                              onClick={() => {
                                if (homeworkUploading) return;
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,.pdf';
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (!file) return;
                                  setHomeworkUploading(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
                                    if (uploadRes.ok) {
                                      const data = await uploadRes.json();
                                      setNewHomework((prev) => ({ ...prev, attachment: data.url }));
                                    }
                                  } catch { /* silently fail */ }
                                  finally { setHomeworkUploading(false); }
                                };
                                input.click();
                              }}
                              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50'); }}
                              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50'); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50');
                                if (homeworkUploading) return;
                                const file = e.dataTransfer.files?.[0];
                                if (!file) return;
                                if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return;
                                setHomeworkUploading(true);
                                const formData = new FormData();
                                formData.append('file', file);
                                fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
                                  .then((res) => res.ok ? res.json() : null)
                                  .then((data) => {
                                    if (data?.url) setNewHomework((prev) => ({ ...prev, attachment: data.url }));
                                  })
                                  .catch(() => {})
                                  .finally(() => setHomeworkUploading(false));
                              }}
                            >
                              {homeworkUploading ? (
                                <div className="flex flex-col items-center gap-2 py-4">
                                  <Loader2 className="size-10 animate-spin text-emerald-600" />
                                  <p className="text-sm font-medium text-emerald-700">{t("uploading", language)}</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 py-2">
                                  <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <ImageIcon className="size-6 text-emerald-600" />
                                  </div>
                                  <p className="text-sm font-semibold text-slate-700">{t("dropImageHere", language)}</p>
                                  <p className="text-xs text-emerald-600 hover:text-emerald-700 underline">{t("orClickToUpload", language)}</p>
                                  <p className="text-xs text-slate-400">{t("supportedFormats", language)}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAssignHomework}
                            disabled={assigningHomework || !newHomework.studentId || !newHomework.title || !newHomework.description}
                          >
                            {assigningHomework ? <Loader2 className="size-4 animate-spin mr-1" /> : <CheckCircle2 className="size-4 mr-1" />}
                            {t("assignHomework", language)}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setShowNewHomeworkForm(false); setNewHomework({ studentId: "", title: "", description: "", dueDate: "", attachment: "" }); }}
                          >
                            {t("cancel", language)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Homework list */}
                {homeworkLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-emerald-600" /></div>
                ) : filteredHomework.length === 0 ? (
                  <Card><CardContent className="py-12 text-center"><p className="text-slate-400">{t("noHomeworkAssigned", language)}</p></CardContent></Card>
                ) : (
                  <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                    {filteredHomework.map((hw) => (
                      <Card key={hw.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex items-center gap-3 shrink-0">
                              <Avatar className="size-10 bg-emerald-100">
                                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                                  {hw.student.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{hw.student.name}</p>
                                <p className="text-xs text-slate-500">{formatDate(hw.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-medium text-slate-900">{hw.title}</h4>
                                <Badge variant="outline" className={homeworkStatusColors[hw.status] || "bg-slate-100 text-slate-600"}>
                                  {t(hw.status as "assigned" | "submitted" | "reviewed", language)}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{hw.description}</p>
                              {hw.dueDate && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                  <Clock className="size-3" />
                                  {t("dueDate", language)}: {formatDate(hw.dueDate)}
                                </div>
                              )}
                              {hw.attachment && (
                                <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                  <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                                    <Paperclip className="size-3" />
                                    {t("attachment", language)}
                                  </div>
                                  {hw.attachment.includes('.pdf') ? (
                                    <a href={hw.attachment} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 underline flex items-center gap-1">
                                      <Download className="size-3" />{t("viewFile", language)}
                                    </a>
                                  ) : (
                                    <a href={hw.attachment} target="_blank" rel="noopener noreferrer">
                                      <img src={hw.attachment} alt="Attachment" className="max-h-32 rounded border border-blue-200" />
                                    </a>
                                  )}
                                </div>
                              )}
                              {hw.studentAttachment && (
                                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mb-1">
                                    <ImageIcon className="size-3" />
                                    {t("studentAttachment", language)}
                                  </div>
                                  {hw.studentAttachment.includes('.pdf') ? (
                                    <a href={hw.studentAttachment} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-700 underline flex items-center gap-1">
                                      <Download className="size-3" />{t("viewFile", language)}
                                    </a>
                                  ) : (
                                    <a href={hw.studentAttachment} target="_blank" rel="noopener noreferrer">
                                      <img src={hw.studentAttachment} alt="Student submission" className="max-h-32 rounded border border-amber-200" />
                                    </a>
                                  )}
                                </div>
                              )}
                              {hw.feedback && (
                                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-1">
                                    <CheckCircle2 className="size-3" />
                                    {t("feedback", language)}
                                  </div>
                                  <p className="text-sm text-emerald-800">{hw.feedback}</p>
                                </div>
                              )}
                              {hw.status === "submitted" && !hw.feedback && (
                                <div className="mt-3 space-y-2">
                                  {feedbackInput[hw.id] !== undefined ? (
                                    <>
                                      <Textarea
                                        value={feedbackInput[hw.id]}
                                        onChange={(e) => setFeedbackInput((prev) => ({ ...prev, [hw.id]: e.target.value }))}
                                        placeholder={t("feedbackPlaceholder", language)}
                                        rows={2}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                          onClick={() => handleHomeworkFeedback(hw.id, feedbackInput[hw.id], true)}
                                          disabled={submittingHomeworkId === hw.id}
                                        >
                                          {submittingHomeworkId === hw.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <CheckCircle2 className="size-3 mr-1" />}
                                          {t("markAsReviewed", language)}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setFeedbackInput((prev) => {
                                            const next = { ...prev };
                                            delete next[hw.id];
                                            return next;
                                          })}
                                          disabled={submittingHomeworkId === hw.id}
                                        >
                                          {t("cancel", language)}
                                        </Button>
                                      </div>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => setFeedbackInput((prev) => ({ ...prev, [hw.id]: "" }))}
                                    >
                                      {t("addFeedback", language)}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SCHEDULE TAB */}
            {activeTab === "schedule" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">{t("teacherScheduleTab", language)}</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="text-sm font-medium text-slate-700 min-w-[200px] text-center">
                      {weekDays[0].toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric" })} — {weekDays[6].toLocaleDateString(language === "de" ? "de-DE" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>

                {bookingsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-emerald-600" /></div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, idx) => {
                      const dayBookings = getBookingsForDay(day);
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={idx} className={`rounded-xl border p-2 min-h-[120px] ${isToday ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
                          <p className={`text-xs font-semibold mb-1 ${isToday ? "text-emerald-700" : "text-slate-500"}`}>
                            {day.toLocaleDateString(language === "de" ? "de-DE" : "en-US", { weekday: "short" })}
                          </p>
                          <p className={`text-lg font-bold mb-2 ${isToday ? "text-emerald-700" : "text-slate-900"}`}>
                            {day.getDate()}
                          </p>
                          {dayBookings.map((b) => (
                            <div key={b.id} className={`text-[10px] rounded-md px-1.5 py-1 mb-1 ${b.status === "confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              <div className="font-medium">{formatTime(b.time)}</div>
                              <div className="truncate">{b.user.name}</div>
                              <div className="truncate">{b.course.level}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
