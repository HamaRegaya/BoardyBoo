"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Sparkles, Filter, MoreHorizontal, Clock, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "../dashboard.css"; // Reuse dashboard base styles

// --- Mock Data ---
type Session = {
    id: string;
    title: string;
    tutor: string;
    avatar: string;
    day: number; // 0-6 (Sun-Sat)
    startTime: number; // 0-23 (Hour)
    duration: number; // in hours
    type: "manual" | "ai-suggested";
    subjectClass: "math" | "science" | "history" | "languages";
};

const WEEK_SESSIONS: Session[] = [
    { id: "1", title: "Calculus Limits", tutor: "Prof. Algebra", avatar: "/personas/owl.png", day: 1, startTime: 10, duration: 2, type: "manual", subjectClass: "math" },
    { id: "2", title: "Kinematics Review", tutor: "Dr. Physics", avatar: "/personas/orb.png", day: 2, startTime: 14, duration: 1.5, type: "manual", subjectClass: "science" },
    { id: "3", title: "French Conversation", tutor: "Madame Lingua", avatar: "/personas/star.png", day: 3, startTime: 16, duration: 1, type: "ai-suggested", subjectClass: "languages" },
    { id: "4", title: "WW2 Causes", tutor: "Ms. History", avatar: "/personas/owl.png", day: 4, startTime: 11, duration: 1.5, type: "manual", subjectClass: "history" },
    { id: "5", title: "JavaScript Promises", tutor: "Code Bot", avatar: "/personas/orb.png", day: 5, startTime: 15, duration: 2, type: "ai-suggested", subjectClass: "science" },
];

const SUGGESTIONS = [
    { id: "s1", title: "Derivatives Practice", tutor: "Prof. Algebra", duration: "45 min", reason: "Based on recent struggles with chain rule", subject: "math" },
    { id: "s2", title: "Newton's 3rd Law", tutor: "Dr. Physics", duration: "1 hour", reason: "Preparation for upcoming midterm", subject: "science" }
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

export default function SchedulePage() {
    const [viewMode, setViewMode] = useState<"week" | "month">("week");
    const [showAISuggestions, setShowAISuggestions] = useState(true);

    // Helpers for grid positioning
    const getSubjectColorStyles = (subject: string, isAI: boolean) => {
        let baseBg, borderColor, textColor;
        switch (subject) {
            case "math": baseBg = "#e0e7ff"; borderColor = "#4f46e5"; textColor = "#4338ca"; break;
            case "science": baseBg = "#d1fae5"; borderColor = "#10b981"; textColor = "#047857"; break;
            case "history": baseBg = "#ffedd5"; borderColor = "#f97316"; textColor = "#c2410c"; break;
            case "languages": baseBg = "#f3e8ff"; borderColor = "#a855f7"; textColor = "#7e22ce"; break;
            default: baseBg = "#f1f5f9"; borderColor = "#64748b"; textColor = "#334155"; break;
        }

        if (isAI) {
            return {
                background: `repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px), ${baseBg}`,
                border: `2px dashed ${borderColor}`,
                color: textColor,
            };
        }
        return {
            background: baseBg,
            border: `1px solid ${baseBg}`,
            borderLeft: `4px solid ${borderColor}`,
            color: textColor,
        };
    };

    return (
        <div className="dash-page" style={{ padding: '40px 48px' }}>
            <div className="dash-header-area">
                <div className="dash-header-text">
                    <h1 className="dash-title">
                        My Schedule <CalendarIcon className="text-indigo-600 ml-2" size={32} />
                    </h1>
                    <p className="dash-subtitle" style={{ marginTop: '6px' }}>
                        Plan your learning journey with AI-optimized session slots.
                    </p>
                </div>
                <div className="dash-header-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '4px', display: 'flex' }}>
                        <button
                            onClick={() => setViewMode("week")}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === "week" ? 'white' : 'transparent', color: viewMode === "week" ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', boxShadow: viewMode === "week" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode("month")}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === "month" ? 'white' : 'transparent', color: viewMode === "month" ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 600, fontSize: '13px', boxShadow: viewMode === "month" ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            Month
                        </button>
                    </div>
                    <button className="btn-resume" style={{ border: 'none', cursor: 'pointer' }}>
                        <Plus size={18} /> Book Session
                    </button>
                </div>
            </div>

            <div className="dash-split-layout" style={{ gridTemplateColumns: '1fr 340px' }}>

                {/* ── Main Calendar Column ──────────────────────────────── */}
                <div className="dash-main-column">
                    <div className="dash-sidebar-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>October 2026</h2>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                                    <button style={{ background: 'var(--bg-main)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                                </div>
                            </div>
                            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                                <Filter size={14} /> Filter
                            </button>
                        </div>

                        {/* Calendar Grid Container */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Days Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                                <div /> {/* Empty top-left corner */}
                                {DAYS.map((day, idx) => (
                                    <div key={day} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{day}</div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: idx === 1 ? 'var(--primary)' : 'var(--text-main)', marginTop: '4px', width: '32px', height: '32px', borderRadius: '50%', background: idx === 1 ? 'var(--primary-light)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0' }}>
                                            {11 + idx} {/* Dummy dates */}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Time Grid */}
                            <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                                {/* Background grid lines */}
                                {HOURS.map(hour => (
                                    <div key={hour} style={{ display: 'grid', gridTemplateColumns: '60px 1fr', height: '80px' }}>
                                        <div style={{ padding: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', borderBottom: '1px solid transparent', transform: 'translateY(-10px)' }}>
                                            {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                                        </div>
                                        <div style={{ borderBottom: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)', position: 'relative' }}>
                                            {/* Sub-grid lines for columns */}
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', height: '100%' }}>
                                                {DAYS.map((_, i) => <div key={i} style={{ borderRight: i < 6 ? '1px dashed var(--border-color)' : 'none', opacity: 0.5 }} />)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Absolute positioned sessions */}
                                {WEEK_SESSIONS.filter(s => showAISuggestions || s.type !== 'ai-suggested').map(session => {
                                    const topPercent = ((session.startTime - 8) / HOURS.length) * 100;
                                    const heightPercent = (session.duration / HOURS.length) * 100;
                                    const leftPercent = (session.day / 7) * 100;
                                    const widthPercent = 100 / 7;

                                    return (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={{
                                                position: 'absolute',
                                                top: `${topPercent}%`,
                                                left: `calc(60px + ${leftPercent}%)`,
                                                width: `calc(${widthPercent}% - 8px)`,
                                                height: `calc(${heightPercent}% - 4px)`,
                                                margin: '2px 4px',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                ...getSubjectColorStyles(session.subjectClass, session.type === 'ai-suggested')
                                            }}
                                            className="hover:scale-[1.02] transition-transform z-10 overflow-hidden"
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <h4 style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.2, margin: 0 }}>{session.title}</h4>
                                                {session.type === 'ai-suggested' && <Sparkles size={12} />}
                                            </div>
                                            <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>{session.tutor}</span>
                                        </motion.div>
                                    );
                                })}

                                {/* Current Time Indicator Line */}
                                <div style={{ position: 'absolute', top: '35%', left: '60px', right: 0, height: '2px', background: '#ef4444', zIndex: 20 }}>
                                    <div style={{ position: 'absolute', left: '-6px', top: '-4px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sidebar Column ────────────────────── */}
                <div className="dash-side-column">

                    {/* AI Suggestions Card */}
                    <div className="dash-sidebar-card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, #f0efff 100%)', border: '1px solid var(--primary-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px' }}><Sparkles size={16} /></div>
                                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Smart Curriculum</h2>
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <div style={{ position: 'relative', width: '36px', height: '20px', background: showAISuggestions ? 'var(--primary)' : 'var(--border-color)', borderRadius: '20px', transition: 'background 0.3s' }}>
                                    <motion.div
                                        layout
                                        style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px' }}
                                        animate={{ left: showAISuggestions ? '18px' : '2px' }}
                                    />
                                </div>
                                <input type="checkbox" checked={showAISuggestions} onChange={() => setShowAISuggestions(!showAISuggestions)} style={{ display: 'none' }} />
                            </label>
                        </div>

                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
                            AI has generated optimized learning slots based on your recent struggles and upcoming goals.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <AnimatePresence>
                                {SUGGESTIONS.map(sug => (
                                    <motion.div
                                        key={sug.id}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                                        style={{ background: 'white', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{sug.title}</h4>
                                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {sug.duration}</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.4 }}>{sug.reason}</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} className="hover:bg-indigo-200">Add to Schedule</button>
                                            <button style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-main)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}><MoreHorizontal size={16} /></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="dash-sidebar-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Upcoming Goals</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ width: '4px', borderRadius: '4px', background: '#f97316' }} />
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>Physics Midterm</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Friday, Oct 15 • Covers Ch 1-4</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ width: '4px', borderRadius: '4px', background: '#a855f7' }} />
                                <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px' }}>French Oral Exam</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Next Monday • Conversational</p>
                                </div>
                            </div>
                        </div>
                        <button style={{ marginTop: '20px', width: '100%', background: 'var(--bg-main)', border: 'none', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }} className="hover:bg-slate-200 transition-colors">
                            View All Deadlines
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
