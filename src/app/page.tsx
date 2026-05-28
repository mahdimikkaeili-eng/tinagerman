"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TeacherSection } from "@/components/teacher-section";
import { CoursesSection } from "@/components/courses-section";
import { PricingSection } from "@/components/pricing-section";
import { PlacementTestSection } from "@/components/placement-test-section";
import { LearningResourcesSection } from "@/components/learning-resources-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { ContactSection } from "@/components/contact-section";
import { FaqSection } from "@/components/faq-section";
import { Footer } from "@/components/footer";
import { AuthModal } from "@/components/auth-modal";
import { Dashboard } from "@/components/dashboard";
import { TeacherDashboard } from "@/components/teacher-dashboard";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isAuthenticated, user, viewMode, setViewMode, language } = useAppStore();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            useAppStore.getState().login(data.user);
          }
        }
      } catch {
        // Not authenticated, stay on landing
      }
    };
    checkAuth();
  }, []);

  // If authenticated and viewMode is dashboard, show dashboard
  if (isAuthenticated && viewMode === 'dashboard') {
    return (
      <>
        {user?.role === 'teacher' ? <TeacherDashboard /> : <Dashboard />}
        <AuthModal />
      </>
    );
  }

  // If authenticated but viewing landing page, show landing with a "Back to Dashboard" button
  // If not authenticated, show normal landing page
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {isAuthenticated && (
        <div className="sticky top-0 z-50 bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-md">
          <span className="text-sm font-medium">
            {language === "en" ? "🏠 You're viewing the homepage" : "🏠 Sie sehen die Startseite"}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-emerald-700 border-white hover:bg-emerald-50 text-xs font-semibold"
            onClick={() => setViewMode('dashboard')}
          >
            {user?.role === 'teacher'
              ? (language === "en" ? "← Back to Teacher Panel" : "← Zum Lehrerpanel")
              : (language === "en" ? "← Back to My Panel" : "← Zum Dashboard")
            }
          </Button>
        </div>
      )}
      <Header />
      <main className="flex-1">
        <HeroSection />
        <TeacherSection />
        <CoursesSection />
        <PricingSection />
        <PlacementTestSection />
        <LearningResourcesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <ContactSection />
        <FaqSection />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
