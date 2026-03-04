"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
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

                // Fetch all dashboard data in parallel
                const [statsRes, sessionsRes, streakRes, topicsRes, progressRes] =
                    await Promise.allSettled([
                        axios.get(`${API_URL}/api/dashboard/stats`, { headers }),
                        axios.get(`${API_URL}/api/dashboard/sessions?limit=5`, { headers }),
                        axios.get(`${API_URL}/api/dashboard/streak`, { headers }),
                        axios.get(`${API_URL}/api/dashboard/topics`, { headers }),
                        axios.get(`${API_URL}/api/dashboard/progress`, { headers }),
                    ]);

                if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
                if (sessionsRes.status === "fulfilled") setRecentSessions(sessionsRes.value.data);
                if (streakRes.status === "fulfilled") setStreak(streakRes.value.data);
                if (topicsRes.status === "fulfilled") setSuggestedTopics(topicsRes.value.data.topics ?? []);
                if (progressRes.status === "fulfilled") setProgress(progressRes.value.data);
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

    return (
        <div className="dash-content fade-in">
            {/* ── Welcome Header ────────────────────────── */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Welcome back, {user?.displayName?.split(" ")[0] || "Student"}! 👋</h1>
                    <p className="dash-subtitle">Ready for another session? Here is your progress so far.</p>
                </div>
                <Link
                    href="/board"
                    className="btn-primary"
                    style={{
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: 600,
                        background: "var(--brand-main)",
                        color: "white",
                        textDecoration: "none",
                    }}
                >
                    <Play size={18} fill="currentColor" />
                    Start New Session
                </Link>
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
