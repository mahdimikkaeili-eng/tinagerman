"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
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

// Lazy-load heavy components that aren't needed immediately
// Dashboard: ~1900 lines, only needed after login
const Dashboard = dynamic(
  () => import("@/components/dashboard").then((m) => ({ default: m.Dashboard })),
  { ssr: false }
);
// TeacherDashboard: ~2300 lines, only needed for teacher after login
const TeacherDashboard = dynamic(
  () => import("@/components/teacher-dashboard").then((m) => ({ default: m.TeacherDashboard })),
  { ssr: false }
);
// AuthModal: only needed when user clicks login/signup
const AuthModal = dynamic(
  () => import("@/components/auth-modal").then((m) => ({ default: m.AuthModal })),
  { ssr: false }
);

// Lazy-load below-the-fold sections to reduce initial JS bundle
const LazyTeacherSection = dynamic(() => import("@/components/teacher-section").then((m) => ({ default: m.TeacherSection })));
const LazyPricingSection = dynamic(() => import("@/components/pricing-section").then((m) => ({ default: m.PricingSection })));
const LazyPlacementTestSection = dynamic(() => import("@/components/placement-test-section").then((m) => ({ default: m.PlacementTestSection })));
const LazyLearningResourcesSection = dynamic(() => import("@/components/learning-resources-section").then((m) => ({ default: m.LearningResourcesSection })));
const LazyHowItWorksSection = dynamic(() => import("@/components/how-it-works-section").then((m) => ({ default: m.HowItWorksSection })));
const LazyTestimonialsSection = dynamic(() => import("@/components/testimonials-section").then((m) => ({ default: m.TestimonialsSection })));
const LazyContactSection = dynamic(() => import("@/components/contact-section").then((m) => ({ default: m.ContactSection })));
const LazyFaqSection = dynamic(() => import("@/components/faq-section").then((m) => ({ default: m.FaqSection })));

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

  // If authenticated but viewing landing page, show landing
  // If not authenticated, show normal landing page
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CoursesSection />
        <LazyTeacherSection />
        <LazyPricingSection />
        <LazyPlacementTestSection />
        <LazyLearningResourcesSection />
        <LazyHowItWorksSection />
        <LazyTestimonialsSection />
        <LazyContactSection />
        <LazyFaqSection />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
}
