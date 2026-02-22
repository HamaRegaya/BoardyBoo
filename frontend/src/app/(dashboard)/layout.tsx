"use client";

import { useEffect, useState } from "react";
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
    CalendarDays
} from "lucide-react";
import Image from "next/image";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

    useEffect(() => {
        // Enforce light mode for the mockup aesthetic
        setTheme('light');
    }, []);

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Calendar", href: "/schedule", icon: CalendarDays },
        { name: "Tutors", href: "/tutors", icon: Users },
        { name: "Whiteboard", href: "/board", icon: PenTool },
        { name: "Achievements", href: "/achievements", icon: Trophy },
    ];

    const isWizard = pathname === '/tutors/create';

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
                            const isActive = pathname === item.href;
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
                        <Link href="/settings" className="topbar-icon-btn" title="Settings">
                            <Settings size={20} />
                        </Link>

                        <button className="topbar-icon-btn notification-btn" title="Notifications">
                            <Bell size={20} />
                            <span className="notification-dot"></span>
                        </button>

                        <div className="topbar-user-card">
                            <div className="topbar-avatar">
                                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704z" alt="User" width={36} height={36} />
                            </div>
                            <div className="topbar-user-info">
                                <span className="user-name">Alex Johnson</span>
                                <span className="user-grade">Grade 10</span>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* ── Main Content Area ──────────────────────────────── */}
            <main className={`dash-main ${pathname === '/tutors' || isWizard ? 'no-padding' : ''} ${isWizard ? 'wizard-mode' : ''}`}>
                {children}
            </main>
        </div>
    );
}
