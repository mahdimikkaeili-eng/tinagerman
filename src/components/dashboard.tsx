"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Calendar,
  MessageCircle,
  BookOpen,
  LogOut,
  Globe,
  Video,
  Clock,
  Send,
  Loader2,
  Edit3,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { BookingModal } from "./booking-modal";

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  isTrial: boolean;
  meetLink: string | null;
  course: { id: string; title: string; titleDe: string; level: string };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: string;
  feedback: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

const nativeLanguages = [
  { value: "en", label: "English" },
  { value: "de", label: "Deutsch" },
  { value: "fa", label: "فارسی (Farsi)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "tr", label: "Türkçe" },
  { value: "ru", label: "Русский (Russian)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
  { value: "pt", label: "Português" },
  { value: "it", label: "Italiano" },
  { value: "uk", label: "Українська (Ukrainian)" },
  { value: "other", label: "Other" },
];

const germanLevels = [
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  submitted: "bg-amber-100 text-amber-700 border-amber-200",
  reviewed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function Dashboard() {
  const {
    language,
    setLanguage,
    user,
    logout,
    activeDashboardTab,
    setActiveDashboardTab,
    setTinaUserId,
  } = useAppStore();

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isTrialBooking, setIsTrialBooking] = useState(false);

  // Profile state
  const [editMode, setEditMode] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileNativeLang, setProfileNativeLang] = useState(
    user?.nativeLanguage || ""
  );
  const [profileGermanLevel, setProfileGermanLevel] = useState(
    user?.germanLevel || ""
  );
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Homework state
  const [homework, setHomework] = useState<Homework[]>([]);
  const [homeworkLoading, setHomeworkLoading] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<ReturnType<typeof import("socket.io-client").io> | null>(null);
  const [tinaId, setTinaId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount and tab change
  useEffect(() => {
    if (!user) return;

    // Fetch teacher profile to get Tina's ID
    fetch("/api/teacher")
      .then((res) => res.json())
      .then((data) => {
        if (data.teacher?.id) {
          setTinaId(data.teacher.id);
          setTinaUserId(data.teacher.id);
        }
      })
      .catch(console.error);
  }, [user, setTinaUserId]);

  // Load bookings
  useEffect(() => {
    if (!user || activeDashboardTab !== "bookings") return;
    setBookingsLoading(true);
    fetch(`/api/bookings?userId=${user.id}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || data || []);
        setBookingsLoading(false);
      })
      .catch(() => {
        setBookings([]);
        setBookingsLoading(false);
      });
  }, [user, activeDashboardTab]);

  // Load homework
  useEffect(() => {
    if (!user || activeDashboardTab !== "homework") return;
    setHomeworkLoading(true);
    fetch(`/api/homework?studentId=${user.id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch homework');
        return res.json();
      })
      .then((data) => {
        setHomework(data.homeworks || data.homework || []);
        setHomeworkLoading(false);
      })
      .catch(() => {
        setHomework([]);
        setHomeworkLoading(false);
      });
  }, [user, activeDashboardTab]);

  // Load chat messages
  useEffect(() => {
    if (!user || !tinaId || activeDashboardTab !== "chat") return;
    setChatLoading(true);
    fetch(`/api/messages?userId=${user.id}&otherUserId=${tinaId}`)
      .then((res) => res.json())
      .then((data) => {
        setChatMessages(data.messages || data || []);
        setChatLoading(false);
      })
      .catch(() => {
        setChatMessages([]);
        setChatLoading(false);
      });
  }, [user, tinaId, activeDashboardTab]);

  // Socket.io connection for chat
  useEffect(() => {
    if (!user || !tinaId || activeDashboardTab !== "chat") return;

    let socketInstance: ReturnType<typeof import("socket.io-client").io> | null = null;

    // Dynamic import to avoid SSR issues
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
        socketInstance!.emit("joinRoom", { otherUserId: tinaId });
      });

      socketInstance.on("newMessage", (message: ChatMessage) => {
        setChatMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        // Mark as read if the message is from Tina
        if (message.senderId === tinaId) {
          socketInstance!.emit("markRead", { otherUserId: tinaId });
        }
      });

      socketInstance.on("userTyping", ({ userId: typingUserId }: { userId: string }) => {
        if (typingUserId === tinaId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      });

      socketInstance.on("messagesRead", () => {
        // Could update read status indicators
      });

      setSocket(socketInstance);
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, tinaId, activeDashboardTab]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Send message
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || !socket || !tinaId || !user) return;

    const messageData = {
      receiverId: tinaId,
      content: chatInput.trim(),
    };

    // Send via socket
    socket.emit("sendMessage", messageData);

    // Also persist via API
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderId: user.id,
        receiverId: tinaId,
        content: chatInput.trim(),
      }),
    }).catch(console.error);

    setChatInput("");
  }, [chatInput, socket, tinaId, user]);

  // Typing indicator
  const handleChatInput = (value: string) => {
    setChatInput(value);
    if (socket && tinaId) {
      socket.emit("typing", { receiverId: tinaId });
    }
  };

  // Profile save
  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileSaved(false);

    try {
      const res = await fetch("/api/auth/register", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name: profileName,
          phone: profilePhone,
          nativeLanguage: profileNativeLang,
          germanLevel: profileGermanLevel,
        }),
      });

      if (res.ok) {
        setProfileSaved(true);
        setEditMode(false);
        // Update the store user
        const updatedUser = {
          ...user,
          name: profileName,
          phone: profilePhone,
          nativeLanguage: profileNativeLang,
          germanLevel: profileGermanLevel,
        };
        useAppStore.getState().login(updatedUser);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch {
      // silently fail
    } finally {
      setProfileSaving(false);
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

  // Format date for display
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

  // Split bookings into upcoming and past
  const now = new Date();
  const upcomingBookings = bookings.filter((b) => {
    const bookingDate = new Date(`${b.date}T${b.time}`);
    return bookingDate >= now && b.status !== "cancelled";
  });
  const pastBookings = bookings.filter((b) => {
    const bookingDate = new Date(`${b.date}T${b.time}`);
    return bookingDate < now || b.status === "cancelled";
  });

  const sidebarItems = [
    {
      id: "profile",
      label: t("profileTab", language),
      icon: User,
    },
    {
      id: "bookings",
      label: t("bookingsTab", language),
      icon: Calendar,
    },
    {
      id: "chat",
      label: t("chatTab", language),
      icon: MessageCircle,
    },
    {
      id: "homework",
      label: t("homeworkTab", language),
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="flex flex-col w-1.5 h-6 rounded-full overflow-hidden">
                  <div className="flex-1 bg-slate-900" />
                  <div className="flex-1 bg-red-500" />
                  <div className="flex-1 bg-amber-500" />
                </div>
                <span className="text-lg font-bold text-slate-900">
                  Deutsch mit Tina
                </span>
              </div>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <span className="text-sm font-medium text-slate-500 hidden sm:block">
                {t("dashboardTitle", language)}
              </span>
            </div>

            {/* Right: User info + actions */}
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "de" : "en")}
                className="text-slate-600 hover:text-emerald-600"
              >
                <Globe className="size-4 mr-1" />
                <span className="text-xs font-semibold">
                  {language === "en" ? "DE" : "EN"}
                </span>
              </Button>

              {/* User avatar + name */}
              <div className="flex items-center gap-2">
                <Avatar className="size-8 bg-emerald-100">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user?.name}
                </span>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600"
              >
                <LogOut className="size-4 mr-1" />
                <span className="hidden sm:inline">{t("logout", language)}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-3">
                <div className="flex flex-col gap-1">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveDashboardTab(item.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeDashboardTab === item.id
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <Separator className="my-3" />

                {/* Quick actions */}
                <div className="flex flex-col gap-2 px-2">
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setIsTrialBooking(false);
                      setBookingModalOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-1" />
                    {t("bookLesson", language)}
                  </Button>
                  {user && !user.isTrialUsed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => {
                        setIsTrialBooking(true);
                        setBookingModalOpen(true);
                      }}
                    >
                      {t("bookTrial", language)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Mobile tabs */}
            <div className="lg:hidden mb-4">
              <Tabs
                value={activeDashboardTab}
                onValueChange={setActiveDashboardTab}
              >
                <TabsList className="w-full grid grid-cols-4">
                  {sidebarItems.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="text-xs sm:text-sm px-1 sm:px-3"
                    >
                      <item.icon className="size-4 sm:mr-1" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Mobile quick actions */}
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    setIsTrialBooking(false);
                    setBookingModalOpen(true);
                  }}
                >
                  <Plus className="size-4 mr-1" />
                  {t("bookLesson", language)}
                </Button>
                {user && !user.isTrialUsed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      setIsTrialBooking(true);
                      setBookingModalOpen(true);
                    }}
                  >
                    {t("bookTrial", language)}
                  </Button>
                )}
              </div>
            </div>

            {/* PROFILE TAB */}
            {activeDashboardTab === "profile" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {t("profileTab", language)}
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      {t("welcome", language)}, {user?.name}!
                    </p>
                  </div>
                  <Button
                    variant={editMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (editMode) {
                        handleSaveProfile();
                      } else {
                        setProfileName(user?.name || "");
                        setProfilePhone(user?.phone || "");
                        setProfileNativeLang(user?.nativeLanguage || "");
                        setProfileGermanLevel(user?.germanLevel || "");
                        setEditMode(true);
                      }
                    }}
                    disabled={profileSaving}
                    className={
                      editMode
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : ""
                    }
                  >
                    {profileSaving ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : editMode ? (
                      <Save className="size-4 mr-1" />
                    ) : (
                      <Edit3 className="size-4 mr-1" />
                    )}
                    {editMode
                      ? t("saveChanges", language)
                      : t("editProfile", language)}
                  </Button>
                </CardHeader>
                <CardContent>
                  {profileSaved && (
                    <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      {language === "en"
                        ? "Profile updated successfully!"
                        : "Profil erfolgreich aktualisiert!"}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label>{t("name", language)}</Label>
                      {editMode ? (
                        <Input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                        />
                      ) : (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                          {user?.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label>{t("email", language)}</Label>
                      <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                        {user?.email}
                      </p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label>{t("phone", language)}</Label>
                      {editMode ? (
                        <Input
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="+43 677 1234567"
                        />
                      ) : (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                          {user?.phone || (language === "en" ? "Not set" : "Nicht festgelegt")}
                        </p>
                      )}
                    </div>

                    {/* Native Language */}
                    <div className="space-y-2">
                      <Label>{t("nativeLanguage", language)}</Label>
                      {editMode ? (
                        <Select
                          value={profileNativeLang}
                          onValueChange={setProfileNativeLang}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                language === "en" ? "Select" : "Auswählen"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {nativeLanguages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                          {nativeLanguages.find(
                            (l) => l.value === user?.nativeLanguage
                          )?.label ||
                            user?.nativeLanguage ||
                            (language === "en" ? "Not set" : "Nicht festgelegt")}
                        </p>
                      )}
                    </div>

                    {/* German Level */}
                    <div className="space-y-2">
                      <Label>{t("germanLevel", language)}</Label>
                      {editMode ? (
                        <Select
                          value={profileGermanLevel}
                          onValueChange={setProfileGermanLevel}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                language === "en" ? "Select" : "Auswählen"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {germanLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                          {user?.germanLevel ||
                            (language === "en" ? "Not set" : "Nicht festgelegt")}
                        </p>
                      )}
                    </div>

                    {/* Trial status */}
                    <div className="space-y-2">
                      <Label>
                        {language === "en" ? "Trial Lesson" : "Probestunde"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            user?.isTrialUsed
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200"
                          }
                        >
                          {user?.isTrialUsed
                            ? t("trialUsed", language)
                            : t("trialAvailable", language)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BOOKINGS TAB */}
            {activeDashboardTab === "bookings" && (
              <div className="space-y-6">
                {/* Upcoming */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="size-5 text-emerald-600" />
                      {t("upcomingBookings", language)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-emerald-600" />
                      </div>
                    ) : upcomingBookings.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
                        <Calendar className="size-10" />
                        <p className="text-sm">{t("noBookings", language)}</p>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setIsTrialBooking(false);
                            setBookingModalOpen(true);
                          }}
                        >
                          <Plus className="size-4 mr-1" />
                          {t("bookLesson", language)}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex flex-col items-center bg-emerald-50 rounded-lg px-3 py-2 min-w-[70px]">
                                <span className="text-xs text-emerald-600 font-medium">
                                  {new Date(booking.date).toLocaleDateString(
                                    language === "de" ? "de-DE" : "en-US",
                                    { month: "short" }
                                  )}
                                </span>
                                <span className="text-lg font-bold text-emerald-700">
                                  {new Date(booking.date).getDate()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {language === "de"
                                    ? booking.course.titleDe
                                    : booking.course.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                  <Clock className="size-3" />
                                  {formatTime(booking.time)}
                                  {booking.isTrial && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50"
                                    >
                                      Trial
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  statusColors[booking.status] ||
                                  "bg-slate-100 text-slate-600"
                                }
                              >
                                {t(booking.status as "pending" | "confirmed" | "completed" | "cancelled", language)}
                              </Badge>
                              {booking.meetLink && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    window.open(booking.meetLink!, "_blank")
                                  }
                                >
                                  <Video className="size-3 mr-1" />
                                  {t("joinMeeting", language)}
                                </Button>
                              )}
                              {(booking.status === "confirmed" || booking.status === "pending") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-500 hover:text-emerald-600"
                                  onClick={() => {
                                    const startDate = new Date(`${booking.date}T${booking.time}:00`);
                                    const endDate = new Date(startDate.getTime() + 50 * 60 * 1000);
                                    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
                                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${booking.course.level} German Lesson - Deutsch mit Tina`)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(`German lesson with Tina\nLevel: ${booking.course.level}${booking.isTrial ? "\n(Free Trial)" : ""}`)}&ctz=Europe/Vienna${booking.meetLink ? `&location=${encodeURIComponent(booking.meetLink)}` : ""}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  <CalendarPlus className="size-3 mr-1" />
                                  {t("addToCalendar", language)}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Past */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="size-5 text-slate-400" />
                      {t("pastBookings", language)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {bookingsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-slate-400" />
                      </div>
                    ) : pastBookings.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">
                        {language === "en"
                          ? "No past bookings"
                          : "Keine vergangenen Buchungen"}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {pastBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 truncate">
                                {language === "de"
                                  ? booking.course.titleDe
                                  : booking.course.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatDate(booking.date)} · {formatTime(booking.time)}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                statusColors[booking.status] ||
                                "bg-slate-100 text-slate-600"
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* CHAT TAB */}
            {activeDashboardTab === "chat" && (
              <Card className="flex flex-col h-[calc(100vh-12rem)]">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 bg-emerald-100">
                      <img
                        src="/tina-avatar.jpg"
                        alt="Tina"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {t("chatTab", language)}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        {t("online", language)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Chat messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full px-4 py-3">
                    {chatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="size-6 animate-spin text-emerald-600" />
                      </div>
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
                            <div
                              key={msg.id}
                              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                  isOwn
                                    ? "bg-emerald-600 text-white rounded-br-md"
                                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.content}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <p
                                    className={`text-[10px] ${
                                      isOwn
                                        ? "text-emerald-200"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {formatMessageTime(msg.createdAt)}
                                  </p>
                                  {isOwn && (
                                    <span
                                      className={`text-[10px] ${
                                        msg.isRead
                                          ? "text-emerald-200"
                                          : "text-emerald-300/60"
                                      }`}
                                    >
                                      {msg.isRead ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Typing indicator */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                              <div className="flex gap-1">
                                <div className="size-2 bg-slate-400 rounded-full animate-bounce" />
                                <div
                                  className="size-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                />
                                <div
                                  className="size-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Chat input */}
                <div className="p-3 border-t bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => handleChatInput(e.target.value)}
                      placeholder={t("sendMessage", language)}
                      className="flex-1 rounded-full bg-slate-50 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      disabled={chatLoading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      disabled={!chatInput.trim() || chatLoading}
                    >
                      <Send className="size-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            )}

            {/* HOMEWORK TAB */}
            {activeDashboardTab === "homework" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="size-5 text-emerald-600" />
                    {t("homeworkTab", language)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {homeworkLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-6 animate-spin text-emerald-600" />
                    </div>
                  ) : homework.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
                      <BookOpen className="size-10" />
                      <p className="text-sm">{t("noHomework", language)}</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[calc(100vh-16rem)] overflow-y-auto">
                      {homework.map((hw) => (
                        <div
                          key={hw.id}
                          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-slate-900">
                                  {hw.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={
                                    statusColors[hw.status] ||
                                    "bg-slate-100 text-slate-600"
                                  }
                                >
                                  {t(hw.status as "assigned" | "submitted" | "reviewed", language)}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                {hw.description}
                              </p>

                              {/* Due date */}
                              {hw.dueDate && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                                  <Clock className="size-3" />
                                  {t("dueDate", language)}: {formatDate(hw.dueDate)}
                                </div>
                              )}

                              {/* Feedback */}
                              {hw.feedback && (
                                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mb-1">
                                    <AlertCircle className="size-3" />
                                    {t("feedback", language)}
                                  </div>
                                  <p className="text-sm text-emerald-800">
                                    {hw.feedback}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        isTrial={isTrialBooking}
      />
    </div>
  );
}
