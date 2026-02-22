import { ArrowRight, Sparkles, Search, Plus, X, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function TutorsPage() {
    return (
        <div className="dash-page tutors-v2-page">

            {/* ── Inner Left Sidebar (Filters) ────────────────────── */}
            <aside className="tutors-filter-sidebar">
                <div className="filter-group">
                    <h3 className="filter-title">FILTERS</h3>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Subject</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                    <div className="filter-options">
                        <label className="checkbox-label">
                            <div className="custom-checkbox checked"><Check size={10} /></div>
                            <span>Mathematics</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>Science</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox checked"><Check size={10} /></div>
                            <span>Languages</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>Coding</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>History</span>
                        </label>
                    </div>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Personality</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                    <div className="filter-options">
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>Encouraging</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>Strict</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox checked"><Check size={10} /></div>
                            <span>Socratic</span>
                        </label>
                        <label className="checkbox-label">
                            <div className="custom-checkbox"></div>
                            <span>Humorous</span>
                        </label>
                    </div>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Level</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                </div>

                <div className="upgrade-card">
                    <p className="upgrade-title">Need a custom tutor?</p>
                    <button className="upgrade-btn">Upgrade Plan</button>
                </div>
            </aside>

            {/* ── Main Tutors Content ──────────────────────────────── */}
            <main className="tutors-main-content">

                {/* Header Section */}
                <div className="tutors-header-section">
                    <div className="tutors-header-titles">
                        <h1>My Tutors</h1>
                        <p>Manage your AI learning companions and track progress.</p>
                    </div>
                    <div className="tutors-header-actions">
                        <div className="search-bar">
                            <Search size={16} className="search-icon" />
                            <input type="text" placeholder="Search tutors..." />
                        </div>
                        <button className="primary-btn-new">
                            <Plus size={16} /> Create New Tutor
                        </button>
                    </div>
                </div>

                {/* Active Filters */}
                <div className="active-filters">
                    <span className="filter-pill">Math <X size={12} className="remove-icon" /></span>
                    <span className="filter-pill">Languages <X size={12} className="remove-icon" /></span>
                    <button className="clear-filters">Clear all</button>
                </div>

                {/* Tutors Grid */}
                <div className="tutors-grid-v2">

                    {/* Card 1: The Guide / Prof. Algebra */}
                    <Link href="/tutors/guide" className="tutor-card-v2">
                        <div className="card-top">
                            <div className="avatar-small">
                                <Image src="/personas/owl.png" alt="Prof Algebra" fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div className="status-info">
                                <span className="status-badge-mini active">Active</span>
                                <span className="status-time">2h ago</span>
                            </div>
                        </div>
                        <div className="card-middle">
                            <h3>Prof. Algebra</h3>
                            <p>Patient math expert specializing in Calculus and Geometry...</p>
                        </div>
                        <div className="card-bottom">
                            <span className="tag-pill color-brand">Math</span>
                            <span className="tag-pill color-gray">Calculus</span>
                            <span className="tag-pill color-gray">Visual</span>
                        </div>
                    </Link>

                    {/* Card 2: The Buddy / Madame Lingua */}
                    <Link href="/tutors/buddy" className="tutor-card-v2">
                        <div className="card-top">
                            <div className="avatar-small">
                                <Image src="/personas/orb.png" alt="Madame Lingua" fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div className="status-info">
                                <span className="status-badge-mini idle">Idle</span>
                                <span className="status-time">1d ago</span>
                            </div>
                        </div>
                        <div className="card-middle">
                            <h3>Madame Lingua</h3>
                            <p>Native French speaker with a strict but effective immersion approach...</p>
                        </div>
                        <div className="card-bottom">
                            <span className="tag-pill color-purple">French</span>
                            <span className="tag-pill color-gray">Strict</span>
                        </div>
                    </Link>

                    {/* Card 3: Code Bot */}
                    <Link href="/tutors/codebot" className="tutor-card-v2">
                        <div className="card-top">
                            <div className="avatar-small">
                                <div className="placeholder-avatar">CB</div>
                            </div>
                            <div className="status-info">
                                <span className="status-badge-mini idle">Idle</span>
                                <span className="status-time">3d ago</span>
                            </div>
                        </div>
                        <div className="card-middle">
                            <h3>Code Bot</h3>
                            <p>Expert in Python and JavaScript. Helps debug complex logic...</p>
                        </div>
                        <div className="card-bottom">
                            <span className="tag-pill color-yellow">Coding</span>
                            <span className="tag-pill color-gray">Python</span>
                        </div>
                    </Link>

                    {/* Card 4: Nova / Ms. History */}
                    <Link href="/tutors/nova" className="tutor-card-v2">
                        <div className="card-top">
                            <div className="avatar-small">
                                <Image src="/personas/star.png" alt="Ms History" fill style={{ objectFit: 'cover' }} />
                            </div>
                            <div className="status-info">
                                <span className="status-badge-mini new">New</span>
                                <span className="status-time">Never</span>
                            </div>
                        </div>
                        <div className="card-middle">
                            <h3>Ms. History</h3>
                            <p>Specializes in World War II and Ancient Civilizations. Great storyteller...</p>
                        </div>
                        <div className="card-bottom">
                            <span className="tag-pill color-red">History</span>
                            <span className="tag-pill color-gray">Socratic</span>
                        </div>
                    </Link>

                    {/* Card 5: Dr. Physics */}
                    <Link href="/tutors/physics" className="tutor-card-v2">
                        <div className="card-top">
                            <div className="avatar-small">
                                <div className="placeholder-avatar">DP</div>
                            </div>
                            <div className="status-info">
                                <span className="status-badge-mini idle">Idle</span>
                                <span className="status-time">1w ago</span>
                            </div>
                        </div>
                        <div className="card-middle">
                            <h3>Dr. Physics</h3>
                            <p>Makes complex physics concepts fun and relatable with real-world...</p>
                        </div>
                        <div className="card-bottom">
                            <span className="tag-pill color-blue">Science</span>
                            <span className="tag-pill color-gray">Physics</span>
                        </div>
                    </Link>

                    {/* Create New Card */}
                    <div className="tutor-card-v2 create-card">
                        <div className="create-icon-wrapper">
                            <Plus size={24} className="create-plus" />
                        </div>
                        <h3>Create Tutor</h3>
                        <p>Design a new AI companion tailored to your needs.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}
