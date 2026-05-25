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

export default function Home() {
  const { isAuthenticated, user } = useAppStore();

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

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return (
      <>
        {user?.role === 'teacher' ? <TeacherDashboard /> : <Dashboard />}
        <AuthModal />
      </>
    );
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen flex flex-col bg-white">
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
