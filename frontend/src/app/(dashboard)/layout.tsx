"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Library,
    GraduationCap,
    Users,
    Settings,
    Plus,
    Moon,
    Sun,
    PenTool
} from "lucide-react";
import "./dashboard.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
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

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Library", href: "/library", icon: Library },
        { name: "Courses", href: "/courses", icon: GraduationCap },
        { name: "Tutors", href: "/tutors", icon: Users },
    ];

    return (
        <div className={`dash-app ${theme === 'light' ? 'light-mode' : ''}`}>
            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="dash-sidebar">
                <div className="dash-sidebar-header">
                    <Link href="/" className="dash-brand">
                        <div className="dash-brand-icon"><PenTool size={16} /></div>
                        <span className="dash-brand-name">BoardyBoo</span>
                    </Link>
                </div>

                <div className="dash-sidebar-content">
                    <div className="dash-nav">
                        <div className="dash-nav-label">MENU</div>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`dash-nav-item ${isActive ? "active" : ""}`}
                                >
                                    <item.icon size={18} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="dash-sidebar-footer">
                    <Link href="/board" className="dash-new-session-btn">
                        <Plus size={16} /> New Session
                    </Link>

                    <div className="dash-footer-links">
                        <Link href="/profile" className="dash-icon-btn" title="Settings">
                            <Settings size={18} />
                        </Link>
                        <button className="dash-icon-btn" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content Area ──────────────────────────────── */}
            <main className="dash-main">
                {children}
            </main>
        </div>
    );
}
