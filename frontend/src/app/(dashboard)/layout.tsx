"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
    LayoutDashboard,
    BookOpen,
    Users,
    PenTool,
    Trophy,
    Settings,
    Sparkles,
    Bell,
    CalendarDays,
    X,
    Check,
    Clock,
    Flame,
    MessageSquare,
} from "lucide-react";
import Image from "next/image";
import "./dashboard.css";

/* ── Mock Notifications ──────────────────────────────── */
const MOCK_NOTIFICATIONS = [
    { id: "1", icon: "🎯", title: "New Achievement Unlocked!", desc: "You completed 10 math sessions", time: "2m ago", unread: true },
    { id: "2", icon: "📅", title: "Session Reminder", desc: "Algebra with Professor Owl in 30 min", time: "28m ago", unread: true },
    { id: "3", icon: "🔥", title: "Streak Alert!", desc: "You're on a 12-day streak — keep going!", time: "1h ago", unread: true },
    { id: "4", icon: "💬", title: "Tutor Feedback", desc: "Professor Owl left feedback on your session", time: "3h ago", unread: false },
    { id: "5", icon: "⭐", title: "Weekly Report Ready", desc: "Your learning summary for this week is available", time: "1d ago", unread: false },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const notifRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Enforce light mode for the mockup aesthetic
        setTheme('light');
    }, []);

    // Auth Protection
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as Node;
            if (notifRef.current && !notifRef.current.contains(target)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(target)) {
                setShowProfileDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/");
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    // Show skeleton while checking auth state instead of blank screen
    if (loading || !user) {
        return (
            <div className={`dash-app light-mode`}>
                <header className="dash-topbar">
                    <div className="topbar-logo-zone">
                        <div className="dash-brand" style={{ pointerEvents: "none" }}>
                            <div className="dash-brand-icon" style={{ background: "#e0e0e0" }} />
                            <div className="dash-brand-text">
                                <span className="dash-brand-name" style={{ opacity: 0.3 }}>BoardyBoo</span>
                                <span className="dash-brand-sub" style={{ opacity: 0.3 }}>Loading…</span>
                            </div>
                        </div>
                    </div>
                    <nav className="topbar-nav">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton-shimmer" style={{ width: 90, height: 36, borderRadius: 12 }} />
                        ))}
                    </nav>
                </header>
                <main className="dash-main">
                    <div style={{ padding: "32px 40px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 24, marginBottom: 36 }}>
                            <div className="skeleton-shimmer" style={{ height: 220, borderRadius: 20 }} />
                            <div className="skeleton-shimmer" style={{ height: 220, borderRadius: 20 }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 16 }} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    const unreadCount = notifications.filter(n => n.unread).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    };

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    };

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Calendar", href: "/schedule", icon: CalendarDays },
        { name: "Tutors", href: "/tutors", icon: Users },
        { name: "Whiteboard", href: "/board", icon: PenTool },
        { name: "Achievements", href: "/profile?tab=achievements", icon: Trophy },
    ];

    const isWizard = pathname === '/tutors/create';
    const isBoard = pathname === '/board';

    return (
        <div className={`dash-app ${theme === 'light' ? 'light-mode' : ''}`}>
            {/* ── Top Navbar ──────────────────────────────────────────── */}
            {!isWizard && (
                <header className="dash-topbar">
                    {/* 1. Logo Zone */}
                    <div className="topbar-logo-zone">
                        <Link href="/" className="dash-brand">
                            <div className="dash-brand-icon">
                                <Image src="/Logo.png" alt="BoardyBoo" width={40} height={40} style={{ borderRadius: 10, background: '#fff', padding: 2 }} />
                            </div>
                            <div className="dash-brand-text">
                                <span className="dash-brand-name">BoardyBoo</span>
                                <span className="dash-brand-sub">Student Account</span>
                            </div>
                        </Link>
                    </div>

                    {/* 2. Navigation Links */}
                    <nav className="topbar-nav">
                        {navItems.map((item) => {
                            const hrefPath = item.href.split("?")[0];
                            const isActive = pathname === hrefPath || pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`topbar-nav-item ${isActive ? "active" : ""}`}
                                >
                                    <Icon size={16} className="topbar-nav-icon" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="topbar-divider"></div>

                    {/* 3. Right Controls */}
                    <div className="topbar-controls">
                        <Link
                            href="/profile?tab=settings"
                            className={`topbar-icon-btn ${pathname === '/profile' ? 'active' : ''}`}
                            title="Settings"
                        >
                            <Settings size={20} />
                        </Link>

                        <div className="topbar-notif-wrapper" ref={notifRef}>
                            <button
                                className={`topbar-icon-btn notification-btn ${showNotifications ? 'active' : ''}`}
                                title="Notifications"
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="notification-dot">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <h3 className="notif-title">Notifications</h3>
                                        <div className="notif-header-actions">
                                            {unreadCount > 0 && (
                                                <button className="notif-mark-all" onClick={markAllRead}>
                                                    <Check size={14} />
                                                    Mark all read
                                                </button>
                                            )}
                                            <button
                                                className="notif-close"
                                                onClick={() => setShowNotifications(false)}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="notif-list">
                                        {notifications.map(n => (
                                            <button
                                                key={n.id}
                                                className={`notif-item ${n.unread ? 'unread' : ''}`}
                                                onClick={() => markRead(n.id)}
                                            >
                                                <span className="notif-item-icon">{n.icon}</span>
                                                <div className="notif-item-content">
                                                    <span className="notif-item-title">{n.title}</span>
                                                    <span className="notif-item-desc">{n.desc}</span>
                                                </div>
                                                <span className="notif-item-time">{n.time}</span>
                                                {n.unread && <span className="notif-unread-dot" />}
                                            </button>
                                        ))}
                                    </div>
                                    <Link
                                        href="/profile?tab=settings"
                                        className="notif-footer"
                                        onClick={() => setShowNotifications(false)}
                                    >
                                        Notification Settings
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="topbar-user-wrapper" ref={profileRef} style={{ position: "relative" }}>
                            <button 
                                className="topbar-user-card" 
                                style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px", padding: 0 }}
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            >
                                <div className="topbar-avatar" style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden" }}>
                                    {user?.photoURL ? (
                                        <>
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName || "User"}
                                                width={36}
                                                height={36}
                                                referrerPolicy="no-referrer"
                                                style={{ objectFit: "cover" }}
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    img.style.display = 'none';
                                                    const fallback = img.nextElementSibling as HTMLElement | null;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                            <div style={{ width: "100%", height: "100%", background: "var(--brand-main)", color: "white", display: "none", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 14 }}>
                                                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", background: "var(--brand-main)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                                            {user?.email?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="topbar-user-info" style={{ textAlign: "left" }}>
                                    <span className="user-name" style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
                                        {user?.displayName || "Student"}
                                    </span>
                                    <span className="user-grade" style={{ display: "block", fontSize: "12px", color: "var(--text-sec)" }}>
                                        {user?.email}
                                    </span>
                                </div>
                            </button>

                            {showProfileDropdown && (
                                <div className="notif-dropdown" style={{ width: "220px", right: 0, padding: "8px" }}>
                                    <Link 
                                        href="/profile" 
                                        className="notif-item" 
                                        onClick={() => setShowProfileDropdown(false)}
                                        style={{ padding: "10px", borderRadius: "8px" }}
                                    >
                                        My Profile
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="notif-item"
                                        style={{ width: "100%", textAlign: "left", padding: "10px", borderRadius: "8px", color: "var(--error-color, #ef4444)" }}
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
            )}

            {/* ── Main Content Area ──────────────────────────────── */}
            <main className={`dash-main ${pathname === '/tutors' || isWizard || isBoard ? 'no-padding' : ''} ${isWizard ? 'wizard-mode' : ''}`}>
                {children}
            </main>
        </div>
    );
}
