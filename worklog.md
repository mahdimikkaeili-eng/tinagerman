---
Task ID: 2
Agent: main
Task: Implement Trial Booking Flow - Register first, then auto-redirect to WhatsApp

Work Log:
- Added `pendingAction` state to Zustand store (src/store/app-store.ts)
- Modified auth-modal.tsx to execute pending action after login/signup (executePendingAction function)
- Updated hero-section.tsx to set pendingAction("whatsapp-trial") before opening signup modal
- Updated pricing-section.tsx to set pendingAction("whatsapp-trial") or pendingAction("whatsapp-lesson") before opening signup modal

Stage Summary:
- After clicking "Book Free Trial" or "Book a Lesson", unauthenticated users are shown the signup modal
- After successful registration/login, users are automatically redirected to WhatsApp with a pre-filled message
- No need to click the button again after registering
- Both login and signup flows support the pending action mechanism

---
Task ID: 4-a
Agent: main
Task: Create Notification API routes for class reminder system

Work Log:
- Added `Notification` model to Prisma schema with fields: userId, title, message, type, isRead, actionUrl, bookingId
- Added `notifications` relation to User model
- Ran `bun run db:push` to sync database
- Created /api/notifications/route.ts (GET + POST)
- Created /api/notifications/[id]/route.ts (PATCH + DELETE)
- Created /api/notifications/read-all/route.ts (PATCH)
- Created /api/notifications/reminders/route.ts (POST - checks upcoming bookings within 30 min window)
- Added notification creation to booking creation (POST /api/bookings)
- Added notification creation when teacher confirms/cancels/completes booking (PATCH /api/teacher/bookings/[id])
- Added notification creation when teacher approves a testimonial (PATCH /api/testimonials/[id])

Stage Summary:
- Complete notification API with CRUD operations
- Class reminder system that checks for bookings within 30 minutes
- Automatic notifications created for booking events and testimonial approvals
- Vienna timezone handling for reminder calculations

---
Task ID: 4-b
Agent: main
Task: Create Notification Bell UI component + browser notification support

Work Log:
- Created src/components/notification-bell.tsx with full UI
- Added NotificationBell to student dashboard header
- Added NotificationBell to teacher dashboard header
- Browser Notification API integration for 30-min class reminders
- Reminder system checks every 2 minutes for upcoming bookings
- In-app notification panel with read/unread states, mark all read, delete
- Action URLs (WhatsApp link, Meet link) shown on notifications
- Time-ago formatting for notification timestamps
- Reminder enable/disable toggle with browser permission request

Stage Summary:
- Notification bell with unread count badge in both dashboards
- Click to open popover with notification list
- Browser notifications for class reminders (requires user permission)
- Auto-refresh every 60 seconds for notification list
- Reminder check every 2 minutes when enabled
- Supports EN/DE bilingual messages

---
Task ID: 5
Agent: main
Task: Add i18n translations for notification features

Work Log:
- Added 17 new translation keys to both EN and DE in src/lib/i18n.ts
- Keys include: notificationsTitle, notificationReminder, notificationReminderMessage, notificationBookingConfirmed, notificationBookingCancelled, notificationNoUnread, notificationMarkAllRead, notificationEnableReminders, notificationRemindersDesc, notificationEnabled, notificationDisabled, notificationAllowBrowser, notificationAllowBrowserDesc, notificationWhatsApp, notificationJoinClass, notificationViewBooking, notificationMinutesAgo, notificationHoursAgo, notificationJustNow

Stage Summary:
- All notification UI elements are fully bilingual (EN/DE)

---
Task ID: 2
Agent: main
Task: Improve trial booking flow UX — show toast before WhatsApp redirect

Work Log:
- Added 6 new i18n translation keys for WhatsApp redirect messages (EN + DE) in src/lib/i18n.ts:
  - trialRedirectTitle, trialRedirectMessage (after registration/login for trial)
  - trialRedirectAuthTitle, trialRedirectAuthMessage (for already-authenticated users clicking trial)
  - lessonRedirectTitle, lessonRedirectMessage (after registration/login for regular lesson)
- Modified executePendingAction() in src/components/auth-modal.tsx:
  - Added `import { toast } from "sonner"`
  - Now shows a success toast with descriptive message before WhatsApp redirect
  - Added 1500ms delay between toast and window.open so user can read the notification
  - Toast duration set to 4000ms for readability
  - Applied to both "whatsapp-trial" and "whatsapp-lesson" action paths
- Modified handleBookTrial() in src/components/hero-section.tsx:
  - Added `import { toast } from "sonner"`
  - For authenticated users, now shows a success toast before redirecting to WhatsApp
  - Added 1500ms delay between toast and window.open
  - Uses trialRedirectAuthTitle/trialRedirectAuthMessage i18n keys

Stage Summary:
- Users now see a clear toast notification explaining the redirect before WhatsApp opens
- Two distinct toast messages: one for post-registration (celebratory "Registration Successful!") and one for already-logged-in users ("Opening WhatsApp")
- Both EN and DE translations provided for all new messages
- Lint passes cleanly, no build errors

---
Task ID: 1
Agent: main
Task: Add sample testimonials to seed data so testimonials section shows real-looking data

Work Log:
- Read existing seed route at /src/app/api/seed/route.ts — only had teacher + courses, no students or testimonials
- Added `DELETE FROM Testimonial` to the force cleanup section (before User deletion) to respect foreign key constraints
- Created 4 sample student users: Sarah Johnson (en/B1), Marcos Rivera (es/A2), Emily Chen (en/A1), Yuki Tanaka (ja/B2)
- Created 4 approved testimonials (isApproved: true) with ratings 4-5 and realistic comments about learning German with Tina
- Added students and testimonials to the seed response JSON for confirmation
- Ran lint — passes cleanly
- Ran direct database seeding via tsx script — all 4 students created, 4 approved testimonials confirmed in database

Stage Summary:
- Seed route now creates 4 student users and 4 approved testimonials after courses
- Testimonials have ratings of 4-5 stars with realistic English comments about learning German
- All testimonials are immediately visible (isApproved: true)
- Force cleanup properly deletes Testimonial records before User records
- Database confirmed populated with 4 approved testimonials

---
Task ID: 3
Agent: main
Task: Create server-side cron endpoint for automatic class reminders + Telegram Bot API integration

Work Log:
- Added `telegramChatId String?` field to User model in prisma/schema.prisma
- Ran `bun run db:push` to sync database with new schema
- Created /src/lib/telegram.ts — Telegram Bot API helper with functions:
  - sendTelegramMessage(chatId, text) — sends HTML-formatted messages via Bot API
  - setTelegramWebhook(webhookUrl) — registers webhook URL with Telegram
  - getTelegramBotInfo() — verifies bot token and retrieves username
  - deleteTelegramWebhook() — removes webhook (for switching to polling mode)
  - All functions use TELEGRAM_BOT_TOKEN env variable
- Created /src/lib/notifications.ts — shared notification service with:
  - createInAppNotification(userId, title, message, type, actionUrl?, bookingId?) — creates DB notification
  - sendClassReminder(booking, user) — creates in-app notification + Telegram message + WhatsApp link
  - generateWhatsAppReminderLink(user, booking) — generates wa.me link with pre-filled message
  - findUpcomingBookings(withinMinutes) — finds all bookings within a time window across all users
  - reminderExists(userId, bookingId) — deduplication check
  - Timezone helper functions (getTimezoneOffset, formatDate, getMinutesUntilBooking, getViennaNow)
- Created /src/app/api/cron/reminders/route.ts — server-side cron endpoint:
  - Accepts GET requests (easy to call via curl/cron-job.org)
  - Protected by CRON_SECRET query parameter
  - Finds all bookings within 30 minutes from now (pending/confirmed)
  - For each booking: creates in-app notification, sends Telegram message, generates WhatsApp link
  - Deduplicates (skips bookings that already have reminders)
  - Returns detailed summary with per-booking status
- Created /src/app/api/telegram/webhook/route.ts — Telegram webhook handler:
  - /start — welcome message with connection instructions
  - /connect email@example.com — links Telegram chatId to website user account
  - /help — shows available commands
  - /status — shows connection status and upcoming lesson count
  - Handles unknown messages gracefully
  - Always returns 200 to Telegram (per their API requirements)
- Created /src/app/api/telegram/setup/route.ts — webhook setup endpoint:
  - POST — sets the Telegram webhook URL (protected by CRON_SECRET)
  - GET — checks bot setup status (protected by CRON_SECRET)
  - DELETE — removes the Telegram webhook (protected by CRON_SECRET)
  - Validates bot token before setting webhook
- Updated i18n translations in /src/lib/i18n.ts:
  - Added 3 new keys for both EN and DE:
    - telegramConnect: "Connect Telegram" / "Mit Telegram verbinden"
    - telegramConnectDesc: "Get class reminders on Telegram" / "Erhalten Sie Unterrichtserinnerungen auf Telegram"
    - telegramBotStart: "Start our Telegram bot to receive class reminders" / "Starten Sie unseren Telegram-Bot, um Unterrichtserinnerungen zu erhalten"
- Ran lint — passes cleanly with no errors

Stage Summary:
- Complete server-side cron reminder system that works without the browser being open
- Full Telegram Bot API integration with webhook handling
- Users can connect their Telegram accounts via /connect command
- Automatic reminders sent via both in-app notifications and Telegram
- WhatsApp fallback links generated for each reminder
- All timezone handling uses Europe/Vienna properly
- Deduplication prevents duplicate reminders for the same booking
- All new API endpoints protected by CRON_SECRET
