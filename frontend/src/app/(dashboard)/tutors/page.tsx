"use client";

import { useState, useMemo } from "react";
import { Sparkles, Search, Plus, X, ChevronDown, Check, Sigma, Flame, Lock, BookOpen, Code, Play, GraduationCap, Star, Lightbulb, Heart, Settings2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "../dashboard.css";

// --- Types & Data ---
type TeachingStyle = {
    icon: string;
    name: string;
    desc: string;
};

export type Tutor = {
    id: string;
    name: string;
    title: string;
    desc: string;
    status: "Active" | "Idle" | "New";
    timeAgo: string;
    tags: { label: string; color: string }[];
    avatar?: string;
    placeholder?: string;
    subjects: string[];
    personality: string;
    level: string;
    stats: { sessions: string; rating: string };
    styles: TeachingStyle[];
};

const INITIAL_TUTORS: Tutor[] = [
    {
        id: "guide",
        name: "Prof. Algebra",
        title: "Your rigorous math professor focused on deep understanding.",
        desc: "Patient math expert specializing in Calculus and Geometry. Explains complex formulas step-by-step.",
        status: "Active",
        timeAgo: "2h ago",
        avatar: "/personas/owl.png",
        subjects: ["Mathematics"],
        personality: "Strict",
        level: "Advanced",
        stats: { sessions: "853", rating: "4.8/5" },
        styles: [
            { icon: "socratic", name: "Socratic Method", desc: "Guides with questions rather than direct answers." },
            { icon: "strict", name: "Structured", desc: "Follows a strict syllabus of progression." }
        ],
        tags: [{ label: "Math", color: "brand" }, { label: "Calculus", color: "gray" }]
    },
    {
        id: "buddy",
        name: "Madame Lingua",
        title: "Native speaker focusing on conversational immersion.",
        desc: "Native French speaker with a strict but effective immersion approach. Great for conversation practice.",
        status: "Idle",
        timeAgo: "1d ago",
        avatar: "/personas/orb.png",
        subjects: ["Languages"],
        personality: "Strict",
        level: "Intermediate",
        stats: { sessions: "412", rating: "4.7/5" },
        styles: [
            { icon: "encouraging", name: "Immersion", desc: "Only speaks the target language for practice." }
        ],
        tags: [{ label: "French", color: "purple" }]
    },
    {
        id: "codebot",
        name: "Code Bot",
        title: "Logical debug assistant and algorithm explainer.",
        desc: "Expert in Python and JavaScript. Helps debug complex logic and explains algorithms visually.",
        status: "Idle",
        timeAgo: "3d ago",
        placeholder: "CB",
        subjects: ["Coding"],
        personality: "Socratic",
        level: "Beginner",
        stats: { sessions: "1,102", rating: "4.9/5" },
        styles: [
            { icon: "socratic", name: "Visualizer", desc: "Breaks code down into logical flowcharts." }
        ],
        tags: [{ label: "Python", color: "yellow" }, { label: "Algorithm", color: "gray" }]
    },
    {
        id: "nova",
        name: "Ms. History",
        title: "Storyteller making history vivid and personal.",
        desc: "Specializes in World War II and Ancient Civilizations. Great storyteller to make history come alive.",
        status: "New",
        timeAgo: "Never",
        avatar: "/personas/star.png",
        subjects: ["History"],
        personality: "Encouraging",
        level: "Beginner",
        stats: { sessions: "0", rating: "N/A" },
        styles: [
            { icon: "encouraging", name: "Storyteller", desc: "Uses narratives to explain historical events." }
        ],
        tags: [{ label: "WWII", color: "red" }]
    },
    {
        id: "physics",
        name: "Dr. Physics",
        title: "Fun, relatable physics expert.",
        desc: "Makes complex physics concepts fun and relatable with real-world examples and interactive tests.",
        status: "Idle",
        timeAgo: "1w ago",
        placeholder: "DP",
        subjects: ["Science"],
        personality: "Humorous",
        level: "Advanced",
        stats: { sessions: "567", rating: "4.6/5" },
        styles: [
            { icon: "encouraging", name: "Practical", desc: "Uses everyday objects for experiments." }
        ],
        tags: [{ label: "Physics", color: "blue" }]
    }
];

const SUBJECT_OPTIONS = ["Mathematics", "Science", "Languages", "Coding", "History"];
const PERSONALITY_OPTIONS = ["Encouraging", "Strict", "Socratic", "Humorous"];

export default function TutorsPage() {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);

    // Filter toggles
    const toggleSubject = (subj: string) => {
        setSelectedSubjects(prev =>
            prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
        );
    };

    const togglePersonality = (pers: string) => {
        setSelectedPersonalities(prev =>
            prev.includes(pers) ? prev.filter(p => p !== pers) : [...prev, pers]
        );
    };

    const clearFilters = () => {
        setSelectedSubjects([]);
        setSelectedPersonalities([]);
        setSearchQuery("");
    };

    // Derived filtering logic
    const filteredTutors = useMemo(() => {
        return INITIAL_TUTORS.filter(tutor => {
            const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) || tutor.desc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSubject = selectedSubjects.length === 0 || tutor.subjects.some(s => selectedSubjects.includes(s));
            const matchesPersonality = selectedPersonalities.length === 0 || selectedPersonalities.includes(tutor.personality);
            return matchesSearch && matchesSubject && matchesPersonality;
        });
    }, [searchQuery, selectedSubjects, selectedPersonalities]);

    // Helpers
    const getSubjectIcon = (subject: string) => {
        switch (subject) {
            case "Mathematics": return <Sigma size={20} />;
            case "Science": return <Flame size={20} />;
            case "Languages": return <BookOpen size={20} />;
            case "Coding": return <Code size={20} />;
            case "History": return <Lock size={20} />;
            default: return <Sparkles size={20} />;
        }
    };

    const getSubjectColorClass = (subject: string) => {
        switch (subject) {
            case "Mathematics": return "math";
            case "Science": return "science";
            case "History": return "history";
            case "Languages": return "math";
            case "Coding": return "science";
            default: return "math";
        }
    };

    const renderStyleIcon = (iconName: string) => {
        switch (iconName) {
            case 'socratic': return <Lightbulb size={24} className="text-amber-500" />;
            case 'strict': return <GraduationCap size={24} className="text-blue-500" />;
            case 'encouraging': return <Heart size={24} className="text-rose-500" />;
            default: return <Sparkles size={24} className="text-indigo-500" />;
        }
    };

    return (
        <div className="dash-page" style={{ padding: '40px 48px' }}>
            <div className="dash-header-area">
                <div className="dash-header-text">
                    <h1 className="dash-title">
                        My Tutors <Sparkles className="sparkle-icon" size={32} />
                    </h1>
                    <p className="dash-subtitle" style={{ marginTop: '6px' }}>Manage your personalized AI learning companions.</p>
                </div>
                <div className="dash-header-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button className="btn-resume" onClick={() => setShowCreateModal(true)} style={{ border: 'none', cursor: 'pointer' }}>
                        <Plus size={18} /> Create New Tutor
                    </button>
                </div>
            </div>

            <div className="dash-split-layout">
                {/* ── Main Tutors Content ──────────────────────────────── */}
                <div className="dash-main-column">
                    <div className="dash-section dash-mastery-section">
                        <div className="dash-section-header">
                            <h2>Your Active Companions</h2>
                            <button onClick={clearFilters} className="dash-link-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Clear Filters</button>
                        </div>

                        <div className="dash-mastery-grid" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'
                        }}>
                            <AnimatePresence mode="popLayout">
                                {filteredTutors.map(tutor => (
                                    <motion.div
                                        key={tutor.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="mastery-card group"
                                        onClick={() => setSelectedTutor(tutor)}
                                        style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
                                    >
                                        <div className="mastery-header">
                                            <div className={`mastery-icon ${getSubjectColorClass(tutor.subjects[0])}`}>
                                                {getSubjectIcon(tutor.subjects[0])}
                                            </div>
                                            <span style={{
                                                fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                                                backgroundColor: tutor.status === 'Active' ? '#d1fae5' : tutor.status === 'New' ? '#ffedd5' : '#f8fafc',
                                                color: tutor.status === 'Active' ? '#059669' : tutor.status === 'New' ? '#ea580c' : '#64748b'
                                            }}>
                                                {tutor.status}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                {tutor.avatar ? (
                                                    <Image src={tutor.avatar} alt={tutor.name} width={40} height={40} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                                ) : (
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>{tutor.placeholder}</span>
                                                )}
                                            </div>
                                            <h3 className="mastery-subject" style={{ margin: 0, fontSize: '18px' }}>{tutor.name}</h3>
                                        </div>

                                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '20px', flex: 1 }}>
                                            {tutor.desc}
                                        </p>

                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                                            {tutor.tags.map((tag, idx) => (
                                                <span key={idx} style={{ background: 'var(--bg-main)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                                                    {tag.label}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))}

                                {filteredTutors.length === 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '20px' }}>
                                        <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No tutors found</h3>
                                        <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or search query.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ── Sidebar Column (Filters) ────────────────────── */}
                <div className="dash-side-column">
                    <div className="dash-sidebar-card">
                        <div className="sidebar-card-header" style={{ marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Search & Filters</h2>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', borderRadius: '12px', padding: '12px 16px' }}>
                                <Search size={16} color="var(--text-muted)" />
                                <input
                                    type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: 'var(--text-main)', fontWeight: 500 }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Subject</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {SUBJECT_OPTIONS.map(subj => (
                                    <label key={subj} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${selectedSubjects.includes(subj) ? 'var(--primary)' : 'var(--border-color)'}`,
                                            background: selectedSubjects.includes(subj) ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                        }}>
                                            {selectedSubjects.includes(subj) && <Check size={12} color="white" strokeWidth={3} />}
                                        </div>
                                        <input type="checkbox" checked={selectedSubjects.includes(subj)} onChange={() => toggleSubject(subj)} style={{ display: 'none' }} />
                                        {subj}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Personality</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {PERSONALITY_OPTIONS.map(pers => (
                                    <label key={pers} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${selectedPersonalities.includes(pers) ? 'var(--primary)' : 'var(--border-color)'}`,
                                            background: selectedPersonalities.includes(pers) ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                        }}>
                                            {selectedPersonalities.includes(pers) && <Check size={12} color="white" strokeWidth={3} />}
                                        </div>
                                        <input type="checkbox" checked={selectedPersonalities.includes(pers)} onChange={() => togglePersonality(pers)} style={{ display: 'none' }} />
                                        {pers}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="dash-sidebar-card" style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, #f0efff 100%)', border: '1px solid var(--primary-light)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Need a specific expert?</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                            You can create a fully custom AI tutor with specific knowledge bases, personalities, and teaching styles.
                        </p>
                        <button onClick={() => setShowCreateModal(true)} style={{ width: '100%', background: 'white', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', fontSize: '14px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            Create Custom Tutor
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Custom Tutor Profile Modal ──────────────────────────────── */}
            <AnimatePresence>
                {selectedTutor && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000 }}
                            onClick={() => setSelectedTutor(null)}
                        />
                        {/* Modal Dialog */}
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, pointerEvents: 'none', padding: '24px'
                        }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                style={{
                                    background: 'var(--bg-card)', borderRadius: '24px', width: '100%', maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto',
                                    boxShadow: '0 24px 50px rgba(0,0,0,0.15)', pointerEvents: 'auto', border: '1px solid var(--border-color)', padding: '0', display: 'flex', flexDirection: 'column'
                                }}
                            >
                                {/* Header / Close Button Layer */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0', zIndex: 2 }}>
                                    <button onClick={() => setSelectedTutor(null)} style={{ background: 'var(--bg-main)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} className="hover:bg-[#e2e8f0]">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', padding: '0 32px 32px' }}>

                                    {/* Modal Left Column (Avatar/Stats) */}
                                    <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ background: 'var(--bg-main)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#059669', padding: '4px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: 700, marginBottom: '24px' }}>
                                                <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span> Online
                                            </div>
                                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#fff', border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', overflow: 'hidden' }}>
                                                {selectedTutor.avatar ? (
                                                    <Image src={selectedTutor.avatar} alt={selectedTutor.name} width={120} height={120} style={{ objectFit: 'contain' }} />
                                                ) : <span style={{ fontSize: '32px', color: 'var(--text-muted)', fontWeight: 700 }}>{selectedTutor.placeholder}</span>}
                                            </div>
                                            <button style={{ background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} className="hover:bg-slate-50 transition-colors">
                                                <Play size={14} fill="currentColor" /> Voice Sample
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <GraduationCap size={20} className="text-indigo-500" style={{ margin: '0 auto 8px' }} />
                                                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>{selectedTutor.stats.sessions}</h3>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>SESSIONS</span>
                                            </div>
                                            <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                                                <Star size={20} className="text-amber-500" style={{ margin: '0 auto 8px' }} />
                                                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>{selectedTutor.stats.rating}</h3>
                                                <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>RATING</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Modal Right Column (Details/Settings) */}
                                    <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column' }}>
                                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 8px', letterSpacing: '-0.5px' }}>Meet {selectedTutor.name}</h1>
                                        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: '0 0 24px', fontWeight: 500, lineHeight: '1.5' }}>{selectedTutor.title}</p>

                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                                            {selectedTutor.subjects.map(s => (
                                                <span key={s} style={{ background: '#e0e7ff', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {getSubjectIcon(s)} {s}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ marginBottom: '32px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                                <Sparkles size={18} className="text-primary" /> Teaching Style
                                            </h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                {selectedTutor.styles.map(style => (
                                                    <div key={style.name} style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                                            {renderStyleIcon(style.icon)}
                                                        </div>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{style.name}</h4>
                                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{style.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                                <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Settings2 size={18} className="text-primary" /> Session Settings
                                                </h3>
                                            </div>

                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                                                    <span style={{ color: 'var(--text-main)' }}>Speaking Speed</span>
                                                    <span style={{ color: 'var(--primary)' }}>Normal (1x)</span>
                                                </div>
                                                <input type="range" className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" defaultValue="50" min="0" max="100" />
                                            </div>

                                            <div style={{ marginBottom: '32px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
                                                    <span style={{ color: 'var(--text-main)' }}>Explanation Depth</span>
                                                    <span style={{ color: 'var(--primary)' }}>Detailed</span>
                                                </div>
                                                <input type="range" className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" defaultValue="100" min="0" max="100" />
                                            </div>

                                            <Link href="/board" onClick={() => setSelectedTutor(null)} style={{ background: 'var(--primary)', color: 'white', padding: '16px 24px', borderRadius: '12px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }} className="hover:-translate-y-1 hover:bg-[#4338ca]">
                                                Start Learning Session <ArrowRight size={18} />
                                            </Link>
                                        </div>

                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Create Modal Overlay (Existing) ──────────────────────────────── */}
            <AnimatePresence>
                {/* Omitted unchanged create modal implementation details to prevent redundant bloat. Copied previous logic. */}
                {showCreateModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 1000 }} onClick={() => setShowCreateModal(false)} />
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, pointerEvents: 'none' }}>
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 50px rgba(0,0,0,0.15)', pointerEvents: 'auto', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>Create New Tutor</h2>
                                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>Configure a personalized learning companion.</p>
                                    </div>
                                    <button onClick={() => setShowCreateModal(false)} style={{ background: 'var(--bg-main)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} className="hover:bg-[#e2e8f0]">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Name Your Tutor</label>
                                        <input type="text" placeholder="e.g. Sir Isaac Newton" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 500 }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Subject Expertise</label>
                                            <div style={{ position: 'relative' }}>
                                                <select defaultValue="" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', background: 'var(--bg-main)', appearance: 'none', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer' }}>
                                                    <option value="" disabled>Select subject</option>
                                                    {SUBJECT_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                                                </select>
                                                <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-main)' }}>Personality Style</label>
                                            <div style={{ position: 'relative' }}>
                                                <select defaultValue="" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '15px', background: 'var(--bg-main)', appearance: 'none', color: 'var(--text-main)', fontWeight: 500, cursor: 'pointer' }}>
                                                    <option value="" disabled>Select style</option>
                                                    {PERSONALITY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                                                </select>
                                                <ChevronDown size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ paddingTop: '8px', display: 'flex', gap: '12px' }}>
                                        <button className="btn-resume cursor-pointer" style={{ flex: 1, justifyContent: 'center', border: 'none', padding: '14px' }} onClick={() => setShowCreateModal(false)}>
                                            Generate Tutor <Sparkles size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
