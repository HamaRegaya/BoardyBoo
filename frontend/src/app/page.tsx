"use client";

/**
 * BoardyBoo — Landing Page
 */

import "./landing.css";
import { useEffect, useState } from "react";

import Link from "next/link";

// ── Animated whiteboard: structured tutoring slides ──────────────────────────

const SLIDES = [
  {
    subject: "📐 Algebra",
    rows: [
      { type: "label", text: "Problem", delay: 0 },
      { type: "equation", text: "x² + 3x + 2 = 0", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Step 1 — Factor", delay: 1000 },
      { type: "step", text: "(x + 1)(x + 2) = 0", delay: 1500 },
      { type: "label", text: "Step 2 — Solve for x", delay: 2100 },
      { type: "answer", text: "x = –1  or  x = –2  ✓", delay: 2600 },
      { type: "praise", text: "Great work! 🎉", delay: 3300 },
    ],
  },
  {
    subject: "⚗️ Chemistry",
    rows: [
      { type: "label", text: "Balancing Equation", delay: 0 },
      { type: "equation", text: "H₂ + O₂ → H₂O", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Step 1 — Count atoms", delay: 1000 },
      { type: "step", text: "Left: 2H, 2O  →  Right: 2H, 1O", delay: 1500 },
      { type: "label", text: "Step 2 — Add coefficients", delay: 2100 },
      { type: "answer", text: "2H₂ + O₂ → 2H₂O  ✓", delay: 2600 },
      { type: "praise", text: "Perfect! 🧪", delay: 3300 },
    ],
  },
  {
    subject: "📐 Geometry",
    rows: [
      { type: "label", text: "Pythagoras Theorem", delay: 0 },
      { type: "equation", text: "a² + b² = c²", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Given: a = 3, b = 4", delay: 1000 },
      { type: "step", text: "3² + 4² = 9 + 16 = 25", delay: 1500 },
      { type: "label", text: "Therefore", delay: 2100 },
      { type: "answer", text: "c = √25 = 5  ✓", delay: 2600 },
      { type: "praise", text: "Excellent! 🎯", delay: 3300 },
    ],
  },
];

const SLIDE_DURATION = 5000;

function AnimatedWhiteboard() {
  const [slideIdx, setSlideIdx] = useState(0);
  const [visibleRows, setVisibleRows] = useState<number[]>([]);

  useEffect(() => {
    const slide = SLIDES[slideIdx];
    const timers = slide.rows.map((row, i) =>
      setTimeout(() => setVisibleRows((v) => [...v, i]), row.delay)
    );
    const next = setTimeout(() => {
      setVisibleRows([]);
      setSlideIdx((s) => (s + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(next);
    };
  }, [slideIdx]);

  const slide = SLIDES[slideIdx];

  return (
    <div className="wb-preview">
      {/* macOS-style title bar */}
      <div className="wb-titlebar">
        <div className="wb-dots-row">
          <span className="wb-dot red" />
          <span className="wb-dot yellow" />
          <span className="wb-dot green" />
        </div>
        <div className="wb-subject-pill">{slide.subject}</div>
        <div className="wb-mic-pill">
          <span>🎙️</span>
          <div className="wb-waves">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>

      {/* Whiteboard canvas with structured rows */}
      <div className="wb-canvas">
        {slide.rows.map((row, i) =>
          visibleRows.includes(i) ? (
            <div key={`${slideIdx}-${i}`} className={`wb-row wb-row-${row.type} wb-appear`}>
              {row.text}
            </div>
          ) : null
        )}
        {/* Blinking cursor to show AI is writing */}
        <span className="wb-cursor" />
      </div>

      {/* Slide indicator dots */}
      <div className="wb-slide-dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`wb-slide-dot ${i === slideIdx ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

// ── Feature cards ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🎙️",
    title: "Just Speak",
    desc: "Ask any question out loud. BoardyBoo hears you and instantly responds — no typing needed.",
    color: "var(--primary)",
    glow: "rgba(67,97,238,0.12)",
  },
  {
    icon: "✏️",
    title: "AI Draws It Out",
    desc: "Your tutor illustrates every explanation with diagrams, equations, and arrows on a live whiteboard.",
    color: "var(--accent)",
    glow: "rgba(247,37,133,0.12)",
  },
  {
    icon: "🧠",
    title: "Learns With You",
    desc: "BoardyBoo adapts to your pace, spots confusion, and revisits concepts until you truly get it.",
    color: "var(--success)",
    glow: "rgba(6,214,160,0.12)",
  },
];

// ── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { num: "01", title: "Start a Session", desc: "Click 'Launch BoardyBoo' and connect in one tap. No sign-up required." },
  { num: "02", title: "Ask Anything", desc: "Calculus? History? Chemistry? Just talk as you would with a human tutor." },
  { num: "03", title: "Watch it Explain", desc: "Your AI tutor draws diagrams, writes equations, and talks you through every step." },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="land">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`land-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="land-nav-inner">
          <div className="land-brand">
            <span className="land-brand-logo">🪄</span>
            <span className="land-brand-name">BoardyBoo</span>
          </div>
          <div className="land-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <Link href="/app" className="land-nav-cta">
            Launch App →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="land-hero">
        <div className="land-orb orb-1" />
        <div className="land-orb orb-2" />
        <div className="land-orb orb-3" />

        <div className="land-hero-content">
          <div className="land-hero-text">
            <span className="land-badge">✨ AI-Powered Tutoring</span>
            <h1 className="land-headline">
              Your tutor that{" "}
              <span className="land-gradient-text">draws while it teaches</span>
            </h1>
            <p className="land-sub">
              BoardyBoo is the first AI tutor with a live whiteboard. Ask a question,
              and watch your tutor illustrate the answer in real time — just like magic.
            </p>
            <div className="land-cta-group">
              <Link href="/app" className="land-btn-primary">
                <span>Try BoardyBoo Free</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <a href="#how-it-works" className="land-btn-ghost">
                See how it works
              </a>
            </div>
            <div className="land-social-proof">
              <div className="land-avatars">
                {["👧", "👦", "🧑", "👩", "🧒"].map((e, i) => (
                  <span key={i} className="land-avatar">{e}</span>
                ))}
              </div>
              <span className="land-proof-text">Loved by students exploring AI tutoring</span>
            </div>
          </div>

          <div className="land-hero-visual">
            <AnimatedWhiteboard />
          </div>
        </div>

        <div className="land-scroll-hint">
          <span>Scroll to explore</span>
          <div className="land-scroll-arrow">↓</div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="land-section" id="features">
        <div className="land-section-inner">
          <div className="land-section-label">Why BoardyBoo</div>
          <h2 className="land-section-title">Learning that feels like magic</h2>
          <p className="land-section-sub">
            Forget boring flashcards. BoardyBoo makes every concept come alive on
            a shared whiteboard — with voice, diagrams, and instant feedback.
          </p>
          <div className="land-features-grid">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="land-feature-card"
                style={{ "--card-glow": f.glow, "--card-color": f.color } as React.CSSProperties}
              >
                <div className="land-feature-icon" style={{ background: f.glow, color: f.color }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="land-section land-section-dark" id="how-it-works">
        <div className="land-section-inner">
          <div className="land-section-label label-light">Simple as 1-2-3</div>
          <h2 className="land-section-title title-light">From question to clarity in seconds</h2>
          <div className="land-steps">
            {STEPS.map((step) => (
              <div className="land-step" key={step.num}>
                <div className="land-step-num">{step.num}</div>
                <div className="land-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="land-cta-banner">
        <div className="land-cta-banner-glow" />
        <div className="land-cta-banner-inner">
          <div className="land-cta-banner-icon">🪄</div>
          <h2>Ready to experience the magic?</h2>
          <p>Open the whiteboard and ask your first question. No sign-up, no setup — just learning.</p>
          <Link href="/app" className="land-btn-primary land-btn-large">
            <span>Launch BoardyBoo Now</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-brand">
            <span className="land-brand-logo">🪄</span>
            <span className="land-brand-name">BoardyBoo</span>
          </div>
          <p className="land-footer-copy">© {new Date().getFullYear()} BoardyBoo. Built with ❤️ for curious learners.</p>
        </div>
      </footer>
    </div>
  );
}
