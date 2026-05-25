"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, ExternalLink, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string | null;
  bookingId: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { language, user } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "default">("default");
  const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = Notification.permission;
      // Use a microtask to avoid synchronous setState in effect
      queueMicrotask(() => setBrowserPermission(perm));
    }
  }, []);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications?limit=20", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  };

  // Load on mount and periodically
  useEffect(() => {
    let cancelled = false;
    const doLoad = async () => {
      if (!user || cancelled) return;
      try {
        const res = await fetch("/api/notifications?limit=20", { credentials: "include" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silently fail
      }
    };
    doLoad();
    const interval = setInterval(doLoad, 60000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Class reminder system - check every 2 minutes for upcoming bookings
  useEffect(() => {
    if (!user || !remindersEnabled) return;

    const checkReminders = async () => {
      try {
        // Check for upcoming bookings and create reminder notifications
        const res = await fetch("/api/notifications/reminders", {
          method: "POST",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.remindersCreated > 0) {
            // Reload notifications to show new reminders
            await loadNotifications();

            // Send browser notification for each new reminder
            if ("Notification" in window && Notification.permission === "granted") {
              // Find the newest unread reminders
              const newNotifs = await fetch("/api/notifications?unreadOnly=true&limit=5", {
                credentials: "include",
              });
              if (newNotifs.ok) {
                const notifData = await newNotifs.json();
                const reminderNotifs = (notifData.notifications || []).filter(
                  (n: Notification) => n.type === "reminder"
                );
                for (const notif of reminderNotifs) {
                  new Notification(notif.title, {
                    body: notif.message,
                    icon: "/tina-avatar.jpg",
                    tag: notif.id,
                  });
                }
              }
            }
          }
        }
      } catch {
        // silently fail
      }
    };

    // Check immediately
    checkReminders();
    // Then check every 2 minutes
    reminderIntervalRef.current = setInterval(checkReminders, 120000);

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [user, remindersEnabled]);

  // Enable reminders
  const handleEnableReminders = async () => {
    // Request browser notification permission
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission !== "granted") {
        return; // User denied
      }
    }

    setRemindersEnabled(true);
  };

  // Mark notification as read
  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silently fail
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // silently fail
    }
  };

  // Delete notification
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch {
      // silently fail
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkRead(notification.id);
    }
    // Open action URL if available
    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return t("notificationJustNow", language);
    if (diffMinutes < 60) {
      return t("notificationMinutesAgo", language).replace("{minutes}", String(diffMinutes));
    }
    if (diffHours < 24) {
      return t("notificationHoursAgo", language).replace("{hours}", String(diffHours));
    }
    return date.toLocaleDateString(language === "de" ? "de-DE" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return "🔔";
      case "booking":
        return "📅";
      case "approval":
        return "✅";
      default:
        return "ℹ️";
    }
  };

  // Get action button label based on type
  const getActionButtonLabel = (notification: Notification) => {
    if (notification.actionUrl?.includes("wa.me")) {
      return t("notificationWhatsApp", language);
    }
    if (notification.actionUrl?.includes("meet.google.com")) {
      return t("notificationJoinClass", language);
    }
    return t("notificationViewBooking", language);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-600 hover:text-emerald-600"
          onClick={() => {
            if (!open) loadNotifications();
          }}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm text-slate-900">
            {t("notificationsTitle", language)}
          </h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-500 hover:text-emerald-600"
                onClick={handleMarkAllRead}
              >
                <Check className="size-3 mr-1" />
                {t("notificationMarkAllRead", language)}
              </Button>
            )}
          </div>
        </div>

        {/* Reminder toggle */}
        {!remindersEnabled && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <span className="text-lg">🔔</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {t("notificationEnableReminders", language)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("notificationRemindersDesc", language)}
                </p>
                {browserPermission !== "granted" && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t("notificationAllowBrowserDesc", language)}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 shrink-0"
                onClick={handleEnableReminders}
              >
                {browserPermission !== "granted"
                  ? t("notificationAllowBrowser", language)
                  : t("notificationEnableReminders", language)}
              </Button>
            </div>
          </div>
        )}

        {remindersEnabled && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <span>🔔</span>
              {t("notificationEnabled", language)}
            </div>
          </div>
        )}

        {/* Notifications list */}
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-emerald-600" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <Bell className="size-8" />
              <p className="text-sm">{t("notificationNoUnread", language)}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !notification.isRead ? "bg-emerald-50/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5 shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notification.isRead ? "font-semibold text-slate-900" : "font-medium text-slate-700"}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-slate-400">
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                        {notification.actionUrl && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 hover:text-emerald-700">
                            {notification.actionUrl.includes("wa.me") ? (
                              <MessageCircle className="size-2.5" />
                            ) : (
                              <ExternalLink className="size-2.5" />
                            )}
                            {getActionButtonLabel(notification)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-300 hover:text-red-500 shrink-0"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
