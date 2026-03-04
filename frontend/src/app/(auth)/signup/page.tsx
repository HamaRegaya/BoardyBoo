"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

/* ── Google icon ───────────────────────────────────── */
const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ── Password strength helper ─────────────────────── */
function getPasswordStrength(pw: string): { label: string; color: string; pct: number } {
  if (!pw) return { label: "", color: "#e2e8f0", pct: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;

  if (score <= 1) return { label: "Weak password", color: "#ef4444", pct: 25 };
  if (score === 2) return { label: "Fair password", color: "#f59e0b", pct: 50 };
  if (score === 3) return { label: "Good password", color: "#3b82f6", pct: 75 };
  return { label: "Strong password", color: "#10b981", pct: 100 };
}

export default function SignUpPage() {
  const { user, loading, loginWithGoogle, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  const handleGoogleSignUp = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google.");
      setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!agreedTerms) { setError("Please agree to the Terms of Service."); return; }
    try {
      setIsSubmitting(true);
      setError(null);
      await signUpWithEmail(email, password, name);
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use" ? "An account with this email already exists." :
        err.code === "auth/weak-password" ? "Password is too weak." :
        err.message || "Failed to create account.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const strength = getPasswordStrength(password);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Loading…</p>
      </div>
    );
  }

  /* ── Shared input style ───── */
  const inputWrapStyle: React.CSSProperties = { position: "relative" };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "46px",
    padding: "0 42px 0 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    background: "white",
    outline: "none",
    transition: "border-color 0.2s",
  };
  const iconRight: React.CSSProperties = {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    pointerEvents: "none",
    display: "flex",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f0f0f0",
        padding: "32px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1060px",
          minHeight: "680px",
          borderRadius: "28px",
          overflow: "hidden",
          background: "white",
          boxShadow: "0 12px 48px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
      >
      {/* ── Left Panel ──────────────────────────────── */}
      <div
        style={{
          flex: "0 0 42%",
          background: "linear-gradient(160deg, #c7d2fe 0%, #e0e7ff 40%, #ddd6fe 100%)",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-40px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: "rgba(165,138,255,0.18)",
            filter: "blur(50px)",
          }}
        />

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <Sparkles size={18} />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#1e1b4b" }}>
            BoardyBoo
          </span>
        </div>

        {/* Headline */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: "#1e1b4b",
              lineHeight: 1.15,
              margin: "0 0 20px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Start your<br />magical<br />learning journey<br />today.
          </h2>
          <p style={{ fontSize: "15px", color: "#4338ca", lineHeight: 1.7, maxWidth: "340px" }}>
            🚀 Join thousands of students mastering subjects with AI. Personalized tutoring that adapts to your unique learning style.
          </p>

          {/* Avatars row */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "32px" }}>
            {["#6366f1", "#a855f7", "#f59e0b"].map((bg, i) => (
              <div
                key={i}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: bg,
                  border: "3px solid white",
                  marginLeft: i > 0 ? "-10px" : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                {["👩🏽", "👨🏻", "👩🏾"][i]}
              </div>
            ))}
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#6366f1",
                border: "3px solid white",
                marginLeft: "-10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
              }}
            >
              +2k
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e1b4b", marginLeft: "4px" }}>
              Happy Students
            </span>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: "12px", color: "#6366f1", position: "relative", zIndex: 1 }}>
          © {new Date().getFullYear()} BoardyBoo.
        </p>
      </div>

      {/* ── Right Panel (form) ─────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          background: "white",
        }}
      >
        <div
          style={{ width: "100%", maxWidth: "440px" }}
        >
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1a1a2e", margin: "0 0 6px 0" }}>
            Create Your Account
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px 0" }}>
            Enter your details below to get started for free.
          </p>

          {/* Google */}
          <button
            onClick={handleGoogleSignUp}
            disabled={isSubmitting}
            style={{
              width: "100%",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: "1.5px solid #e2e8f0",
              borderRadius: "12px",
              background: "white",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 600,
              color: "#1a1a2e",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <IconGoogle />
            Sign up with Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", letterSpacing: "1px" }}>
              OR SIGN UP WITH EMAIL
            </span>
            <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "13px",
                marginBottom: "16px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSignUp} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                Full Name
              </label>
              <div style={inputWrapStyle}>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <div style={iconRight}><User size={16} /></div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                Email
              </label>
              <div style={inputWrapStyle}>
                <input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <div style={iconRight}><Mail size={16} /></div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
                Create Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {/* Strength bar */}
              {password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ height: "4px", borderRadius: "2px", background: "#e2e8f0", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${strength.pct}%`,
                        height: "100%",
                        borderRadius: "2px",
                        background: strength.color,
                        transition: "width 0.3s, background 0.3s",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "12px", color: strength.color, margin: "4px 0 0", fontWeight: 500 }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Terms */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  accentColor: "#6366f1",
                  marginTop: "2px",
                  flexShrink: 0,
                  cursor: "pointer",
                }}
              />
              <span>
                I agree to the{" "}
                <span style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>{" "}
                and <span style={{ color: "#6366f1", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                height: "50px",
                border: "none",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                color: "white",
                fontWeight: 700,
                fontSize: "15px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.4)"; }}}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3)"; }}
            >
              {isSubmitting ? "Creating account…" : "Create My Account"}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: "center", fontSize: "14px", color: "#64748b", marginTop: "28px" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#1a1a2e", fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
      </motion.div>
    </div>
  );
}
