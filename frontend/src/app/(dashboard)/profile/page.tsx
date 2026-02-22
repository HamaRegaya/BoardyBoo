"use client";

import { useState } from "react";
import {
    User,
    Mail,
    GraduationCap,
    Target,
    Trophy,
    Clock,
    Flame,
    BookOpen,
    Camera,
    Edit3,
    Save,
    X,
    ChevronRight,
    Sigma,
    Globe,
    Calendar,
    BarChart3,
    Shield,
    Bell,
    Moon,
    Sun,
    Volume2,
    Eye,
    LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "../dashboard.css";
import "./profile.css";

/* ─── Mock Data ──────────────────────────────────────── */

const USER = {
    name: "Alex Johnson",
    email: "alex.johnson@school.edu",
    grade: "Grade 10",
    school: "Riverside High School",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704z",
    joinDate: "September 2025",
    bio: "Aspiring astronaut and math enthusiast. I love solving problems and exploring the universe!",
};

const STATS = {
    totalSessions: 147,
    totalHours: 218,
    currentStreak: 12,
    longestStreak: 23,
    averageScore: 87,
    badgesEarned: 14,
};

const SUBJECTS = [
    { name: "Mathematics", progress: 92, icon: "math", trend: "+4%", color: "#4f46e5" },
    { name: "Science", progress: 78, icon: "science", trend: "+2%", color: "#10b981" },
    { name: "History", progress: 88, icon: "history", trend: "+12%", color: "#f97316" },
    { name: "Languages", progress: 65, icon: "languages", trend: "+8%", color: "#a855f7" },
];

const ACHIEVEMENTS = [
    { id: 1, name: "First Session", desc: "Complete your first whiteboard session", earned: true, date: "Sep 2025", icon: "🎓" },
    { id: 2, name: "Math Whiz", desc: "Score 90%+ in 5 math sessions", earned: true, date: "Oct 2025", icon: "🧮" },
    { id: 3, name: "Week Warrior", desc: "Complete 7-day study streak", earned: true, date: "Nov 2025", icon: "🔥" },
    { id: 4, name: "Science Star", desc: "Master all science fundamentals", earned: true, date: "Dec 2025", icon: "⭐" },
    { id: 5, name: "Polyglot", desc: "Practice 3 different languages", earned: false, date: null, icon: "🌍" },
    { id: 6, name: "Century Club", desc: "Complete 100 sessions", earned: true, date: "Jan 2026", icon: "💯" },
];

const RECENT_SESSIONS = [
    { id: 1, title: "Calculus Limits", tutor: "Prof. Algebra", date: "Feb 20", duration: "2h", score: 94, subject: "math" },
    { id: 2, title: "Kinematics Review", tutor: "Dr. Physics", date: "Feb 19", duration: "1.5h", score: 87, subject: "science" },
    { id: 3, title: "French Conversation", tutor: "Madame Lingua", date: "Feb 18", duration: "1h", score: 91, subject: "languages" },
    { id: 4, title: "WW2 Causes", tutor: "Ms. History", date: "Feb 17", duration: "1.5h", score: 85, subject: "history" },
];

const GOALS = [
    { id: 1, text: "Reach 95% in Mathematics", progress: 92, target: 95 },
    { id: 2, text: "Complete 200 total sessions", progress: 147, target: 200 },
    { id: 3, text: "Maintain 30-day study streak", progress: 12, target: 30 },
];

/* ─── Helpers ────────────────────────────────────────── */

const subjectColorMap: Record<string, { bg: string; text: string }> = {
    math: { bg: "#e0e7ff", text: "#4f46e5" },
    science: { bg: "#d1fae5", text: "#10b981" },
    history: { bg: "#ffedd5", text: "#f97316" },
    languages: { bg: "#f3e8ff", text: "#a855f7" },
};

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(USER.name);
    const [editBio, setEditBio] = useState(USER.bio);
    const [editEmail, setEditEmail] = useState(USER.email);
    const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "settings">("overview");

    // Settings state
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [soundEffects, setSoundEffects] = useState(true);
    const [sessionReminders, setSessionReminders] = useState(true);

    const handleSave = () => {
        // In production, this would call an API
        setIsEditing(false);
    };

    return (
        <div className="dash-page" style={{ padding: "40px 48px" }}>
            {/* ── Profile Header Card ─────────────────────────── */}
            <div className="prof-header-card">
                <div className="prof-header-bg" />
                <div className="prof-header-content">
                    <div className="prof-avatar-section">
                        <div className="prof-avatar-wrapper">
                            <img
                                src={USER.avatar}
                                alt={USER.name}
                                className="prof-avatar-img"
                            />
                            <button className="prof-avatar-edit" title="Change photo">
                                <Camera size={14} />
                            </button>
                        </div>
                        <div className="prof-identity">
                            {isEditing ? (
                                <input
                                    className="prof-edit-name"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <h1 className="prof-name">{USER.name}</h1>
                            )}
                            <div className="prof-badges-row">
                                <span className="prof-badge grade"><GraduationCap size={12} /> {USER.grade}</span>
                                <span className="prof-badge school"><BookOpen size={12} /> {USER.school}</span>
                                <span className="prof-badge joined"><Calendar size={12} /> Joined {USER.joinDate}</span>
                            </div>
                        </div>
                    </div>
                    <div className="prof-header-actions">
                        {isEditing ? (
                            <>
                                <button className="prof-save-btn" onClick={handleSave}><Save size={16} /> Save</button>
                                <button className="prof-cancel-btn" onClick={() => setIsEditing(false)}><X size={16} /></button>
                            </>
                        ) : (
                            <button className="prof-edit-btn" onClick={() => setIsEditing(true)}><Edit3 size={16} /> Edit Profile</button>
                        )}
                    </div>
                </div>

                {/* Bio */}
                <div className="prof-bio-section">
                    {isEditing ? (
                        <textarea
                            className="prof-edit-bio"
                            value={editBio}
                            onChange={e => setEditBio(e.target.value)}
                            rows={2}
                            placeholder="Write something about yourself..."
                        />
                    ) : (
                        <p className="prof-bio">{USER.bio}</p>
                    )}
                </div>

                {/* Quick stats bar */}
                <div className="prof-stats-bar">
                    <div className="prof-stat-item">
                        <div className="prof-stat-icon sessions"><BookOpen size={18} /></div>
                        <div>
                            <span className="prof-stat-value">{STATS.totalSessions}</span>
                            <span className="prof-stat-label">Sessions</span>
                        </div>
                    </div>
                    <div className="prof-stat-divider" />
                    <div className="prof-stat-item">
                        <div className="prof-stat-icon hours"><Clock size={18} /></div>
                        <div>
                            <span className="prof-stat-value">{STATS.totalHours}h</span>
                            <span className="prof-stat-label">Study Hours</span>
                        </div>
                    </div>
                    <div className="prof-stat-divider" />
                    <div className="prof-stat-item">
                        <div className="prof-stat-icon streak"><Flame size={18} /></div>
                        <div>
                            <span className="prof-stat-value">{STATS.currentStreak} days</span>
                            <span className="prof-stat-label">Current Streak</span>
                        </div>
                    </div>
                    <div className="prof-stat-divider" />
                    <div className="prof-stat-item">
                        <div className="prof-stat-icon score"><BarChart3 size={18} /></div>
                        <div>
                            <span className="prof-stat-value">{STATS.averageScore}%</span>
                            <span className="prof-stat-label">Avg. Score</span>
                        </div>
                    </div>
                    <div className="prof-stat-divider" />
                    <div className="prof-stat-item">
                        <div className="prof-stat-icon badges"><Trophy size={18} /></div>
                        <div>
                            <span className="prof-stat-value">{STATS.badgesEarned}</span>
                            <span className="prof-stat-label">Badges</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tab Navigation ──────────────────────────────── */}
            <div className="prof-tabs">
                {(["overview", "achievements", "settings"] as const).map(tab => (
                    <button
                        key={tab}
                        className={`prof-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "overview" && <BarChart3 size={16} />}
                        {tab === "achievements" && <Trophy size={16} />}
                        {tab === "settings" && <Shield size={16} />}
                        <span style={{ textTransform: "capitalize" }}>{tab}</span>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="dash-split-layout"
                        style={{ gridTemplateColumns: "1fr 380px" }}
                    >
                        {/* Main column */}
                        <div className="dash-main-column" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            {/* Subject Mastery */}
                            <div className="dash-sidebar-card" style={{ padding: "24px" }}>
                                <h2 className="prof-section-title"><Sigma size={20} /> Subject Mastery</h2>
                                <div className="prof-subjects-grid">
                                    {SUBJECTS.map(sub => (
                                        <div key={sub.name} className="prof-subject-row">
                                            <div className="prof-subject-info">
                                                <div className="prof-subject-dot" style={{ background: sub.color }} />
                                                <span className="prof-subject-name">{sub.name}</span>
                                                <span className="prof-subject-trend" style={{ color: sub.color }}>{sub.trend}</span>
                                            </div>
                                            <div className="prof-subject-bar-track">
                                                <motion.div
                                                    className="prof-subject-bar-fill"
                                                    style={{ background: sub.color }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${sub.progress}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                />
                                            </div>
                                            <span className="prof-subject-percent">{sub.progress}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Sessions */}
                            <div className="dash-sidebar-card" style={{ padding: "24px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                    <h2 className="prof-section-title" style={{ margin: 0 }}><Clock size={20} /> Recent Sessions</h2>
                                    <Link href="/schedule" className="dash-link-btn">View All</Link>
                                </div>
                                <div className="prof-sessions-list">
                                    {RECENT_SESSIONS.map(sess => {
                                        const sc = subjectColorMap[sess.subject] ?? { bg: "#f1f5f9", text: "#64748b" };
                                        return (
                                            <div key={sess.id} className="prof-session-row">
                                                <div className="prof-session-subject-dot" style={{ background: sc.text }} />
                                                <div className="prof-session-info">
                                                    <h4>{sess.title}</h4>
                                                    <p>{sess.tutor} • {sess.date}</p>
                                                </div>
                                                <span className="prof-session-duration">{sess.duration}</span>
                                                <span className="prof-session-score" style={{ background: sc.bg, color: sc.text }}>
                                                    {sess.score}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="dash-side-column">
                            {/* Learning Goals */}
                            <div className="dash-sidebar-card">
                                <h2 className="prof-section-title"><Target size={20} /> Learning Goals</h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    {GOALS.map(goal => {
                                        const pct = Math.round((goal.progress / goal.target) * 100);
                                        return (
                                            <div key={goal.id} className="prof-goal-item">
                                                <div className="prof-goal-top">
                                                    <span className="prof-goal-text">{goal.text}</span>
                                                    <span className="prof-goal-pct">{pct}%</span>
                                                </div>
                                                <div className="prof-goal-track">
                                                    <motion.div
                                                        className="prof-goal-fill"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                    />
                                                </div>
                                                <span className="prof-goal-detail">{goal.progress} / {goal.target}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Study Streak Card */}
                            <div className="prof-streak-card">
                                <div className="prof-streak-flame">
                                    <Flame size={32} />
                                </div>
                                <h3 className="prof-streak-count">{STATS.currentStreak} Day Streak!</h3>
                                <p className="prof-streak-sub">Best: {STATS.longestStreak} days — keep it going!</p>
                                <div className="prof-streak-dots">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className={`prof-streak-day ${i < 5 ? "completed" : i === 5 ? "today" : ""}`}>
                                            <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="dash-sidebar-card">
                                <h2 className="prof-section-title"><Mail size={20} /> Contact Info</h2>
                                <div className="prof-contact-list">
                                    <div className="prof-contact-item">
                                        <Mail size={16} />
                                        {isEditing ? (
                                            <input
                                                className="prof-edit-inline"
                                                value={editEmail}
                                                onChange={e => setEditEmail(e.target.value)}
                                            />
                                        ) : (
                                            <span>{USER.email}</span>
                                        )}
                                    </div>
                                    <div className="prof-contact-item">
                                        <GraduationCap size={16} />
                                        <span>{USER.school}</span>
                                    </div>
                                    <div className="prof-contact-item">
                                        <Globe size={16} />
                                        <span>English, French</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === "achievements" && (
                    <motion.div
                        key="achievements"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                    >
                        <div className="prof-achievements-grid">
                            {ACHIEVEMENTS.map(ach => (
                                <motion.div
                                    key={ach.id}
                                    className={`prof-achievement-card ${ach.earned ? "earned" : "locked"}`}
                                    whileHover={{ scale: 1.03, y: -4 }}
                                >
                                    <div className="prof-ach-icon">{ach.icon}</div>
                                    <h3 className="prof-ach-name">{ach.name}</h3>
                                    <p className="prof-ach-desc">{ach.desc}</p>
                                    {ach.earned ? (
                                        <span className="prof-ach-date">Earned {ach.date}</span>
                                    ) : (
                                        <span className="prof-ach-locked">Keep going!</span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === "settings" && (
                    <motion.div
                        key="settings"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="prof-settings-layout"
                    >
                        <div className="dash-sidebar-card" style={{ padding: "28px" }}>
                            <h2 className="prof-section-title"><Shield size={20} /> Preferences</h2>
                            <div className="prof-settings-list">
                                <div className="prof-setting-row">
                                    <div className="prof-setting-info">
                                        {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                                        <div>
                                            <h4>Dark Mode</h4>
                                            <p>Switch between light and dark themes</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
                                </div>
                                <div className="prof-setting-row">
                                    <div className="prof-setting-info">
                                        <Bell size={18} />
                                        <div>
                                            <h4>Push Notifications</h4>
                                            <p>Get notified about sessions and achievements</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={notifications} onChange={setNotifications} />
                                </div>
                                <div className="prof-setting-row">
                                    <div className="prof-setting-info">
                                        <Volume2 size={18} />
                                        <div>
                                            <h4>Sound Effects</h4>
                                            <p>Play sounds during whiteboard sessions</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={soundEffects} onChange={setSoundEffects} />
                                </div>
                                <div className="prof-setting-row">
                                    <div className="prof-setting-info">
                                        <Calendar size={18} />
                                        <div>
                                            <h4>Session Reminders</h4>
                                            <p>Remind me 15 minutes before sessions</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch checked={sessionReminders} onChange={setSessionReminders} />
                                </div>
                            </div>
                        </div>

                        <div className="dash-sidebar-card" style={{ padding: "28px" }}>
                            <h2 className="prof-section-title"><Eye size={20} /> Privacy & Account</h2>
                            <div className="prof-settings-list">
                                <button className="prof-setting-link">
                                    <span>Change Password</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="prof-setting-link">
                                    <span>Manage Data & Privacy</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="prof-setting-link">
                                    <span>Connected Accounts</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button className="prof-setting-link danger">
                                    <span><LogOut size={16} /> Sign Out</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Toggle Switch Sub-component ────────────────────── */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div
            className="prof-toggle-switch"
            style={{ background: checked ? "var(--primary)" : "var(--border-color)" }}
            onClick={() => onChange(!checked)}
        >
            <motion.div
                className="prof-toggle-knob"
                layout
                animate={{ left: checked ? "18px" : "2px" }}
            />
        </div>
    );
}
