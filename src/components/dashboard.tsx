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
  Menu,
  Home,
  GraduationCap,
  DollarSign,
  ClipboardList,
  Info,
  Mail,
  Paperclip,
  Download,
  Image as ImageIcon,
  X,
  Mic,
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
import { NotificationBell } from "./notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  attachment: string | null;
  studentAttachment: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachment?: string;
  attachmentType?: string;
  attachmentName?: string;
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
  { value: "hu", label: "Magyar (Hungarian)" },
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

// Helper to convert /uploads/xxx to /api/uploads?file=xxx for reliable file serving
function getFileUrl(attachmentUrl: string): string {
  if (!attachmentUrl) return attachmentUrl;
  const filename = attachmentUrl.replace("/uploads/", "");
  if (filename && !attachmentUrl.startsWith("/api/")) {
    return `/api/uploads?file=${encodeURIComponent(filename)}`;
  }
  return attachmentUrl;
}

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
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Homework state
  const [homework, setHomework] = useState<Homework[]>([]);
  const [homeworkLoading, setHomeworkLoading] = useState(true);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [studentAttachmentUploading, setStudentAttachmentUploading] = useState<string | null>(null); // homework id being uploaded

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<ReturnType<typeof import("socket.io-client").io> | null>(null);
  const [tinaId, setTinaId] = useState<string | null>(null);
  const [chatAttachmentUploading, setChatAttachmentUploading] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    previewUrl: string;
    type: string; // 'image' | 'voice' | 'file'
  } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Reschedule dialog state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

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
          // Avoid duplicates - check by ID or by matching content+sender+time
          if (prev.some((m) => m.id === message.id)) return prev;
          // Also check for optimistic messages we already added locally
          const isDuplicate = prev.some((m) =>
            m.id.startsWith("temp_") &&
            m.senderId === message.senderId &&
            m.content === message.content &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 10000
          );
          if (isDuplicate) return prev;
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

  // Send message (with optional pending attachment)
  const handleSendMessage = useCallback(async () => {
    if ((!chatInput.trim() && !pendingAttachment) || !socket || !tinaId || !user) return;

    // If there's a pending attachment, upload it first
    if (pendingAttachment) {
      setChatAttachmentUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", pendingAttachment.file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Upload failed");
        }

        const { url } = await uploadRes.json();

        // Add message to UI immediately (optimistic)
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMsg: ChatMessage = {
          id: tempId,
          senderId: user.id,
          receiverId: tinaId,
          content: chatInput.trim() || "",
          attachment: url,
          attachmentType: pendingAttachment.type,
          attachmentName: pendingAttachment.file.name,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setChatMessages((prev) => [...prev, optimisticMsg]);

        const messageData = {
          receiverId: tinaId,
          content: chatInput.trim() || "",
          attachment: url,
          attachmentType: pendingAttachment.type,
          attachmentName: pendingAttachment.file.name,
        };

        // Send via socket
        socket.emit("sendMessage", messageData);

        // Persist via API
        fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: user.id,
            receiverId: tinaId,
            content: chatInput.trim() || "",
            attachment: url,
            attachmentType: pendingAttachment.type,
            attachmentName: pendingAttachment.file.name,
          }),
        }).catch(console.error);

        setPendingAttachment(null);
        setChatInput("");
      } catch {
        // silently fail
      } finally {
        setChatAttachmentUploading(false);
        if (chatFileInputRef.current) {
          chatFileInputRef.current.value = "";
        }
      }
    } else {
      // Text-only message - add to UI immediately (optimistic)
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        senderId: user.id,
        receiverId: tinaId,
        content: chatInput.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setChatMessages((prev) => [...prev, optimisticMsg]);

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
    }
  }, [chatInput, socket, tinaId, user, pendingAttachment]);

  // Handle chat file selection (show preview, don't upload yet)
  const handleChatFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine attachment type
    let attachmentType = "file";
    if (file.type.startsWith("image/")) {
      attachmentType = "image";
    } else if (file.type.startsWith("audio/")) {
      attachmentType = "voice";
    }

    // Create preview URL for images
    let previewUrl = "";
    if (attachmentType === "image") {
      previewUrl = URL.createObjectURL(file);
    }

    setPendingAttachment({
      file,
      previewUrl,
      type: attachmentType,
    });

    // Reset file input so the same file can be selected again
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = "";
    }
  };

  // Typing indicator
  const handleChatInput = (value: string) => {
    setChatInput(value);
    if (socket && tinaId) {
      socket.emit("typing", { receiverId: tinaId });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setChatMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch {
      // silently fail
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return;
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      if (res.ok) {
        setChatMessages((prev) =>
          prev.map((m) => m.id === messageId ? { ...m, content: editingContent.trim() } : m)
        );
        setEditingMessageId(null);
        setEditingContent("");
      }
    } catch {
      // silently fail
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
        credentials: "include",
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          nativeLanguage: profileNativeLang,
          germanLevel: profileGermanLevel,
          avatar: user.avatar,
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

  // Handle cancel booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm(t("cancelConfirm", language))) return;

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (res.ok) {
        toast.success(t("bookingCancelled", language));
        // Refresh bookings
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
        );
      }
    } catch {
      // silently fail
    }
  };

  // Handle open reschedule dialog
  const handleOpenReschedule = (booking: Booking) => {
    setRescheduleBookingId(booking.id);
    setRescheduleDate(booking.date);
    setRescheduleTime(booking.time);
    setRescheduleLoading(false);
  };

  // Handle confirm reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleBookingId || !rescheduleDate || !rescheduleTime) return;

    setRescheduleLoading(true);
    try {
      const res = await fetch(`/api/bookings/${rescheduleBookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime }),
      });

      if (res.ok) {
        toast.success(t("bookingRescheduled", language));
        // Refresh bookings
        setBookings((prev) =>
          prev.map((b) =>
            b.id === rescheduleBookingId
              ? { ...b, date: rescheduleDate, time: rescheduleTime, status: "pending" }
              : b
          )
        );
        setRescheduleBookingId(null);
      }
    } catch {
      // silently fail
    } finally {
      setRescheduleLoading(false);
    }
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
          phone: user.phone,
          nativeLanguage: user.nativeLanguage,
          germanLevel: user.germanLevel,
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
                <button onClick={() => useAppStore.getState().setViewMode('landing')} className="text-lg font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                  Deutsch mit Tina
                </button>
              </div>
              <Separator orientation="vertical" className="h-6 hidden sm:block" />
              <span className="text-sm font-medium text-slate-500 hidden sm:block">
                {t("dashboardTitle", language)}
              </span>
            </div>

            {/* Right: User info + actions */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
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
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><Home className="size-4" />{t("navHome", language)}</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><GraduationCap className="size-4" />{t("navCourses", language)}</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><DollarSign className="size-4" />{t("navPricing", language)}</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><ClipboardList className="size-4" />{t("navPlacement", language)}</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><Info className="size-4" />{t("navAbout", language)}</button>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <button onClick={() => useAppStore.getState().setViewMode('landing')} className="flex items-center gap-2 cursor-pointer w-full"><Mail className="size-4" />{t("navContact", language)}</button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name || "Avatar"} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  )}
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

      {/* Welcome banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">🇩🇪</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {language === "en" ? `Hey ${user?.name?.split(" ")[0] || ""}` : `Hallo ${user?.name?.split(" ")[0] || ""}`}!
            </p>
            <p className="text-xs text-slate-600">{t("welcomeStudentMsg", language)}</p>
          </div>
        </div>
      </div>

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

                  {/* Avatar upload */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative group">
                      <Avatar className="size-16 bg-emerald-100">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user?.name || "Avatar"} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {avatarUploading ? (
                          <Loader2 className="size-5 text-white animate-spin" />
                        ) : (
                          <Edit3 className="size-4 text-white" />
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
                    <div>
                      <p className="text-sm font-medium text-slate-700">{user?.name}</p>
                      <p className="text-xs text-slate-400">
                        {avatarUploading ? t("uploading", language) : t("uploadAvatar", language)}
                      </p>
                    </div>
                  </div>

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
                                    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Vienna";
                                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${booking.course.level} German Lesson - Deutsch mit Tina`)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(`German lesson with Tina\nLevel: ${booking.course.level}${booking.isTrial ? "\n(Free Trial)" : ""}`)}&ctz=${encodeURIComponent(userTz)}${booking.meetLink ? `&location=${encodeURIComponent(booking.meetLink)}` : ""}`;
                                    window.open(url, "_blank");
                                  }}
                                >
                                  <CalendarPlus className="size-3 mr-1" />
                                  {t("addToCalendar", language)}
                                </Button>
                              )}
                              {(booking.status === "confirmed" || booking.status === "pending") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => handleOpenReschedule(booking)}
                                  >
                                    <Clock className="size-3 mr-1" />
                                    {t("rescheduleBooking", language)}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleCancelBooking(booking.id)}
                                  >
                                    {t("cancelBooking", language)}
                                  </Button>
                                </>
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
                                    ? "bg-emerald-600 text-white rounded-br-md group"
                                    : "bg-slate-100 text-slate-800 rounded-bl-md"
                                }`}
                              >
                                {/* Attachment rendering */}
                                {msg.attachment && msg.attachmentType === "image" && (
                                  <div className="mb-2">
                                    <img
                                      src={getFileUrl(msg.attachment)}
                                      alt={msg.attachmentName || "Image"}
                                      className="max-w-full max-h-60 rounded-lg object-cover cursor-pointer"
                                      onClick={() => window.open(getFileUrl(msg.attachment), "_blank")}
                                    />
                                  </div>
                                )}
                                {msg.attachment && msg.attachmentType === "voice" && (
                                  <div className="mb-2">
                                    <audio controls className="max-w-full h-8">
                                      <source src={getFileUrl(msg.attachment)} />
                                    </audio>
                                    {msg.attachmentName && (
                                      <p className={`text-[10px] mt-1 ${isOwn ? "text-emerald-200" : "text-slate-400"}`}>
                                        {msg.attachmentName}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {msg.attachment && msg.attachmentType === "file" && (
                                  <div className="mb-2 flex items-center gap-2">
                                    <FileText className="size-4 shrink-0" />
                                    <a
                                      href={getFileUrl(msg.attachment)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-sm underline break-all ${isOwn ? "text-emerald-100 hover:text-white" : "text-emerald-600 hover:text-emerald-800"}`}
                                    >
                                      {msg.attachmentName || t("downloadFile", language)}
                                    </a>
                                  </div>
                                )}
                                {msg.content && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                )}
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
                                {isOwn && !msg.id.startsWith("temp_") && (
                                  <div className="flex items-center gap-2 mt-1 justify-end">
                                    {editingMessageId === msg.id ? (
                                      <>
                                        <Input
                                          value={editingContent}
                                          onChange={(e) => setEditingContent(e.target.value)}
                                          className="h-7 text-xs bg-white/10 border-emerald-400/50"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") handleEditMessage(msg.id);
                                            if (e.key === "Escape") { setEditingMessageId(null); setEditingContent(""); }
                                          }}
                                          autoFocus
                                        />
                                        <button onClick={() => handleEditMessage(msg.id)} className="text-[10px] text-emerald-200 hover:text-white">✓</button>
                                        <button onClick={() => { setEditingMessageId(null); setEditingContent(""); }} className="text-[10px] text-emerald-200 hover:text-white">✗</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setEditingMessageId(msg.id); setEditingContent(msg.content); }} className="text-[10px] text-emerald-200 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                          {language === "en" ? "Edit" : "Bearbeiten"}
                                        </button>
                                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-[10px] text-emerald-200 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {language === "en" ? "Delete" : "Löschen"}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
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
                <div className="border-t bg-white">
                  {/* Pending attachment preview */}
                  {pendingAttachment && (
                    <div className="px-3 pt-3 pb-1">
                      <div className="relative inline-flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 max-w-[280px]">
                        {pendingAttachment.type === "image" && pendingAttachment.previewUrl ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={pendingAttachment.previewUrl}
                              alt="Preview"
                              className="size-12 rounded-lg object-cover"
                            />
                            <span className="text-xs text-slate-600 truncate max-w-[140px]">{pendingAttachment.file.name}</span>
                          </div>
                        ) : pendingAttachment.type === "voice" ? (
                          <div className="flex items-center gap-2">
                            <Mic className="size-5 text-emerald-600 shrink-0" />
                            <span className="text-xs text-slate-600 truncate max-w-[160px]">{pendingAttachment.file.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-amber-600 shrink-0" />
                            <span className="text-xs text-slate-600 truncate max-w-[160px]">{pendingAttachment.file.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPendingAttachment(null);
                            if (pendingAttachment.previewUrl) {
                              URL.revokeObjectURL(pendingAttachment.previewUrl);
                            }
                          }}
                          className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-slate-400 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2 items-center p-3"
                  >
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={handleChatFileSelect}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0"
                      disabled={chatLoading || chatAttachmentUploading}
                      onClick={() => chatFileInputRef.current?.click()}
                      title={t("chatAttachFile", language)}
                    >
                      {chatAttachmentUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Paperclip className="size-4" />
                      )}
                    </Button>
                    <Input
                      value={chatInput}
                      onChange={(e) => handleChatInput(e.target.value)}
                      placeholder={t("sendMessage", language)}
                      className="flex-1 rounded-full bg-slate-50 border-slate-200 focus:border-emerald-400 focus:ring-emerald-400/20"
                      disabled={chatLoading || chatAttachmentUploading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      disabled={(!chatInput.trim() && !pendingAttachment) || chatLoading || chatAttachmentUploading}
                    >
                      {chatAttachmentUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
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

                              {/* Teacher's attachment */}
                              {hw.attachment && (
                                <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                                  <div className="flex items-center gap-1 text-xs text-blue-600 font-medium mb-1">
                                    <Paperclip className="size-3" />
                                    {t("attachment", language)}
                                  </div>
                                  {hw.attachment.includes('.pdf') ? (
                                    <a href={getFileUrl(hw.attachment)} target="_blank" rel="noopener noreferrer" download className="text-sm text-blue-700 underline flex items-center gap-1">
                                      <Download className="size-3" />{t("viewFile", language)}
                                    </a>
                                  ) : (
                                    <a href={getFileUrl(hw.attachment)} target="_blank" rel="noopener noreferrer">
                                      <img src={getFileUrl(hw.attachment)} alt="Attachment" className="max-h-32 rounded border border-blue-200" />
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Student's own submitted attachment */}
                              {hw.studentAttachment && (
                                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium mb-1">
                                    <ImageIcon className="size-3" />
                                    {t("studentAttachment", language)}
                                  </div>
                                  {hw.studentAttachment.includes('.pdf') ? (
                                    <a href={getFileUrl(hw.studentAttachment)} target="_blank" rel="noopener noreferrer" download className="text-sm text-amber-700 underline flex items-center gap-1">
                                      <Download className="size-3" />{t("viewFile", language)}
                                    </a>
                                  ) : (
                                    <a href={getFileUrl(hw.studentAttachment)} target="_blank" rel="noopener noreferrer">
                                      <img src={getFileUrl(hw.studentAttachment)} alt="My submission" className="max-h-32 rounded border border-amber-200" />
                                    </a>
                                  )}
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

                              {/* Submit homework section for assigned homework */}
                              {hw.status === "assigned" && (
                                <div className="mt-4 space-y-3">
                                  <div
                                    className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                                      studentAttachmentUploading === hw.id
                                        ? "border-emerald-400 bg-emerald-50"
                                        : "border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/30"
                                    }`}
                                    onClick={() => {
                                      if (studentAttachmentUploading === hw.id) return;
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*,.pdf';
                                      input.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (!file) return;
                                        setStudentAttachmentUploading(hw.id);
                                        try {
                                          const formData = new FormData();
                                          formData.append('file', file);
                                          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' });
                                          if (uploadRes.ok) {
                                            const data = await uploadRes.json();
                                            // Save attachment and submit
                                            const res = await fetch(`/api/homework/${hw.id}`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              credentials: "include",
                                              body: JSON.stringify({ status: "submitted", studentAttachment: data.url }),
                                            });
                                            if (res.ok && user) {
                                              const homeworkRes = await fetch(`/api/homework?studentId=${user.id}`, { credentials: "include" });
                                              if (homeworkRes.ok) {
                                                const hwData = await homeworkRes.json();
                                                setHomework(hwData.homeworks || hwData.homework || []);
                                              }
                                            }
                                          }
                                        } catch { /* silently fail */ }
                                        finally { setStudentAttachmentUploading(null); }
                                      };
                                      input.click();
                                    }}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-50'); }}
                                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50'); }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-50');
                                      if (studentAttachmentUploading === hw.id) return;
                                      const file = e.dataTransfer.files?.[0];
                                      if (!file) return;
                                      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return;
                                      setStudentAttachmentUploading(hw.id);
                                      const formData = new FormData();
                                      formData.append('file', file);
                                      fetch('/api/upload', { method: 'POST', body: formData, credentials: 'include' })
                                        .then((res) => res.ok ? res.json() : null)
                                        .then(async (data) => {
                                          if (data?.url) {
                                            const res = await fetch(`/api/homework/${hw.id}`, {
                                              method: "PATCH",
                                              headers: { "Content-Type": "application/json" },
                                              credentials: "include",
                                              body: JSON.stringify({ status: "submitted", studentAttachment: data.url }),
                                            });
                                            if (res.ok && user) {
                                              const homeworkRes = await fetch(`/api/homework?studentId=${user.id}`, { credentials: "include" });
                                              if (homeworkRes.ok) {
                                                const hwData = await homeworkRes.json();
                                                setHomework(hwData.homeworks || hwData.homework || []);
                                              }
                                            }
                                          }
                                        })
                                        .catch(() => {})
                                        .finally(() => setStudentAttachmentUploading(null));
                                    }}
                                  >
                                    {studentAttachmentUploading === hw.id ? (
                                      <div className="flex flex-col items-center gap-2 py-3">
                                        <Loader2 className="size-8 animate-spin text-emerald-600" />
                                        <p className="text-sm font-medium text-emerald-700">{t("uploading", language)}</p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-2 py-1">
                                        <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <ImageIcon className="size-5 text-emerald-600" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">{t("dropImageHere", language)}</p>
                                        <p className="text-xs text-emerald-600 hover:text-emerald-700 underline">{t("orClickToUpload", language)}</p>
                                        <p className="text-[11px] text-slate-400">{t("supportedFormats", language)}</p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                                      disabled={submittingHomeworkId === hw.id}
                                      onClick={async () => {
                                        setSubmittingHomeworkId(hw.id);
                                        try {
                                          const res = await fetch(`/api/homework/${hw.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            credentials: "include",
                                            body: JSON.stringify({ status: "submitted" }),
                                          });
                                          if (res.ok && user) {
                                            const homeworkRes = await fetch(`/api/homework?studentId=${user.id}`, { credentials: "include" });
                                            if (homeworkRes.ok) {
                                              const data = await homeworkRes.json();
                                              setHomework(data.homeworks || data.homework || []);
                                            }
                                          }
                                        } catch {
                                          // silently fail
                                        } finally {
                                          setSubmittingHomeworkId(null);
                                        }
                                      }}
                                    >
                                      {submittingHomeworkId === hw.id ? (
                                        <Loader2 className="size-4 animate-spin mr-1" />
                                      ) : (
                                        <CheckCircle2 className="size-4 mr-1" />
                                      )}
                                      {t("submitHomework", language)}
                                    </Button>
                                  </div>
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

      {/* Reschedule Dialog */}
      <Dialog
        open={rescheduleBookingId !== null}
        onOpenChange={(open) => {
          if (!open) setRescheduleBookingId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rescheduleTitle", language)}</DialogTitle>
            <DialogDescription>
              {language === "en"
                ? "Choose a new date and time for your lesson."
                : "Wählen Sie ein neues Datum und eine neue Uhrzeit für Ihre Unterrichtsstunde."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("selectNewDate", language)}</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("selectNewTime", language)}</Label>
              <Input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRescheduleBookingId(null)}
              disabled={rescheduleLoading}
            >
              {t("cancel", language)}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmReschedule}
              disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
            >
              {rescheduleLoading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              {t("confirm", language)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
