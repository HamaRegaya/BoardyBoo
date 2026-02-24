"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
    Clock,
    BookOpen,
    Trophy,
    TrendingUp,
    Play,
    Calendar,
    PenTool
} from "lucide-react";
import axios from "axios";

interface DashboardStats {
  total_sessions: number;
  total_hours: number;
}

interface Session {
  id: string;
  topic: string;
  duration_minutes: number;
  created_at: string;
}

export default function Dashboard() {
    const { user, getToken } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
             // Let the layout handle the redirect, just don't fetch if no user
            if (!user) return;

            try {
                const token = await getToken();
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                // Fetch stats and sessions in parallel
                const [statsRes, sessionsRes] = await Promise.all([
                    axios.get("http://localhost:8000/api/dashboard/stats", { headers }),
                    axios.get("http://localhost:8000/api/dashboard/sessions?limit=3", { headers })
                ]);

                setStats(statsRes.data);
                setRecentSessions(sessionsRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoadingData(false);
            }
        }

        fetchDashboardData();
    }, [user, getToken]);

    return (
        <div className="dash-content fade-in">
            {/* ── Welcome Header ────────────────────────── */}
            <div className="dash-header">
                <div>
                    <h1 className="dash-title">Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}! 👋</h1>
                    <p className="dash-subtitle">Ready for another session? Here is your progress so far.</p>
                </div>
                <Link href="/board" className="btn-primary" style={{ padding: "0.75rem 1.5rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, background: "var(--brand-main)", color: "white", textDecoration: "none" }}>
                    <Play size={18} fill="currentColor" />
                    Start New Session
                </Link>
            </div>

            {/* ── Quick Stats Grid ──────────────────────── */}
            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                <div className="stat-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div className="stat-icon-box" style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(37, 99, 235, 0.1)", color: "var(--brand-main)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", fontWeight: 500 }}>Total Sessions</p>
                        <h3 style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>
                             {loadingData ? "..." : (stats?.total_sessions || 0)}
                        </h3>
                    </div>
                </div>

                <div className="stat-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div className="stat-icon-box" style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", fontWeight: 500 }}>Learning Time</p>
                        <h3 style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>
                            {loadingData ? "..." : `${stats?.total_hours || 0}h`}
                        </h3>
                    </div>
                </div>

                <div className="stat-card" style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div className="stat-icon-box" style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trophy size={24} />
                    </div>
                    <div>
                        <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", fontWeight: 500 }}>Current Streak</p>
                        <h3 style={{ margin: "4px 0 0 0", fontSize: "28px", fontWeight: 700, color: "var(--text-main)" }}>
                            3 Days
                        </h3>
                    </div>
                </div>
            </div>

            {/* ── Content Grid ──────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>

                {/* Left Column: Recent Sessions */}
                <div className="dash-section" style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--text-main)" }}>Recent Sessions</h2>
                        <button style={{ background: "transparent", border: "none", color: "var(--brand-main)", fontWeight: 500, cursor: "pointer", fontSize: "14px" }}>View All</button>
                    </div>

                    <div className="sessions-list" style={{ padding: "0" }}>
                        {loadingData ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-sec)" }}>Loading sessions...</div>
                        ) : recentSessions.length > 0 ? (
                            recentSessions.map((session, i) => (
                                <div key={session.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: i !== recentSessions.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.2s", cursor: "pointer" }} className="session-row-hover">
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(37,99,235,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-main)" }}>
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 600, color: "var(--text-main)" }}>{session.topic || "General Tutoring"}</h4>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-sec)" }}>
                                                {new Date(session.created_at).toLocaleDateString()} • {session.duration_minutes} mins
                                            </p>
                                        </div>
                                    </div>
                                    <button style={{ padding: "6px 12px", borderRadius: "6px", background: "white", border: "1px solid var(--border)", fontSize: "13px", fontWeight: 500, color: "var(--text-main)", cursor: "pointer" }}>
                                        Review
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: "40px", textAlign: "center" }}>
                                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-sec)" }}><PenTool size={20} /></div>
                                <h4 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontSize: "16px" }}>No sessions yet</h4>
                                <p style={{ margin: 0, color: "var(--text-sec)", fontSize: "14px", marginBottom: "20px" }}>Jump into the whiteboard to start learning!</p>
                                <Link href="/board" className="btn-primary" style={{ display: "inline-block", padding: "8px 16px", borderRadius: "8px", background: "var(--brand-main)", color: "white", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
                                    Launch Whiteboard
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Suggested Topics / Next Up */}
                <div className="dash-section" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden" }}>
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "8px" }}>
                                <TrendingUp size={18} color="var(--brand-main)" />
                                Suggested Topics
                            </h2>
                        </div>
                        <div style={{ padding: "16px 24px" }}>
                            <p style={{ color: "var(--text-sec)", fontSize: "14px", margin: "0 0 16px 0", lineHeight: 1.5 }}>Based on your recent sessions, BoardyBoo suggests reviewing these areas:</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                <span style={{ padding: "6px 12px", background: "var(--bg)", borderRadius: "20px", fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>Calculus Derivatives</span>
                                <span style={{ padding: "6px 12px", background: "var(--bg)", borderRadius: "20px", fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>Photosynthesis Cycle</span>
                                <span style={{ padding: "6px 12px", background: "var(--bg)", borderRadius: "20px", fontSize: "13px", color: "var(--text-main)", fontWeight: 500 }}>Spanish Verbs</span>
                            </div>
                        </div>
                    </div>
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
