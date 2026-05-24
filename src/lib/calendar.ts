/**
 * Calendar utility for generating Google Calendar links and .ics file content
 */

/**
 * Generate a Google Calendar URL that creates an event when clicked
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  location?: string;
  timezone?: string;
}): string {
  const { title, description, startDate, startTime, durationMinutes, location, timezone = "Europe/Vienna" } = params;

  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const params_ = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description,
    ctz: timezone,
  });

  if (location) {
    params_.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params_.toString()}`;
}

/**
 * Generate .ics file content for Apple Calendar / Outlook
 */
export function generateIcsContent(params: {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  durationMinutes: number;
  location?: string;
  uid: string;
  timezone?: string;
}): string {
  const { title, description, startDate, startTime, durationMinutes, location, uid, timezone = "Europe/Vienna" } = params;

  const start = new Date(`${startDate}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmtIcs = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")
      .slice(0, -1);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Deutsch mit Tina//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@tinagerman.com`,
    `DTSTART;TZID=${timezone}:${fmtIcs(start)}`,
    `DTEND;TZID=${timezone}:${fmtIcs(end)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
  ];

  if (location) {
    lines.push(`LOCATION:${escapeIcs(location)}`);
  }

  lines.push(
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}

function escapeIcs(str: string): string {
  return str.replace(/[\\;,\n]/g, (match) => {
    if (match === "\n") return "\\n";
    return `\\${match}`;
  });
}
