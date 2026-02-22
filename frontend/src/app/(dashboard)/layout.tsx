"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Moon,
    Sun,
    PenTool,
    Bell,
    ChevronDown
} from "lucide-react";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [theme, setTheme] = useState<'dark' | 'light'>('light');

    useEffect(() => {
        // Default to light mode for the mockup, but respect saved preference
        const savedTheme = localStorage.getItem('boardyboo-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme as 'dark' | 'light');
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('boardyboo-theme', newTheme);
    };

    const navItems = [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Library", href: "/library" },
        { name: "Progress", href: "/courses" }, // Mockup uses "Progress"
        { name: "Settings", href: "/profile" },
    ];

    return (
        <div className={`dash-app ${theme === 'light' ? 'light-mode' : ''}`}>
            {/* ── Top Navbar ──────────────────────────────────────────── */}
            <header className="dash-topbar">

                {/* 1. Logo Zone */}
                <div className="topbar-logo-zone">
                    <Link href="/" className="dash-brand">
                        <div className="dash-brand-icon"><PenTool size={16} /></div>
                        <span className="dash-brand-name">Magic Whiteboard</span>
                    </Link>
                </div>

                {/* 2. Center / Right Navigation Links */}
                <nav className="topbar-nav">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`topbar-nav-item ${isActive ? "active" : ""}`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Vertical Divider */}
                <div className="topbar-divider"></div>

                {/* 3. Far Right Controls */}
                <div className="topbar-controls">
                    <button className="topbar-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button className="topbar-icon-btn" title="Notifications">
                        <div className="notification-bell">
                            <Bell size={18} />
                            <span className="notification-dot"></span>
                        </div>
                    </button>

                    <button className="topbar-profile-btn" title="User Profile">
                        <div className="topbar-avatar">
                            {/* Assuming standard user avatar for mockup */}
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </button>
                </div>
            </header>

            {/* ── Main Content Area ──────────────────────────────── */}
            <main className="dash-main">
                {children}
            </main>
        </div>
    );
}
