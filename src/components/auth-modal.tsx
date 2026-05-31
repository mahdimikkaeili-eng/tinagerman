"use client";

import { useState } from "react";
import { Loader2, Mail, Lock, User, Phone, Globe, GraduationCap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { t } from "@/lib/i18n";
import { toast } from "sonner";

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
  { value: "A1", label: "A1 – Beginner" },
  { value: "A2", label: "A2 – Elementary" },
  { value: "B1", label: "B1 – Intermediate" },
  { value: "B2", label: "B2 – Upper Intermediate" },
];

export function AuthModal() {
  const {
    language,
    showAuthModal,
    authMode,
    setShowAuthModal,
    setAuthMode,
    login,
    setPendingAction,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<"login" | "signup">(authMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupNativeLanguage, setSignupNativeLanguage] = useState("");
  const [signupGermanLevel, setSignupGermanLevel] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      login(data.user);
      setShowAuthModal(false);
      resetForms();

      // Execute pending action after login (e.g. WhatsApp redirect)
      executePendingAction();
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    if (!signupName || !signupEmail || !signupPassword) {
      setSignupError("Please fill in all required fields.");
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: signupEmail,
          name: signupName,
          password: signupPassword,
          phone: signupPhone || undefined,
          nativeLanguage: signupNativeLanguage || undefined,
          germanLevel: signupGermanLevel || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error || "Registration failed");
        return;
      }

      // Auto-login after signup
      login(data.user);
      setShowAuthModal(false);
      resetForms();

      // Execute pending action after signup (e.g. WhatsApp redirect)
      executePendingAction();
    } catch {
      setSignupError("Network error. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  const executePendingAction = () => {
    const action = useAppStore.getState().pendingAction;
    if (!action) return;

    // Clear the pending action first
    setPendingAction(null);

    // Small timeout to let modal close animation finish
    setTimeout(() => {
      if (action === "whatsapp-trial") {
        toast.success(t("trialRedirectTitle", language), {
          description: t("trialRedirectMessage", language),
          duration: 4000,
        });
        // Delay the redirect so the user can read the toast
        setTimeout(() => {
          const message = language === "en"
            ? "Hi Tina! I'd like to book a free trial lesson."
            : "Hallo Tina! Ich möchte eine kostenlose Probestunde buchen.";
          window.open(`https://wa.me/4367763401913?text=${encodeURIComponent(message)}`, "_blank");
        }, 1500);
      } else if (action === "whatsapp-lesson") {
        toast.success(t("lessonRedirectTitle", language), {
          description: t("lessonRedirectMessage", language),
          duration: 4000,
        });
        setTimeout(() => {
          const message = language === "en"
            ? "Hi Tina! I'd like to book a German lesson."
            : "Hallo Tina! Ich möchte eine Deutschstunde buchen.";
          window.open(`https://wa.me/4367763401913?text=${encodeURIComponent(message)}`, "_blank");
        }, 1500);
      }
    }, 300);
  };

  const resetForms = () => {
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setSignupName("");
    setSignupEmail("");
    setSignupPassword("");
    setSignupPhone("");
    setSignupNativeLanguage("");
    setSignupGermanLevel("");
    setSignupError("");
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "login" | "signup");
    setAuthMode(tab as "login" | "signup");
    setLoginError("");
    setSignupError("");
  };

  const handleOpenChange = (open: boolean) => {
    setShowAuthModal(open);
    if (!open) {
      resetForms();
    }
  };

  return (
    <Dialog open={showAuthModal} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {activeTab === "login"
              ? t("loginTitle", language)
              : t("signupTitle", language)}
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            {activeTab === "login"
              ? language === "en"
                ? "Welcome back! Log in to your account."
                : "Willkommen zurück! Melden Sie sich an."
              : language === "en"
                ? "Create an account to start learning German."
                : "Erstellen Sie ein Konto, um Deutsch zu lernen."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t("loginTitle", language)}</TabsTrigger>
            <TabsTrigger value="signup">
              {t("signupTitle", language)}
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">{t("email", language)}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loginLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">
                  {t("password", language)}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={loginLoading}
                  />
                </div>
              </div>

              {loginError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t("loading", language)}
                  </>
                ) : (
                  t("loginTitle", language)
                )}
              </Button>

              <div className="text-center text-sm text-slate-500">
                {t("noAccount", language)}{" "}
                <button
                  type="button"
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                  onClick={() => handleTabChange("signup")}
                >
                  {t("switchToSignup", language)}
                </button>
              </div>
            </form>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">
                  {t("name", language)}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={language === "en" ? "Your name" : "Ihr Name"}
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signupLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">
                  {t("email", language)}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signupLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">
                  {t("password", language)}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                    disabled={signupLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-phone">
                  {t("phone", language)}{" "}
                  <span className="text-slate-400 text-xs">
                    ({language === "en" ? "optional" : "optional"})
                  </span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+43 677 1234567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="pl-9"
                    disabled={signupLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t("nativeLanguage", language)}</Label>
                  <Select
                    value={signupNativeLanguage}
                    onValueChange={setSignupNativeLanguage}
                    disabled={signupLoading}
                  >
                    <SelectTrigger className="w-full">
                      <Globe className="size-4 mr-1 text-slate-400" />
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
                </div>

                <div className="space-y-2">
                  <Label>{t("germanLevel", language)}</Label>
                  <Select
                    value={signupGermanLevel}
                    onValueChange={setSignupGermanLevel}
                    disabled={signupLoading}
                  >
                    <SelectTrigger className="w-full">
                      <GraduationCap className="size-4 mr-1 text-slate-400" />
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
                </div>
              </div>

              {signupError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {signupError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={signupLoading}
              >
                {signupLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t("loading", language)}
                  </>
                ) : (
                  t("signupTitle", language)
                )}
              </Button>

              <div className="text-center text-sm text-slate-500">
                {t("hasAccount", language)}{" "}
                <button
                  type="button"
                  className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                  onClick={() => handleTabChange("login")}
                >
                  {t("switchToLogin", language)}
                </button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
