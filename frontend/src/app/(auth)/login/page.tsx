"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

/* ── Google icon ─────────────────────────────────────── */
const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { user, loading, loginWithGoogle, loginWithEmail, resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields."); return; }
    try {
      setIsLoggingIn(true);
      setError(null);
      await loginWithEmail(email, password);
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "No account with that email." :
        err.code === "auth/wrong-password" ? "Incorrect password." :
        err.code === "auth/invalid-credential" ? "Invalid email or password." :
        err.message || "Failed to sign in.";
      setError(msg);
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first, then click Forgot password."); return; }
    try {
      await resetPassword(email);
      setResetSent(true);
      setError(null);
    } catch {
      setError("Could not send reset email. Check the address.");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <p style={{ color: "#64748b", fontSize: "15px" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          borderRadius: "24px",
          padding: "48px 40px",
          boxShadow: "0 4px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
      >
        {/* Header */}
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1a1a2e", margin: "0 0 6px 0" }}>
          Sign In
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 32px 0" }}>
          New to BoardyBoo?{" "}
          <Link href="/signup" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>
            Create an account
          </Link>
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
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
            cursor: isLoggingIn ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1a1a2e",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(99,102,241,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <IconGoogle />
          Sign in with Google
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
          <span style={{ fontSize: "12px", fontWeight: 500, color: "#94a3b8", whiteSpace: "nowrap" }}>
            Or continue with email
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
        {resetSent && (
          <div style={{ background: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "10px", fontSize: "13px", marginBottom: "16px", border: "1px solid #bbf7d0" }}>
            Password reset email sent! Check your inbox.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px", display: "block" }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 14px 0 40px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#1a1a2e",
                  background: "white",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e2e8f0")}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6366f1",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={16} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  height: "46px",
                  padding: "0 42px 0 40px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#1a1a2e",
                  background: "white",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoggingIn}
            style={{
              width: "100%",
              height: "50px",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              color: "white",
              fontWeight: 700,
              fontSize: "15px",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              opacity: isLoggingIn ? 0.7 : 1,
              transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              marginTop: "4px",
            }}
            onMouseEnter={(e) => { if (!isLoggingIn) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,0.4)"; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,0.3)"; }}
          >
            {isLoggingIn ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: "12px", color: "#94a3b8", marginTop: "28px", lineHeight: 1.6 }}>
          By clicking continue, you agree to our{" "}
          <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms of Service</span>{" "}
          and <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
