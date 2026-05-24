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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

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
function generateGoogleCalendarUrl(booking: TeacherBooking) {
  const startDate = new Date(`${booking.date}T${booking.time}:00`);
  const endDate = new Date(startDate.getTime() + 50 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = encodeURIComponent(`${booking.course.level} German Lesson - Deutsch mit Tina`);
  const details = encodeURIComponent(
    `German lesson with ${booking.user.name}\nLevel: ${booking.course.level}${booking.isTrial ? "\n(Free Trial)" : ""}`
  );
  const location = encodeURIComponent(booking.meetLink || "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${details}&location=${location}&ctz=Europe/Vienna`;
}

export function TeacherDashboard() {
  const { language, setLanguage, user, logout } = useAppStore();

  const [activeTab, setActiveTab] = useState("overview");

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
    { id: "chat", label: t("chatWithStudents", language), icon: MessageCircle },
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
                <span className="text-lg font-bold text-slate-900">Deutsch mit Tina</span>
              </div>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <span className="text-sm font-medium text-emerald-600 hidden sm:block">
                {t("teacherDashboard", language)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "de" : "en")} className="text-slate-600 hover:text-emerald-600">
                <Globe className="size-4 mr-1" />
                <span className="text-xs font-semibold">{language === "en" ? "DE" : "EN"}</span>
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="size-8">
                  <img src="/tina-avatar.jpg" alt="Tina" className="w-full h-full object-cover rounded-full" />
                </Avatar>
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
                    <img src="/tina-avatar.jpg" alt="Tina" className="w-full h-full object-cover rounded-full" />
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
                <TabsList className="w-full grid grid-cols-5">
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
                              <Button size="sm" variant="ghost" onClick={() => window.open(generateGoogleCalendarUrl(booking), "_blank")}>
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
