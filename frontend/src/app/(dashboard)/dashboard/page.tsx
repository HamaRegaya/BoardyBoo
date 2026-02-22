import { Play, Calendar, Bell, Sparkles, Sigma, Flame, Lock, Info, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function DashboardPage() {
    return (
        <div className="dash-page">
            {/* ── Header Area ──────────────────────────────────── */}
            <div className="dash-header-area">
                <div className="dash-header-text">
                    <h1 className="dash-title">
                        Good morning, Alex! <Sparkles className="sparkle-icon" size={32} />
                    </h1>
                    <p className="dash-subtitle">Ready to continue your mastery journey?</p>
                </div>
                <div className="dash-daily-goal">
                    <div className="goal-circle">
                        <span>85%</span>
                    </div>
                    <div className="goal-text">
                        <span className="goal-label">DAILY GOAL</span>
                        <span className="goal-status">Almost there!</span>
                    </div>
                </div>
            </div>

            <div className="dash-split-layout">
                <div className="dash-main-column">
                    {/* ── Continue Journey Card ──────────────────────────────────── */}
                    <div className="dash-continue-card">
                        <div className="continue-image">
                            <Image
                                src="/images/math_blackboard.png"
                                alt="Quadratic Equations"
                                width={300}
                                height={240}
                                className="board-img"
                            />
                            <div className="continue-paused">
                                <span className="paused-dot"></span>
                                Paused 2h ago
                            </div>
                        </div>
                        <div className="continue-content">
                            <div className="continue-tags">
                                <span className="tag-subject">MATH 101</span>
                                <span className="tag-chapter">• Chapter 4</span>
                            </div>
                            <h2 className="continue-title">Quadratic<br />Equations</h2>
                            <p className="continue-desc">
                                Mastering the quadratic formula and understanding parabolas in real-world...
                            </p>
                            <div className="continue-actions">
                                <Link href="/board" className="btn-resume">
                                    <Play size={18} fill="currentColor" /> Resume Session
                                </Link>
                                <button className="btn-info">
                                    <Info size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Subject Mastery ──────────────────────────────────── */}
                    <div className="dash-section dash-mastery-section">
                        <div className="dash-section-header">
                            <h2>Subject Mastery</h2>
                            <Link href="/courses" className="dash-link-btn">View All</Link>
                        </div>

                        <div className="dash-mastery-grid">
                            <div className="mastery-card">
                                <div className="mastery-header">
                                    <div className="mastery-icon math">
                                        <Sigma size={20} />
                                    </div>
                                    <span className="mastery-percent">92%</span>
                                </div>
                                <h3 className="mastery-subject">Mathematics</h3>
                                <div className="mastery-progress-track">
                                    <div className="mastery-progress-fill math" style={{ width: '92%' }}></div>
                                </div>
                                <div className="mastery-trend positive">
                                    ↗ +4% this week
                                </div>
                            </div>

                            <div className="mastery-card">
                                <div className="mastery-header">
                                    <div className="mastery-icon science">
                                        <Flame size={20} />
                                    </div>
                                    <span className="mastery-percent">78%</span>
                                </div>
                                <h3 className="mastery-subject">Science</h3>
                                <div className="mastery-progress-track">
                                    <div className="mastery-progress-fill science" style={{ width: '78%' }}></div>
                                </div>
                                <div className="mastery-trend stable">
                                    — Stable
                                </div>
                            </div>

                            <div className="mastery-card">
                                <div className="mastery-header">
                                    <div className="mastery-icon history">
                                        <Lock size={20} />
                                    </div>
                                    <span className="mastery-percent">88%</span>
                                </div>
                                <h3 className="mastery-subject">History</h3>
                                <div className="mastery-progress-track">
                                    <div className="mastery-progress-fill history" style={{ width: '88%' }}></div>
                                </div>
                                <div className="mastery-trend positive">
                                    ↗ +12% this week
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent Achievements ──────────────────────────────────── */}
                    <div className="dash-achievements-banner">
                        <div className="achievements-icon-main">
                            <div className="award-badge">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15l-3 4-2-1-1-2 4-3" /><path d="M12 15l3 4 2-1 1-2-4-3" /><circle cx="12" cy="8" r="5" fill="#FFD166" /></svg>
                            </div>
                        </div>
                        <div className="achievements-text">
                            <h3>Recent Achievements</h3>
                            <p>You unlocked 2 new badges this week!</p>
                        </div>
                        <div className="achievements-badges">
                            <div className="circle-badge sigma"><Sigma size={18} /></div>
                            <div className="circle-badge flame"><Flame size={18} /></div>
                            <div className="circle-badge locked"><Lock size={18} /></div>
                        </div>
                    </div>
                </div>

                <div className="dash-side-column">
                    {/* ── Upcoming Sessions ──────────────────────────────── */}
                    <div className="dash-sidebar-card upcoming-card">
                        <div className="sidebar-card-header">
                            <h2>Upcoming Sessions</h2>
                            <button className="icon-btn"><Calendar size={18} /></button>
                        </div>
                        <div className="upcoming-list">
                            <div className="upcoming-item">
                                <div className="upcoming-avatar">
                                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Tutor" width={40} height={40} className="avatar-img" />
                                    <div className="status-dot online"></div>
                                </div>
                                <div className="upcoming-info">
                                    <h4>Calculus Re...</h4>
                                    <p>w/ Mr. Davis</p>
                                </div>
                                <div className="upcoming-time">
                                    <span className="time">10:00</span>
                                    <span className="ampm">AM</span>
                                </div>
                            </div>

                            <div className="upcoming-item">
                                <div className="upcoming-avatar">
                                    <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Tutor" width={40} height={40} className="avatar-img" />
                                </div>
                                <div className="upcoming-info">
                                    <h4>Chemistry L...</h4>
                                    <p>w/ Dr. Lee</p>
                                </div>
                                <div className="upcoming-time">
                                    <span className="time">02:00</span>
                                    <span className="ampm">PM</span>
                                </div>
                            </div>
                        </div>
                        <button className="btn-book-session">
                            <Plus size={16} /> Book a Session
                        </button>
                    </div>

                    {/* ── Daily AI Tip ──────────────────────────────── */}
                    <div className="dash-sidebar-card daily-tip-card">
                        <div className="tip-header">
                            <div className="tip-icon-container">
                                <Sparkles size={16} />
                            </div>
                            <span className="tip-label">DAILY AI TIP</span>
                        </div>
                        <h3 className="tip-title">Solving Complex Equations</h3>
                        <p className="tip-text">
                            Try breaking down complex equations into smaller, manageable steps. Isolate the variable one operation at a time to avoid sign errors!
                        </p>
                        <button className="btn-save-notes">Save to Notes</button>
                    </div>

                    {/* ── Next Test ──────────────────────────────── */}
                    <div className="dash-sidebar-card next-test-card">
                        <div className="next-test-info">
                            <span className="test-label">NEXT TEST</span>
                            <h3 className="test-title">Physics Midterm</h3>
                            <p className="test-countdown">in 3 days</p>
                        </div>
                        <div className="test-bell">
                            <Bell size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
