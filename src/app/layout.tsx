import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

// No Google Fonts! Use system fonts for maximum compatibility with Iranian internet.
// Google Fonts (fonts.googleapis.com / fonts.gstatic.com) are blocked/slow in Iran.
// System font stack covers all platforms: macOS, Windows, Android, Linux, iOS

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
    "A2 German",
    "B1 German",
    "B2 German",
    "online German course",
    "German tutoring",
    "Deutsch mit Tina",
    "German language learning",
    "Deutschunterricht online",
    "Deutsch als Fremdsprache",
    "German placement test",
    "German grammar",
    "German vocabulary",
    "German phrases",
    "B2 exam preparation",
    "German conversation practice",
  ],
  authors: [{ name: "Deutsch mit Tina" }],
  creator: "Deutsch mit Tina",
  publisher: "Deutsch mit Tina",
  metadataBase: new URL("https://tinagerman.com"),
  alternates: {
    canonical: "https://tinagerman.com",
    languages: {
      "en": "https://tinagerman.com",
      "de": "https://tinagerman.com",
    },
  },
  icons: {
    icon: "/tina-avatar.jpg",
  },
  openGraph: {
    title: "Deutsch mit Tina — Learn German Online | A1 to B2",
    description:
      "Personalized 1-on-1 German lessons from A1 to B2. Certified teacher, free trial lesson. Start learning German today!",
    url: "https://tinagerman.com",
    siteName: "Deutsch mit Tina",
    type: "website",
    locale: "en_US",
    alternateLocale: "de_DE",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Deutsch mit Tina — Learn German Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deutsch mit Tina — Learn German Online",
    description:
      "Personalized 1-on-1 German lessons from A1 to B2. Book your free trial lesson today!",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://tinagerman.com/#organization",
        name: "Deutsch mit Tina",
        description: "Personalized 1-on-1 German lessons from A1 to B2",
        url: "https://tinagerman.com",
        logo: "https://tinagerman.com/tina-avatar.jpg",
        sameAs: [],
        address: {
          "@type": "PostalAddress",
          addressCountry: "AT",
        },
        founder: {
          "@type": "Person",
          name: "Tina",
          jobTitle: "German Language Teacher",
          knowsLanguage: ["German", "English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://tinagerman.com/#website",
        url: "https://tinagerman.com",
        name: "Deutsch mit Tina",
        description: "Learn German online with personalized 1-on-1 lessons",
        publisher: {
          "@id": "https://tinagerman.com/#organization",
        },
        inLanguage: ["en", "de"],
      },
      {
        "@type": "Course",
        name: "A1 Beginner German",
        description: "Start your German journey! Learn basic greetings, introductions, numbers, and everyday phrases.",
        provider: {
          "@id": "https://tinagerman.com/#organization",
        },
        educationalLevel: "Beginner",
        inLanguage: "de",
      },
      {
        "@type": "Course",
        name: "A2 Elementary German",
        description: "Build on your basics! Handle simple conversations, shopping, travel situations.",
        provider: {
          "@id": "https://tinagerman.com/#organization",
        },
        educationalLevel: "Elementary",
        inLanguage: "de",
      },
      {
        "@type": "Course",
        name: "B1 Intermediate German",
        description: "Express yourself confidently! Discuss experiences, plans, and opinions.",
        provider: {
          "@id": "https://tinagerman.com/#organization",
        },
        educationalLevel: "Intermediate",
        inLanguage: "de",
      },
      {
        "@type": "Course",
        name: "B2 Upper Intermediate German",
        description: "Communicate fluently! Engage in complex discussions and understand specialized texts.",
        provider: {
          "@id": "https://tinagerman.com/#organization",
        },
        educationalLevel: "UpperIntermediate",
        inLanguage: "de",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do online lessons work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "All lessons take place via Google Meet. You'll receive a link before each session. Tina uses conversation, exercises, and interactive materials.",
            },
          },
          {
            "@type": "Question",
            name: "Is there a free trial?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Your first lesson is completely free. It's a great opportunity to meet Tina and discuss your goals.",
            },
          },
          {
            "@type": "Question",
            name: "What levels do you teach?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Tina teaches all levels from A1 (complete beginner) to B2 (upper intermediate).",
            },
          },
          {
            "@type": "Question",
            name: "Can I cancel or reschedule?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can cancel or reschedule up to 24 hours before your lesson at no charge.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <meta name="google-site-verification" content="zRqwAoH2gaZrzGCpaC4KCxICoj8mPdcHHQ9vjxl8fX0" />
        <link rel="alternate" hrefLang="de" href="https://tinagerman.com" />
        <link rel="alternate" hrefLang="en" href="https://tinagerman.com" />
        <link rel="alternate" hrefLang="x-default" href="https://tinagerman.com" />
      </head>
      <body className="antialiased bg-background text-foreground" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', Arial, sans-serif" }}>
        {children}
        <Toaster />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-PJWF75ZN62"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PJWF75ZN62');
          `}
        </Script>
      </body>
    </html>
  );
}
