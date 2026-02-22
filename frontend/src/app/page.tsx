"use client";

/**
 * BoardyBoo — Landing Page
 * AI Whiteboard Tutor
 */

import "./landing.css";
import { useEffect, useState } from "react";
import Link from "next/link";

// ── SVG Icon Components ───────────────────────────────────────────────────────

const IconMic = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);

const IconPen = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const IconBrain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

const IconCloud = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const IconEye = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IconPlay = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"></circle>
    <line x1="12" y1="1" x2="12" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="23"></line>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
    <line x1="1" y1="12" x2="3" y2="12"></line>
    <line x1="21" y1="12" x2="23" y2="12"></line>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
  </svg>
);

const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
  </svg>
);

const IconGithub = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const IconWaveform = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 12h2M6 8v8M10 4v16M14 9v6M18 7v10M22 12h-2" />
  </svg>
);

const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Animated whiteboard preview ───────────────────────────────────────────────

const SLIDES = [
  {
    subject: "Algebra",
    rows: [
      { type: "label", text: "Problem", delay: 0 },
      { type: "equation", text: "x² + 3x + 2 = 0", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Step 1 — Factor", delay: 1000 },
      { type: "step", text: "(x + 1)(x + 2) = 0", delay: 1500 },
      { type: "label", text: "Step 2 — Solve for x", delay: 2100 },
      { type: "answer", text: "x = -1  or  x = -2", delay: 2600 },
      { type: "correct", text: "Correct", delay: 3300 },
    ],
  },
  {
    subject: "Chemistry",
    rows: [
      { type: "label", text: "Balancing Equation", delay: 0 },
      { type: "equation", text: "H₂ + O₂ → H₂O", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Step 1 — Count atoms", delay: 1000 },
      { type: "step", text: "Left: 2H, 2O  vs  Right: 2H, 1O", delay: 1500 },
      { type: "label", text: "Step 2 — Balance", delay: 2100 },
      { type: "answer", text: "2H₂ + O₂ → 2H₂O", delay: 2600 },
      { type: "correct", text: "Balanced", delay: 3300 },
    ],
  },
  {
    subject: "Geometry",
    rows: [
      { type: "label", text: "Pythagoras Theorem", delay: 0 },
      { type: "equation", text: "a² + b² = c²", delay: 400 },
      { type: "divider", text: "", delay: 800 },
      { type: "label", text: "Given: a = 3, b = 4", delay: 1000 },
      { type: "step", text: "3² + 4² = 9 + 16 = 25", delay: 1500 },
      { type: "label", text: "Therefore", delay: 2100 },
      { type: "answer", text: "c = √25 = 5", delay: 2600 },
      { type: "correct", text: "Verified", delay: 3300 },
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
    return () => { timers.forEach(clearTimeout); clearTimeout(next); };
  }, [slideIdx]);

  const slide = SLIDES[slideIdx];

  return (
    <div className="wb-preview">
      {/* macOS bar */}
      <div className="wb-titlebar">
        <div className="wb-dots-row">
          <span className="wb-dot red" />
          <span className="wb-dot yellow" />
          <span className="wb-dot green" />
        </div>
        <div className="wb-subject-pill">
          <IconPen /> {slide.subject}
        </div>
        <div className="wb-mic-pill">
          <IconMic />
          <div className="wb-waves"><span /><span /><span /><span /></div>
        </div>
      </div>

      {/* Canvas */}
      <div className="wb-canvas">
        {slide.rows.map((row, i) =>
          visibleRows.includes(i) ? (
            <div key={`${slideIdx}-${i}`} className={`wb-row wb-row-${row.type} wb-appear`}>
              {row.type === "correct" ? (
                <span className="wb-correct-pill"><IconCheck />{row.text}</span>
              ) : row.text}
            </div>
          ) : null
        )}
        <span className="wb-cursor" />
      </div>

      {/* Slide dots */}
      <div className="wb-slide-dots">
        {SLIDES.map((_, i) => (
          <span key={i} className={`wb-slide-dot ${i === slideIdx ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: IconMic,
    title: "Just Speak",
    desc: "No typing needed. Talk to BoardyBoo exactly as you would a human tutor — it hears you, understands you, and responds instantly.",
    color: "var(--primary)",
    glow: "rgba(67,97,238,0.10)",
  },
  {
    Icon: IconWaveform,
    title: "Watch It Draw",
    desc: "BoardyBoo doesn't just talk back — it draws. Equations, diagrams, arrows, step-by-step solutions, all appearing live on the whiteboard as it explains.",
    color: "var(--accent)",
    glow: "rgba(247,37,133,0.10)",
  },
  {
    Icon: IconBrain,
    title: "Understands Any Subject",
    desc: "Maths, chemistry, geometry, history — ask anything. BoardyBoo adapts its explanations to whatever you need help with, right now.",
    color: "#7209b7",
    glow: "rgba(114,9,183,0.10)",
  },
  {
    Icon: IconEye,
    title: "Always Improving",
    desc: "The more you use it, the more it picks up on what you understand and what needs more work. Learning that adapts to you — not the other way around.",
    color: "var(--success)",
    glow: "rgba(6,214,160,0.10)",
  },
];

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    Icon: IconMic,
    title: "Ask anything out loud",
    desc: "Hit the mic button and ask your question naturally — the same way you'd ask a friend or teacher. No commands, no special syntax.",
  },
  {
    num: "02",
    Icon: IconBrain,
    title: "BoardyBoo listens and thinks",
    desc: "In real time, it understands what you asked, formulates an explanation, and decides exactly what to draw and how to say it.",
  },
  {
    num: "03",
    Icon: IconEye,
    title: "Watch the answer appear",
    desc: "The whiteboard fills in live — step by step, diagram by diagram — while BoardyBoo walks you through it in plain language.",
  },
];

// ── Multimodal Challenge Capabilities ──────────────────────────────────────────

const MULTIMODAL_CAPABILITIES = [
  {
    icon: <IconEye />,
    title: "See",
    desc: "Visual context. BoardyBoo can 'see' the whiteboard, understand diagrams, and read what’s written to help you better.",
    color: "#4ade80",
    glow: "rgba(74, 222, 128, 0.15)",
  },
  {
    icon: <IconWaveform />,
    title: "Hear",
    desc: "Real-time audio. No wake words, no waiting. Interrupt it, ask questions naturally, and get instant voice responses.",
    color: "#f472b6",
    glow: "rgba(244, 114, 182, 0.15)",
  },
  {
    icon: <IconMic />,
    title: "Speak",
    desc: "Natural conversations. BoardyBoo speaks back with a fluid, lifelike voice that makes learning feel like a true dialogue.",
    color: "#60a5fa",
    glow: "rgba(96, 165, 250, 0.15)",
  },
  {
    icon: <IconPen />,
    title: "Draw",
    desc: "Live visual output. It doesn't just talk, it draws equations, arrows, and step-by-step solutions right on your screen.",
    color: "#c084fc",
    glow: "rgba(192, 132, 252, 0.15)",
  }
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('boardyboo-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme as 'dark' | 'light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('boardyboo-theme', newTheme);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`land ${theme === 'light' ? 'light-mode' : ''}`}>

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className={`land-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="land-nav-inner">
          <div className="land-brand">
            <div className="land-brand-icon"><IconPen /></div>
            <span className="land-brand-name">BoardyBoo</span>
          </div>
          <div className="land-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="land-nav-actions">
            <button className="land-theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
            <Link href="/dashboard" className="land-nav-ghost">
              Dashboard
            </Link>
            <Link href="/board" className="land-nav-cta">
              Launch Whiteboard <IconArrow />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="land-hero">
        <div className="land-hero-bg">
          <div className="land-orb orb-1" />
          <div className="land-orb orb-2" />
          <div className="land-orb orb-3" />
          <div className="land-grid-overlay" />
        </div>

        <div className="land-hero-content">
          <div className="land-hero-text">
            <div className="land-hackathon-badge">
              <IconZap />
              Experience the Future of Learning
            </div>
            <h1 className="land-headline">
              The AI tutor that{" "}
              <span className="land-gradient-text">sees, hears, and draws</span>{" "}
              while it teaches
            </h1>
            <p className="land-sub">
              Ask any question out loud — BoardyBoo listens, understands, and
              draws the answer live on a shared whiteboard. No typing. No waiting.
              Just learning, in real time.
            </p>
            <div className="land-cta-group">
              <Link href="/dashboard" className="land-btn-primary">
                <IconPlay />
                <span>Explore the Platform</span>
              </Link>
              <Link href="/board" className="land-btn-ghost">
                <IconPen />
                <span>Open Whiteboard</span>
              </Link>
            </div>

            {/* Capability pills */}
            <div className="land-pills">
              {["Real-time voice", "Live whiteboard", "No sign-up needed", "Works on any subject"].map((p) => (
                <span className="land-pill" key={p}>
                  <IconCheck /> {p}
                </span>
              ))}
            </div>
          </div>

          <div className="land-hero-visual">
            <AnimatedWhiteboard />
            <div className="land-hero-glow" />
          </div>
        </div>

        <div className="land-scroll-hint">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          Scroll to explore
        </div>
      </section>



      {/* ── Multimodal ───────────────────────────────────────── */}
      <section className="land-section land-section-dark" id="multimodal">
        <div className="land-section-inner">
          <div className="land-section-label">Beyond the text box</div>
          <h2 className="land-section-title">See, Hear, Speak, Draw.</h2>
          <p className="land-section-sub">
            Built for the <strong>future of education</strong>. BoardyBoo leverages the power of multimodal AI to create an immersive, real-time learning experience that moves completely beyond simple chat interfaces.
          </p>

          <div className="land-multimodal-grid">
            {MULTIMODAL_CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="land-mm-card"
                style={{ "--card-glow": cap.glow } as React.CSSProperties}
              >
                <div className="land-mm-icon-wrap" style={{ color: cap.color }}>
                  {cap.icon}
                </div>
                <h3>{cap.title}</h3>
                <p>{cap.desc}</p>
              </div>
            ))}
          </div>

          <div className="land-challenge-banner">
            <div className="land-challenge-text">
              <h3>Powered by Advanced Multimodal AI 🔮</h3>
              <p>Experience real-time voice interactions seamlessly synchronized with dynamic visual whiteboard explanations.</p>
            </div>
            <div className="land-challenge-badge">
              Built for Students
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="land-section" id="features">
        <div className="land-section-inner">
          <div className="land-section-label">What makes it different</div>
          <h2 className="land-section-title">Learning that feels alive</h2>
          <p className="land-section-sub">
            No more reading walls of text or watching static videos.
            BoardyBoo responds the way a great tutor would — visually, in real time, just for you.
          </p>
          <div className="land-features-grid">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="land-feature-card"
                style={{ "--card-glow": f.glow, "--card-color": f.color } as React.CSSProperties}
              >
                <div
                  className="land-feature-icon"
                  style={{ background: f.glow, color: f.color }}
                >
                  <f.Icon />
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
          <div className="land-section-label label-light">How it works</div>
          <h2 className="land-section-title title-light">From spoken question to drawn answer</h2>
          <div className="land-steps">
            {STEPS.map((step, idx) => (
              <div className="land-step" key={step.num}>
                <div className="land-step-icon">
                  <step.Icon />
                </div>
                <div className="land-step-num">{step.num}</div>
                <div className="land-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="land-step-arrow">
                    <IconArrow />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="land-cta-banner">
        <div className="land-cta-banner-glow" />
        <div className="land-cta-banner-inner">
          <div className="land-cta-icon-ring"><IconMic /></div>
          <h2>Ready to see it in action?</h2>
          <p>
            Open the live whiteboard, ask any question out loud, and watch
            BoardyBoo draw the answer — no setup, no sign-up.
          </p>
          <div className="land-cta-actions">
            <Link href="/dashboard" className="land-btn-primary land-btn-large">
              <IconPlay /> Explore the Platform
            </Link>
            <Link href="/board" className="land-btn-outline land-btn-large">
              <IconPen /> Open Whiteboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="land-footer">
        <div className="land-footer-inner">
          <div className="land-brand">
            <div className="land-brand-icon sm"><IconPen /></div>
            <span className="land-brand-name">BoardyBoo</span>
          </div>
          <p className="land-footer-copy">
            Built for Students Everywhere &mdash; &copy; {new Date().getFullYear()}
          </p>
          <a
            href="https://github.com/HamaRegaya/BoardyBoo"
            target="_blank"
            rel="noopener noreferrer"
            className="land-footer-link"
          >
            <IconGithub />
          </a>
        </div>
      </footer>
    </div>
  );
}
