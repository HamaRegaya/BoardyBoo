"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    const [theme, setTheme] = useState<'dark' | 'light'>('light');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const notifRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Enforce light mode for the mockup aesthetic
        setTheme('light');
    }, []);

    // Close notification dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        }
        if (showNotifications) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showNotifications]);

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
                                <Sparkles size={18} fill="currentColor" />
                            </div>
                            <div className="dash-brand-text">
                                <span className="dash-brand-name">Magic Tutor</span>
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

                        <Link href="/profile" className="topbar-user-card">
                            <div className="topbar-avatar">
                                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704z" alt="User" width={36} height={36} />
                            </div>
                            <div className="topbar-user-info">
                                <span className="user-name">Alex Johnson</span>
                                <span className="user-grade">Grade 10</span>
                            </div>
                        </Link>
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
