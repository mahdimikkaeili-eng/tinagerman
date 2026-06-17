"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const WALLET = "0x535735907CB7FBE21Ac54eAf1Dab5a8B33a0121A";
const NETWORK = "BEP20 (BSC)";

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const [step, setStep] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => {
        setIsLoggedIn(res.ok);
        setAuthChecked(true);
        if (!res.ok) {
          router.push("/");
        }
      })
      .catch(() => { setAuthChecked(true); setIsLoggedIn(false); router.push("/"); });
  }, [router]);
  const [amount, setAmount] = useState<string>("");
  const [amountConfirmed, setAmountConfirmed] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setScreenshot(data.url);
        setStep(4);
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!bookingId || !screenshot) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, screenshotUrl: screenshot, amount: parseFloat(amount) || 0 }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(WALLET);
    alert("Wallet address copied!");
  };
  const copyAmount = () => {
    navigator.clipboard.writeText(amount);
    alert("Amount copied!");
  };

  if (!authChecked) {
    return (
      <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#666" }}>Loading...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</div>
        <h1 style={{ color: "#16a34a", fontSize: "1.5rem", fontWeight: "600" }}>Payment Submitted!</h1>
        <p style={{ color: "#666", marginTop: "0.75rem", lineHeight: "1.6" }}>
          Tina will verify your payment and confirm your lesson within a few hours.
          You will receive a notification when confirmed.
        </p>
        <p style={{ marginTop: "1rem", color: "#666" }}>
          Questions? Contact Tina on{" "}
          <a href="https://wa.me/4367763401913" style={{ color: "#16a34a" }}>WhatsApp</a>
          {" "}or{" "}
          <a href="tg://resolve?domain=Deutschmittintin" style={{ color: "#16a34a" }}>Telegram</a>
        </p>
        <button
          onClick={() => router.push("/")}
          style={{ marginTop: "1.5rem", background: "#16a34a", color: "white", border: "none", padding: "0.75rem 2rem", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "2rem auto", padding: "1.5rem", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#16a34a", textDecoration: "none", fontSize: "14px" }}>← Back</a>
      <h1 style={{ fontSize: "1.75rem", fontWeight: "600", marginTop: "1rem", marginBottom: "0.25rem" }}>
        Pay with USDT
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Follow these 4 simple steps to complete your payment
      </p>

      {/* Progress */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "2rem" }}>
        {[1,2,3,4].map(n => (
          <div key={n} style={{
            flex: 1, height: "4px", borderRadius: "2px",
            background: step >= n ? "#16a34a" : "#e5e7eb"
          }} />
        ))}
      </div>

      {/* Step 1 */}
      <div style={{ border: step === 1 ? "2px solid #16a34a" : "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step > 1 ? "#16a34a" : "#f0fdf4", border: "2px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: step > 1 ? "white" : "#16a34a", fontWeight: "600", flexShrink: 0 }}>
            {step > 1 ? "✓" : "1"}
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Open your crypto wallet</h2>
        </div>
        {step === 1 && (
          <div>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.6", marginBottom: "1rem" }}>
              You need a crypto wallet app that supports USDT on BEP20 network.
              Popular options: <strong>Trust Wallet</strong>, <strong>Binance</strong>, or <strong>MetaMask</strong>.
            </p>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
                <strong>New to crypto?</strong> Download <strong>Trust Wallet</strong> from the App Store or Google Play.
                It is free, easy, and safe. You only need USDT (BEP20) tokens.
              </p>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "14px", color: "#555", marginBottom: "0.5rem" }}>
                <strong>How much USDT should you send?</strong><br />
                Enter the amount you agreed with Tina:
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 10"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ flex: 1, padding: "0.6rem 1rem", border: "1px solid #d1fae5", borderRadius: "8px", fontSize: "1rem", outline: "none" }}
                />
                <span style={{ fontWeight: "600", color: "#16a34a" }}>USDT</span>
              </div>
            </div>
            <button
              onClick={() => { if (parseFloat(amount) > 0) setStep(2); }}
              disabled={!amount || parseFloat(amount) <= 0}
              style={{ background: !amount || parseFloat(amount) <= 0 ? "#86efac" : "#16a34a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: !amount || parseFloat(amount) <= 0 ? "not-allowed" : "pointer", fontSize: "1rem", width: "100%" }}>
              I have a wallet → Next
            </button>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div style={{ border: step === 2 ? "2px solid #16a34a" : "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem", opacity: step < 2 ? 0.5 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step > 2 ? "#16a34a" : step === 2 ? "#f0fdf4" : "#f9fafb", border: "2px solid", borderColor: step >= 2 ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: step > 2 ? "white" : step === 2 ? "#16a34a" : "#999", fontWeight: "600", flexShrink: 0 }}>
            {step > 2 ? "✓" : "2"}
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Send exactly {amount} USDT</h2>
        </div>
        {step === 2 && (
          <div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#9a3412" }}>
                <strong>Important:</strong> Only send USDT on the <strong>BEP20 (BSC) network</strong>.
                Sending on the wrong network will result in permanent loss of funds.
              </p>
            </div>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "0.75rem" }}>
              Send to this wallet address:
            </p>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontFamily: "monospace", fontSize: "13px", wordBreak: "break-all", margin: "0 0 0.75rem 0", color: "#1a1a1a" }}>
                {WALLET}
              </p>
              <button onClick={copyWallet} style={{ background: "white", border: "1px solid #16a34a", color: "#16a34a", padding: "0.5rem 1rem", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>
                Copy Address
              </button>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "1rem", marginBottom: "1rem", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 0.5rem 0" }}>Amount to send</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <p style={{ fontSize: "2rem", fontWeight: "700", color: "#16a34a", margin: 0 }}>{amount} USDT</p>
                <button onClick={copyAmount} style={{ background: "white", border: "1px solid #16a34a", color: "#16a34a", padding: "0.25rem 0.75rem", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>Copy</button>
              </div>
              <p style={{ fontSize: "12px", color: "#15803d", margin: "0.25rem 0 0 0" }}>Network: {NETWORK}</p>
            </div>
            <button onClick={() => setStep(3)} style={{ background: "#16a34a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", width: "100%" }}>
              I sent the payment → Next
            </button>
          </div>
        )}
      </div>

      {/* Step 3 */}
      <div style={{ border: step === 3 ? "2px solid #16a34a" : "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem", opacity: step < 3 ? 0.5 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step > 3 ? "#16a34a" : step === 3 ? "#f0fdf4" : "#f9fafb", border: "2px solid", borderColor: step >= 3 ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: step > 3 ? "white" : step === 3 ? "#16a34a" : "#999", fontWeight: "600", flexShrink: 0 }}>
            {step > 3 ? "✓" : "3"}
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Take a screenshot of the transaction</h2>
        </div>
        {step === 3 && (
          <div>
            <p style={{ color: "#555", fontSize: "14px", lineHeight: "1.6", marginBottom: "1rem" }}>
              After sending, take a screenshot that shows:
            </p>
            <ul style={{ color: "#555", fontSize: "14px", lineHeight: "1.8", paddingLeft: "1.5rem", marginBottom: "1rem" }}>
              <li>The transaction hash (TX ID)</li>
              <li>The amount: <strong>{amount} USDT</strong></li>
              <li>Status: <strong>Success</strong> or <strong>Confirmed</strong></li>
            </ul>
            <div style={{ border: "2px dashed #16a34a", borderRadius: "8px", padding: "1.5rem", textAlign: "center", cursor: "pointer", background: "#f0fdf4" }}>
              <input type="file" id="screenshot" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
              <label htmlFor="screenshot" style={{ cursor: "pointer" }}>
                <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>📸</p>
                <p style={{ color: "#16a34a", fontWeight: "500", margin: 0 }}>
                  {uploading ? "Uploading..." : "Click to upload screenshot"}
                </p>
                <p style={{ color: "#666", fontSize: "12px", margin: "0.25rem 0 0 0" }}>JPG, PNG, up to 10MB</p>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Step 4 */}
      <div style={{ border: step === 4 ? "2px solid #16a34a" : "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem", marginBottom: "1rem", opacity: step < 4 ? 0.5 : 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: step === 4 ? "#f0fdf4" : "#f9fafb", border: "2px solid", borderColor: step >= 4 ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: step === 4 ? "#16a34a" : "#999", fontWeight: "600", flexShrink: 0 }}>
            4
          </div>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Confirm your payment</h2>
        </div>
        {step === 4 && screenshot && (
          <div>
            <p style={{ color: "#555", fontSize: "14px", marginBottom: "1rem" }}>
              Screenshot uploaded successfully. Click below to submit your payment for verification.
            </p>
            <div style={{ background: "#f0fdf4", borderRadius: "8px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#15803d" }}>
                ✓ Screenshot uploaded<br />
                ✓ Amount: {amount} USDT<br />
                ✓ Network: {NETWORK}
              </p>
            </div>
            {error && <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ background: submitting ? "#86efac" : "#16a34a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "8px", cursor: submitting ? "not-allowed" : "pointer", fontSize: "1rem", width: "100%" }}
            >
              {submitting ? "Submitting..." : "Submit Payment"}
            </button>
          </div>
        )}
      </div>

      <p style={{ textAlign: "center", color: "#666", fontSize: "13px", marginTop: "1.5rem" }}>
        Need help?{" "}
        <a href="https://wa.me/4367763401913" style={{ color: "#16a34a" }}>WhatsApp</a>
        {" "}or{" "}
        <a href="tg://resolve?domain=Deutschmittintin" style={{ color: "#16a34a" }}>Telegram</a>
      </p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
