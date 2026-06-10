import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Deutsch mit Tina",
  description: "Privacy Policy for Deutsch mit Tina online German lessons.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif", lineHeight: "1.7" }}>
      <Link href="/" style={{ color: "#16a34a", textDecoration: "none", fontSize: "14px" }}>
        Back to Deutsch mit Tina
      </Link>
      <h1 style={{ fontSize: "2rem", fontWeight: "600", marginTop: "1.5rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "2rem" }}>Last updated: June 7, 2026</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>1. Who We Are</h2>
      <p>Deutsch mit Tina is an online German language tutoring service operated by Tina, based in Austria. Website: https://tinagerman.com. Contact via WhatsApp (+43 677 6340 1913) or Telegram (@Deutschmittintin).</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>2. What Data We Collect</h2>
      <ul style={{ paddingLeft: "1.5rem" }}>
        <li>Account information: name, email address, password (hashed)</li>
        <li>Booking information: lesson dates, times, German level</li>
        <li>Messages: chat messages between student and teacher</li>
        <li>Usage data: pages visited, time on site (via Google Analytics)</li>
        <li>Technical data: IP address, browser type, device type</li>
      </ul>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>3. How We Use Your Data</h2>
      <ul style={{ paddingLeft: "1.5rem" }}>
        <li>To provide and manage your German lessons</li>
        <li>To send lesson reminders and notifications</li>
        <li>To communicate about your bookings</li>
        <li>To improve our website and services</li>
      </ul>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>4. Google Analytics</h2>
      <p>We use Google Analytics 4 to understand how visitors use our website. Google Analytics collects anonymized data. You can opt out via the Google Analytics Opt-out Browser Add-on at tools.google.com/dlpage/gaoptout</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>5. Data Sharing</h2>
      <p>We do not sell your personal data. We share data only with Google LLC (Analytics), Google Meet (for lessons), and Telegram (for notifications).</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>6. Your Rights (GDPR)</h2>
      <p>If you are in the European Economic Area, you have the right to access, correct, delete, or export your personal data. Contact us via WhatsApp or Telegram to exercise these rights.</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>7. Security</h2>
      <p>We use HTTPS encryption, secure password hashing, and access controls to protect your data.</p>

      <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "2rem" }}>8. Contact</h2>
      <p>WhatsApp: +43 677 6340 1913 | Telegram: @Deutschmittintin</p>

      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", marginTop: "3rem", fontSize: "13px", color: "#666" }}>
        2026 Deutsch mit Tina. All rights reserved.
      </div>
    </div>
  );
}
