import { Play, Flame, BookOpen, Clock, Calculator, Atom, BookType, Hash } from "lucide-react";
import Link from "next/link";
import "../dashboard.css";

export default function DashboardPage() {
    return (
        <div className="dash-page">
            <div className="dash-header">
                <h1 className="dash-title">Welcome back, Student!</h1>
                <p className="dash-subtitle">You're making great progress. Ready to dive into a new subject?</p>
            </div>

            {/* ── Metrics Row ──────────────────────────────────── */}
            <div className="dash-metrics-grid">
                <div className="dash-metric-card">
                    <div className="dash-metric-icon" style={{ background: 'rgba(247, 37, 133, 0.1)', color: 'var(--accent)' }}>
                        <Flame size={20} />
                    </div>
                    <div className="dash-metric-info">
                        <span className="dash-metric-value">5</span>
                        <span className="dash-metric-label">Day Streak</span>
                    </div>
                </div>

                <div className="dash-metric-card">
                    <div className="dash-metric-icon" style={{ background: 'rgba(67, 97, 238, 0.1)', color: 'var(--primary)' }}>
                        <BookOpen size={20} />
                    </div>
                    <div className="dash-metric-info">
                        <span className="dash-metric-value">12</span>
                        <span className="dash-metric-label">Sessions Completed</span>
                    </div>
                </div>

                <div className="dash-metric-card">
                    <div className="dash-metric-icon" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80' }}>
                        <Clock size={20} />
                    </div>
                    <div className="dash-metric-info">
                        <span className="dash-metric-value">4.5h</span>
                        <span className="dash-metric-label">Speaking Time</span>
                    </div>
                </div>
            </div>

            <div className="dash-split-layout">
                <div className="dash-main-column">
                    {/* ── Quick Start ──────────────────────────────────── */}
                    <div className="dash-section">
                        <div className="dash-section-header">
                            <h2>Quick Start</h2>
                            <Link href="/courses" className="dash-link-btn">View All</Link>
                        </div>

                        <div className="dash-quick-grid">
                            <Link href="/board" className="dash-quick-card math">
                                <div className="dash-quick-icon"><Calculator size={24} /></div>
                                <h3>Math Tutor</h3>
                                <p>Algebra, Geometry, Calculus</p>
                            </Link>

                            <Link href="/board" className="dash-quick-card science">
                                <div className="dash-quick-icon"><Atom size={24} /></div>
                                <h3>Science Tutor</h3>
                                <p>Physics, Chemistry, Bio</p>
                            </Link>

                            <Link href="/board" className="dash-quick-card writing">
                                <div className="dash-quick-icon"><BookType size={24} /></div>
                                <h3>Writing Coach</h3>
                                <p>Essays, Grammar, Brainstorming</p>
                            </Link>

                            <Link href="/board" className="dash-quick-card blank">
                                <div className="dash-quick-icon"><Play size={24} /></div>
                                <h3>Blank Canvas</h3>
                                <p>Start from scratch</p>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="dash-side-column">
                    {/* ── Recent Activity ──────────────────────────────── */}
                    <div className="dash-section">
                        <div className="dash-section-header">
                            <h2>Recent Activity</h2>
                        </div>

                        <div className="dash-activity-list">
                            <div className="dash-activity-item">
                                <div className="dash-activity-icon math"><Hash size={16} /></div>
                                <div className="dash-activity-details">
                                    <h4>Pythagorean Theorem</h4>
                                    <span>Yesterday • 45 mins</span>
                                </div>
                                <Link href="/board" className="dash-activity-resume">Resume</Link>
                            </div>

                            <div className="dash-activity-item">
                                <div className="dash-activity-icon science"><Atom size={16} /></div>
                                <div className="dash-activity-details">
                                    <h4>Cell Structure</h4>
                                    <span>2 days ago • 30 mins</span>
                                </div>
                                <Link href="/board" className="dash-activity-resume">Resume</Link>
                            </div>

                            <div className="dash-activity-item">
                                <div className="dash-activity-icon math"><Hash size={16} /></div>
                                <div className="dash-activity-details">
                                    <h4>Basic Algebra Practice</h4>
                                    <span>3 days ago • 1 hour</span>
                                </div>
                                <Link href="/board" className="dash-activity-resume">Resume</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
