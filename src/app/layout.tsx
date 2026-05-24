import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deutsch mit Tina — Learn German Online | Personalized 1-on-1 Lessons A1-B2",
  description:
    "Learn German with Tina — personalized 1-on-1 German lessons from A1 to B2. Certified teacher, 200+ students, 3+ years experience. Book your free trial lesson today!",
  keywords: [
    "learn German",
    "German lessons online",
    "Deutsch lernen",
    "German teacher",
    "A1 German",
    "B2 German",
    "online German course",
    "German tutoring",
    "Deutsch mit Tina",
    "German language learning",
  ],
  authors: [{ name: "Deutsch mit Tina" }],
  icons: {
    icon: "/tina-avatar.jpg",
  },
  openGraph: {
    title: "Deutsch mit Tina — Learn German Online",
    description:
      "Personalized 1-on-1 German lessons from A1 to B2. Book your free trial lesson today!",
    url: "https://tinagerman.com",
    siteName: "Deutsch mit Tina",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deutsch mit Tina — Learn German Online",
    description:
      "Personalized 1-on-1 German lessons from A1 to B2. Book your free trial lesson today!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
