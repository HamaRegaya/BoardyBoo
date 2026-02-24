"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { motion } from "framer-motion";
import "@/app/landing.css";

// ── Icons ────────────────────────────────────────────────────────────────
const IconPen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await loginWithGoogle();
      // Router redirection is handled by the useEffect above once user state updates
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="land dark" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="land-orb orb-1" />
        <p style={{ color: "var(--fg-dim)", fontSize: "1.1rem" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="land dark" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Background elements */}
      <div className="land-hero-bg" style={{ position: "fixed" }}>
        <div className="land-orb orb-1" />
        <div className="land-orb orb-2" />
        <div className="land-grid-overlay" />
      </div>

      <nav className="land-nav" style={{ position: "relative", borderBottom: "none" }}>
        <div className="land-nav-inner" style={{ justifyContent: "center", paddingTop: "2rem" }}>
          <div className="land-brand">
            <div className="land-brand-icon"><IconPen /></div>
            <span className="land-brand-name">BoardyBoo</span>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, padding: "2rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: "rgba(30, 30, 30, 0.4)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "3rem",
            width: "100%",
            maxWidth: "440px",
            textAlign: "center",
            boxShadow: "0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#fff" }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--fg-dim)", marginBottom: "2.5rem", fontSize: "1.05rem", lineHeight: 1.5 }}>
            Sign in to pick up right where you left off with your AI tutor.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#ff8a8a",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                marginBottom: "1.5rem",
                fontSize: "0.95rem",
              }}
            >
              {error}
            </motion.div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="land-btn-outline"
            style={{
              width: "100%",
              height: "56px",
              justifyContent: "center",
              gap: "12px",
              fontSize: "1.05rem",
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.1)",
              opacity: isLoggingIn ? 0.7 : 1,
              cursor: isLoggingIn ? "not-allowed" : "pointer",
            }}
          >
            {isLoggingIn ? (
              <span className="wb-dot yellow" style={{ marginRight: "8px" }} />
            ) : (
              <IconGoogle />
            )}
            {isLoggingIn ? "Signing in..." : "Continue with Google"}
          </button>

          <p style={{ marginTop: "2rem", color: "var(--fg-dim)", fontSize: "0.9rem" }}>
            Don't have an account? No problem! <br/> Just sign in with Google to create one.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
