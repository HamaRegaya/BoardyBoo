"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { DashboardSkeleton } from "@/components/Skeleton";
import { API_URL } from "@/lib/constants";
import {
    Clock,
    BookOpen,
    Trophy,
    TrendingUp,
    Play,
    Calendar,
    PenTool,
    Flame,
    BarChart3,
    Sparkles,
    Plus,
} from "lucide-react";
import axios from "axios";

/* ── Types ──────────────────────────────────────────── */

interface DashboardStats {
    total_sessions: number;
    total_hours: number;
    avg_score: number;
    subjects_covered: number;
}

interface Session {
    id: string;
    topic?: string;
    subject?: string;
    duration_minutes?: number;
    created_at?: string;
    status?: string;
}

interface ScheduledSession {
    id: string;
    title: string;
    start_time: string;
    duration_hours: number;
    subject_class?: string;
    tutor?: string;
}

interface Streak {
    current_streak: number;
    longest_streak: number;
}

interface Progress {
    id: string;
    subject: string;
    topic: string;
    mastery_level: number;
}

/* ── Component ──────────────────────────────────────── */

export default function Dashboard() {
    const { user, getToken } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [upcoming, setUpcoming] = useState<ScheduledSession[]>([]);
    const [streak, setStreak] = useState<Streak | null>(null);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;

            try {
                const token = await getToken();
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                // Single combined call for all dashboard data + optional calendar
                const [allRes, calendarRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/dashboard/all`, { headers }),
                    axios.get(`${API_URL}/api/calendar/events`, { headers }).catch(() => ({ data: { events: [] } })),
                ]);

                if (allRes.status === "fulfilled") {
                    const d = allRes.value.data;
                    setStats(d.stats);
                    setRecentSessions(d.sessions ?? []);
                    setStreak(d.streak);
                    setSuggestedTopics(d.topics ?? []);
                    setProgress(d.progress ?? []);

                    // Merge schedule + calendar events
                    const now = new Date();
                    const boardyBooSessions: ScheduledSession[] = (d.schedule ?? [])
                        .filter((s: any) => s.start_time && new Date(s.start_time) >= now);

                    const calEvents: ScheduledSession[] =
                        calendarRes.status === "fulfilled" && calendarRes.value?.data?.events
                            ? calendarRes.value.data.events
                                  .filter((e: any) => e.start && new Date(e.start) >= now)
                                  .map((e: any) => ({
                                      id: e.id || `gcal-${Math.random()}`,
                                      title: e.summary || "Google Calendar Event",
                                      start_time: e.start,
                                      duration_hours: e.start && e.end
                                          ? (new Date(e.end).getTime() - new Date(e.start).getTime()) / 3600000
                                          : 1,
                                  }))
                            : [];

                    const allIds = new Set(boardyBooSessions.map((s) => s.id));
                    const merged = [
                        ...boardyBooSessions,
                        ...calEvents.filter((e) => !allIds.has(e.id)),
                    ];
                    merged.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
                    setUpcoming(merged.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoadingData(false);
            }
        }

        fetchDashboardData();
    }, [user, getToken]);

    /* ── Helpers ───────────────────────────────────── */

    const masteryLabel = (level: number) => {
        const labels = ["", "Beginner", "Developing", "Competent", "Proficient", "Mastered"];
        return labels[level] || "Unknown";
    };

    const masteryColor = (level: number) => {
        const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"];
        return colors[level] || "#94a3b8";
    };

    /* ── Render ────────────────────────────────────── */

    if (loadingData) {
        return <DashboardSkeleton />;
    }
    const MONTH_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    const formatTime12 = (iso: string) => {
        const d = new Date(iso);
        let h = d.getHours();
        const m = d.getMinutes();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const formatDuration = (hrs: number) => {
        const mins = Math.round(hrs * 60);
        return mins >= 60 ? `${Math.round(mins / 60)}h ${mins % 60 ? `${mins % 60} min` : ""}`.trim() : `${mins} min`;
    };

    return (
        <div className="dash-content fade-in">
            {/* ── Hero Section ─────────────────────────────── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1.6fr 1fr",
                    gap: "24px",
                    marginBottom: "36px",
                }}
            >
                {/* Hero Card */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #a855f7 100%)",
                        borderRadius: "20px",
                        padding: "40px 44px",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        minHeight: "220px",
                    }}
                >
                    {/* Decorative circles */}
                    <div
                        style={{
                            position: "absolute",
                            top: "-40px",
                            right: "-40px",
                            width: "200px",
                            height: "200px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: "-60px",
                            right: "80px",
                            width: "160px",
                            height: "160px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.05)",
                        }}
                    />

                    {/* Badge */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "rgba(255,255,255,0.18)",
                            backdropFilter: "blur(8px)",
                            padding: "6px 14px",
                            borderRadius: "20px",
                            width: "fit-content",
                            marginBottom: "18px",
                        }}
                    >
                        <Sparkles size={14} color="white" />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "white", letterSpacing: "0.5px" }}>
                            AI Powered Session
                        </span>
                    </div>

                    {/* Greeting */}
                    <h1
                        style={{
                            fontSize: "32px",
                            fontWeight: 800,
                            color: "white",
                            margin: "0 0 8px 0",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Hello, {user?.displayName?.split(" ")[0] || "Student"}!
                    </h1>
                    <p
                        style={{
                            fontSize: "15px",
                            color: "rgba(255,255,255,0.85)",
                            margin: "0 0 28px 0",
                            maxWidth: "400px",
                            lineHeight: 1.6,
                        }}
                    >
                        Ready to tackle your goals today? Your personal AI tutor is prepared for the next chapter.
                    </p>

                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "12px", position: "relative", zIndex: 1 }}>
                        <Link
                            href="/board"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px 24px",
                                borderRadius: "12px",
                                background: "white",
                                color: "#6366f1",
                                fontWeight: 700,
                                fontSize: "14px",
                                textDecoration: "none",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                transition: "transform 0.2s, box-shadow 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.18)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                            }}
                        >
                            <Play size={16} fill="currentColor" />
                            Start New Session
                        </Link>
                        <Link
                            href="/schedule"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "12px 24px",
                                borderRadius: "12px",
                                background: "transparent",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "14px",
                                textDecoration: "none",
                                border: "1.5px solid rgba(255,255,255,0.4)",
                                transition: "background 0.2s, border-color 0.2s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                            }}
                        >
                            View Plan
                        </Link>
                    </div>
                </div>

                {/* Upcoming Sessions */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "20px",
                        border: "1px solid var(--border)",
                        padding: "24px 28px",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "20px",
                        }}
                    >
                        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--fg)" }}>
                            Upcoming
                        </h2>
                        <Link
                            href="/schedule"
                            style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#f97316",
                                textDecoration: "none",
                                transition: "opacity 0.2s",
                            }}
                        >
                            See all
                        </Link>
                    </div>

                    {/* Session list */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px" }}>
                        {loadingData ? (
                            <p style={{ color: "var(--muted)", fontSize: "14px" }}>Loading…</p>
                        ) : upcoming.length > 0 ? (
                            upcoming.map((s) => {
                                const d = new Date(s.start_time);
                                return (
                                    <div
                                        key={s.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "16px",
                                            padding: "10px 0",
                                            borderBottom: "1px solid var(--border)",
                                        }}
                                    >
                                        {/* Date badge */}
                                        <div
                                            style={{
                                                minWidth: "52px",
                                                textAlign: "center",
                                                padding: "8px 6px",
                                                borderRadius: "12px",
                                                background: "#fef2f2",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    fontWeight: 700,
                                                    color: "#ef4444",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                {MONTH_SHORT[d.getMonth()]}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "22px",
                                                    fontWeight: 800,
                                                    color: "var(--fg)",
                                                    lineHeight: 1.1,
                                                }}
                                            >
                                                {d.getDate()}
                                            </div>
                                        </div>
                                        {/* Details */}
                                        <div>
                                            <h4
                                                style={{
                                                    margin: 0,
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    color: "var(--fg)",
                                                }}
                                            >
                                                {s.title}
                                            </h4>
                                            <p
                                                style={{
                                                    margin: "2px 0 0 0",
                                                    fontSize: "13px",
                                                    color: "var(--muted)",
                                                }}
                                            >
                                                {formatTime12(s.start_time)} • {formatDuration(s.duration_hours)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p
                                style={{
                                    color: "var(--muted)",
                                    fontSize: "14px",
                                    margin: "8px 0",
                                    lineHeight: 1.5,
                                }}
                            >
                                No upcoming sessions scheduled yet.
                            </p>
                        )}
                    </div>

                    {/* Schedule button */}
                    <Link
                        href="/schedule"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            marginTop: "auto",
                            paddingTop: "16px",
                            border: "2px dashed var(--border)",
                            borderRadius: "12px",
                            padding: "12px",
                            color: "var(--muted)",
                            fontSize: "13px",
                            fontWeight: 600,
                            textDecoration: "none",
                            transition: "border-color 0.2s, color 0.2s",
                            cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#6366f1";
                            e.currentTarget.style.color = "#6366f1";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--muted)";
                        }}
                    >
                        <Plus size={16} />
                        Schedule Session
                    </Link>
                </div>
            </div>

            {/* ── Quick Stats Grid ──────────────────────── */}
            <div
                className="stats-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "20px",
                    marginBottom: "36px",
                }}
            >
                {/* Total Sessions */}
                <StatCard
                    icon={<BookOpen size={24} />}
                    iconBg="rgba(37, 99, 235, 0.1)"
                    iconColor="var(--brand-main)"
                    label="Total Sessions"
                    value={loadingData ? "…" : String(stats?.total_sessions ?? 0)}
                />

                {/* Learning Time */}
                <StatCard
                    icon={<Clock size={24} />}
                    iconBg="rgba(16, 185, 129, 0.1)"
                    iconColor="#10b981"
                    label="Learning Time"
                    value={loadingData ? "…" : `${stats?.total_hours ?? 0}h`}
                />

                {/* Current Streak */}
                <StatCard
                    icon={<Flame size={24} />}
                    iconBg="rgba(245, 158, 11, 0.1)"
                    iconColor="#f59e0b"
                    label="Current Streak"
                    value={loadingData ? "…" : `${streak?.current_streak ?? 0} Day${(streak?.current_streak ?? 0) !== 1 ? "s" : ""}`}
                />

                {/* Avg Quiz Score */}
                <StatCard
                    icon={<Trophy size={24} />}
                    iconBg="rgba(139, 92, 246, 0.1)"
                    iconColor="#8b5cf6"
                    label="Avg Quiz Score"
                    value={loadingData ? "…" : `${stats?.avg_score ?? 0}%`}
                />
            </div>

            {/* ── Content Grid ──────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
                {/* Left Column: Recent Sessions */}
                <div
                    className="dash-section"
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "20px 24px",
                            borderBottom: "1px solid var(--border)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--text-main)" }}>
                            Recent Sessions
                        </h2>
                        <Link
                            href="/library"
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--brand-main)",
                                fontWeight: 500,
                                cursor: "pointer",
                                fontSize: "14px",
                                textDecoration: "none",
                            }}
                        >
                            View All
                        </Link>
                    </div>

                    <div className="sessions-list" style={{ padding: 0 }}>
                        {loadingData ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-sec)" }}>
                                Loading sessions…
                            </div>
                        ) : recentSessions.length > 0 ? (
                            recentSessions.map((session, i) => (
                                <div
                                    key={session.id}
                                    className="session-row-hover"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "16px 24px",
                                        borderBottom: i !== recentSessions.length - 1 ? "1px solid var(--border)" : "none",
                                        transition: "background 0.2s",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "8px",
                                                background: "rgba(37,99,235,0.05)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "var(--brand-main)",
                                            }}
                                        >
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>
                                                {session.topic || "General Tutoring"}
                                            </h4>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-sec)" }}>
                                                {session.created_at
                                                    ? new Date(session.created_at).toLocaleDateString()
                                                    : "—"}{" "}
                                                • {session.duration_minutes != null ? `${session.duration_minutes} mins` : "—"}
                                                {session.subject ? ` • ${session.subject}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            background:
                                                session.status === "active"
                                                    ? "rgba(16,185,129,0.1)"
                                                    : "var(--bg)",
                                            color:
                                                session.status === "active"
                                                    ? "#10b981"
                                                    : "var(--text-sec)",
                                        }}
                                    >
                                        {session.status === "active" ? "Active" : "Completed"}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: "40px", textAlign: "center" }}>
                                <div
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        background: "var(--bg)",
                                        margin: "0 auto 16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--text-sec)",
                                    }}
                                >
                                    <PenTool size={20} />
                                </div>
                                <h4 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontSize: "16px" }}>
                                    No sessions yet
                                </h4>
                                <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", marginBottom: "20px" }}>
                                    Jump into the whiteboard to start learning!
                                </p>
                                <Link
                                    href="/board"
                                    className="btn-primary"
                                    style={{
                                        display: "inline-block",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        background: "var(--brand-main)",
                                        color: "white",
                                        textDecoration: "none",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    Launch Whiteboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Suggested Topics + Progress */}
                <div className="dash-section" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* Suggested Topics */}
                    <div
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            border: "1px solid var(--border)",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                            <h2
                                style={{
                                    fontSize: "18px",
                                    fontWeight: 600,
                                    margin: 0,
                                    color: "var(--text-main)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <TrendingUp size={18} color="var(--brand-main)" />
                                Suggested Topics
                            </h2>
                        </div>
                        <div style={{ padding: "16px 24px" }}>
                            {loadingData ? (
                                <p style={{ color: "var(--text-sec)", fontSize: "14px", margin: 0 }}>Loading…</p>
                            ) : suggestedTopics.length > 0 ? (
                                <>
                                    <p
                                        style={{
                                            color: "var(--text-sec)",
                                            fontSize: "14px",
                                            margin: "0 0 16px 0",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        Based on your sessions and progress, review these areas:
                                    </p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {suggestedTopics.map((topic) => (
                                            <span
                                                key={topic}
                                                style={{
                                                    padding: "6px 12px",
                                                    background: "var(--bg)",
                                                    borderRadius: "20px",
                                                    fontSize: "13px",
                                                    color: "var(--text-main)",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p style={{ color: "var(--text-sec)", fontSize: "14px", margin: 0, lineHeight: 1.5 }}>
                                    Start a few sessions and BoardyBoo will suggest topics to review!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Mastery Progress */}
                    {progress.length > 0 && (
                        <div
                            style={{
                                background: "white",
                                borderRadius: "16px",
                                border: "1px solid var(--border)",
                                overflow: "hidden",
                            }}
                        >
                            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                                <h2
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: 600,
                                        margin: 0,
                                        color: "var(--text-main)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <BarChart3 size={18} color="var(--brand-main)" />
                                    Topic Mastery
                                </h2>
                            </div>
                            <div style={{ padding: "16px 24px" }}>
                                {progress.slice(0, 5).map((p) => (
                                    <div key={p.id} style={{ marginBottom: "14px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-main)" }}>
                                                {p.topic}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: 500,
                                                    color: masteryColor(p.mastery_level),
                                                }}
                                            >
                                                {masteryLabel(p.mastery_level)}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                height: "6px",
                                                borderRadius: "3px",
                                                background: "var(--bg)",
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${(p.mastery_level / 5) * 100}%`,
                                                    height: "100%",
                                                    borderRadius: "3px",
                                                    background: masteryColor(p.mastery_level),
                                                    transition: "width 0.5s ease",
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .session-row-hover:hover {
                    background: var(--bg) !important;
                }
            `}</style>
        </div>
    );
}

/* ── Stat Card Component ───────────────────────────── */

function StatCard({
    icon,
    iconBg,
    iconColor,
    label,
    value,
}: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
}) {
    return (
        <div
            className="stat-card"
            style={{
                background: "white",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
            }}
        >
            <div
                className="stat-icon-box"
                style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: iconBg,
                    color: iconColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {icon}
            </div>
            <div>
                <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", fontWeight: 500 }}>{label}</p>
                <h3 style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>
                    {value}
                </h3>
            </div>
        </div>
    );
}
