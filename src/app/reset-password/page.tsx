"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [account, setAccount] = useState<{ name: string; email: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fatal, setFatal] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setFatal("This reset link is missing its token. Please ask Tina for a new one."); setChecking(false); return; }
    fetch("/api/auth/reset-password?token=" + encodeURIComponent(token))
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) { setAccount({ name: d.name, email: d.email }); }
        else { setFatal(d.error || "This link is invalid or has expired."); }
        setChecking(false);
      })
      .catch(() => { setFatal("Could not verify this link. Please try again."); setChecking(false); });
  }, [token]);

  const submit = async () => {
    setErr("");
    if (password.length < 6) { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setErr("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) { setMsg(data.message); } else { setErr(data.error || "Something went wrong"); }
    } catch { setErr("Network error. Please try again."); }
    setLoading(false);
  };

  const box = { maxWidth: "420px", margin: "4rem auto", padding: "2rem", fontFamily: "system-ui, sans-serif" };
  const input = { width: "100%", padding: "0.7rem", marginTop: "0.4rem", marginBottom: "1rem", border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "1rem", boxSizing: "border-box" as const };

  if (checking) return <div style={box}><p style={{ color: "#6b7280" }}>Checking your link...</p></div>;

  if (fatal) return (
    <div style={box}>
      <h2 style={{ marginBottom: "0.3rem" }}>Link not valid</h2>
      <p style={{ color: "#6b7280" }}>{fatal}</p>
      <a href="/" style={{ color: "#16a34a" }}>Back to Deutsch mit Tina</a>
    </div>
  );

  if (msg) return (
    <div style={box}>
      <h2 style={{ marginBottom: "0.3rem" }}>All set</h2>
      <p style={{ color: "#16a34a", fontWeight: 600 }}>{msg}</p>
      <a href="/" style={{ color: "#16a34a" }}>Go to login</a>
    </div>
  );

  return (
    <div style={box}>
      <h2 style={{ marginBottom: "0.3rem" }}>Set a new password</h2>
      <p style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: 0 }}>Deutsch mit Tina</p>
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#4b5563" }}>You are resetting the password for</p>
        <p style={{ margin: "0.2rem 0 0", fontWeight: 600, color: "#166534" }}>{account?.name}</p>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#6b7280", wordBreak: "break-all" }}>{account?.email}</p>
      </div>
      <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>New password</label>
      <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
      <label style={{ fontSize: "0.9rem", fontWeight: 500 }}>Confirm password</label>
      <input style={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
      {err && <p style={{ color: "#dc2626", fontSize: "0.9rem" }}>{err}</p>}
      <button onClick={submit} disabled={loading} style={{ width: "100%", padding: "0.75rem", background: loading ? "#86efac" : "#16a34a", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
        {loading ? "Saving..." : "Update password"}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Loading...</div>}><ResetForm /></Suspense>;
}
