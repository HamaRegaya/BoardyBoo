"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Sparkles, Search, Plus, X, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import "./tutors.css";

// --- Mock Data for Tutors ---
type Tutor = {
    id: string;
    name: string;
    desc: string;
    href: string;
    status: "Active" | "Idle" | "New";
    timeAgo: string;
    tags: { label: string; color: string }[];
    avatar?: string;
    placeholder?: string;
    subjects: string[];
    personality: string;
    level: string;
};

const INITIAL_TUTORS: Tutor[] = [
    {
        id: "guide",
        name: "Prof. Algebra",
        desc: "Patient math expert specializing in Calculus and Geometry...",
        href: "/tutors/guide",
        status: "Active",
        timeAgo: "2h ago",
        avatar: "/personas/owl.png",
        subjects: ["Mathematics"],
        personality: "Strict",
        level: "Advanced",
        tags: [
            { label: "Math", color: "brand" },
            { label: "Calculus", color: "gray" },
            { label: "Visual", color: "gray" },
        ]
    },
    {
        id: "buddy",
        name: "Madame Lingua",
        desc: "Native French speaker with a strict but effective immersion approach...",
        href: "/tutors/buddy",
        status: "Idle",
        timeAgo: "1d ago",
        avatar: "/personas/orb.png",
        subjects: ["Languages"],
        personality: "Strict",
        level: "Intermediate",
        tags: [
            { label: "French", color: "purple" },
            { label: "Strict", color: "gray" },
        ]
    },
    {
        id: "codebot",
        name: "Code Bot",
        desc: "Expert in Python and JavaScript. Helps debug complex logic...",
        href: "/tutors/codebot",
        status: "Idle",
        timeAgo: "3d ago",
        placeholder: "CB",
        subjects: ["Coding"],
        personality: "Socratic",
        level: "Beginner",
        tags: [
            { label: "Coding", color: "yellow" },
            { label: "Python", color: "gray" },
        ]
    },
    {
        id: "nova",
        name: "Ms. History",
        desc: "Specializes in World War II and Ancient Civilizations. Great storyteller...",
        href: "/tutors/nova",
        status: "New",
        timeAgo: "Never",
        avatar: "/personas/star.png",
        subjects: ["History"],
        personality: "Encouraging",
        level: "Beginner",
        tags: [
            { label: "History", color: "red" },
            { label: "Socratic", color: "gray" },
        ]
    },
    {
        id: "physics",
        name: "Dr. Physics",
        desc: "Makes complex physics concepts fun and relatable with real-world...",
        href: "/tutors/physics",
        status: "Idle",
        timeAgo: "1w ago",
        placeholder: "DP",
        subjects: ["Science"],
        personality: "Humorous",
        level: "Advanced",
        tags: [
            { label: "Science", color: "blue" },
            { label: "Physics", color: "gray" },
        ]
    }
];

const SUBJECT_OPTIONS = ["Mathematics", "Science", "Languages", "Coding", "History"];
const PERSONALITY_OPTIONS = ["Encouraging", "Strict", "Socratic", "Humorous"];

export default function TutorsPage() {
    // --- State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);

    // Filter toggle handlers
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
            // Search Match
            const matchesSearch = tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) || tutor.desc.toLowerCase().includes(searchQuery.toLowerCase());

            // Filters
            const matchesSubject = selectedSubjects.length === 0 || tutor.subjects.some(s => selectedSubjects.includes(s));
            const matchesPersonality = selectedPersonalities.length === 0 || selectedPersonalities.includes(tutor.personality);

            return matchesSearch && matchesSubject && matchesPersonality;
        });
    }, [searchQuery, selectedSubjects, selectedPersonalities]);

    const activeFilterCount = selectedSubjects.length + selectedPersonalities.length;

    return (
        <div className="tutors-v2-page">

            {/* ── Inner Left Sidebar (Filters) ────────────────────── */}
            <motion.aside
                className="tutors-filter-sidebar"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className="filter-group">
                    <h3 className="filter-title">FILTERS</h3>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Subject</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                    <div className="filter-options">
                        {SUBJECT_OPTIONS.map(subj => {
                            const isChecked = selectedSubjects.includes(subj);
                            return (
                                <label key={subj} className="checkbox-label" onClick={(e) => { e.preventDefault(); toggleSubject(subj); }}>
                                    <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                                        {isChecked && <Check size={10} />}
                                    </div>
                                    <span>{subj}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Personality</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                    <div className="filter-options">
                        {PERSONALITY_OPTIONS.map(pers => {
                            const isChecked = selectedPersonalities.includes(pers);
                            return (
                                <label key={pers} className="checkbox-label" onClick={(e) => { e.preventDefault(); togglePersonality(pers); }}>
                                    <div className={`custom-checkbox ${isChecked ? 'checked' : ''}`}>
                                        {isChecked && <Check size={10} />}
                                    </div>
                                    <span>{pers}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="filter-group collapsible">
                    <div className="filter-header">
                        <h4>Level</h4>
                        <ChevronDown size={14} className="filter-chevron" />
                    </div>
                </div>

                <div className="upgrade-card mt-auto">
                    <p className="upgrade-title">Need a custom tutor?</p>
                    <button className="upgrade-btn">Upgrade Plan</button>
                </div>
            </motion.aside>

            {/* ── Main Tutors Content ──────────────────────────────── */}
            <main className="tutors-main-content">

                {/* Header Section */}
                <motion.div
                    className="tutors-header-section"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <div className="tutors-header-titles">
                        <h1>My Tutors</h1>
                        <p>Manage your AI learning companions and track progress.</p>
                    </div>
                    <div className="tutors-header-actions">
                        <div className="search-bar">
                            <Search size={16} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search tutors..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Link href="/tutors/create" className="primary-btn-new">
                            <Plus size={16} /> Create New Tutor
                        </Link>
                    </div>
                </motion.div>

                {/* Active Filters */}
                <AnimatePresence>
                    {activeFilterCount > 0 && (
                        <motion.div
                            className="active-filters"
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: "auto", opacity: 1, marginBottom: 32 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        >
                            {selectedSubjects.map(subj => (
                                <motion.span key={subj} className="filter-pill" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                                    {subj} <X size={12} className="remove-icon" onClick={() => toggleSubject(subj)} />
                                </motion.span>
                            ))}
                            {selectedPersonalities.map(pers => (
                                <motion.span key={pers} className="filter-pill" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                                    {pers} <X size={12} className="remove-icon" onClick={() => togglePersonality(pers)} />
                                </motion.span>
                            ))}
                            <button className="clear-filters" onClick={clearFilters}>Clear all</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tutors Grid */}
                <motion.div
                    className="tutors-grid-v2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredTutors.map(tutor => (
                            <motion.div
                                key={tutor.id}
                                layout
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <Link href={tutor.href} className="tutor-card-v2 group">
                                    <div className="card-top">
                                        <div className="avatar-small overflow-hidden ring-2 ring-transparent group-hover:ring-indigo-500 transition-all duration-300">
                                            {tutor.avatar ? (
                                                <Image src={tutor.avatar} alt={tutor.name} fill style={{ objectFit: 'cover' }} className="group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="placeholder-avatar group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 transition-colors duration-300">{tutor.placeholder}</div>
                                            )}
                                        </div>
                                        <div className="status-info">
                                            <span className={`status-badge-mini ${tutor.status.toLowerCase()}`}>{tutor.status}</span>
                                            <span className="status-time">{tutor.timeAgo}</span>
                                        </div>
                                    </div>
                                    <div className="card-middle">
                                        <h3 className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">{tutor.name}</h3>
                                        <p>{tutor.desc}</p>
                                    </div>
                                    <div className="card-bottom">
                                        {tutor.tags.map((tag, idx) => (
                                            <span key={idx} className={`tag-pill color-${tag.color}`}>{tag.label}</span>
                                        ))}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}

                        {/* Always show Create Card at the end */}
                        <motion.div
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        >
                            <Link href="/tutors/create" className="tutor-card-v2 create-card group">
                                <div className="create-icon-wrapper group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300">
                                    <Plus size={24} className="create-plus group-hover:text-white" />
                                </div>
                                <h3 className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">Create Tutor</h3>
                                <p>Design a new AI companion tailored to your needs.</p>
                            </Link>
                        </motion.div>

                    </AnimatePresence>

                    {filteredTutors.length === 0 && (
                        <motion.div
                            className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center gap-4"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                <Search size={24} />
                            </div>
                            <p className="text-lg font-medium">No tutors found matching your criteria.</p>
                            <button onClick={clearFilters} className="text-indigo-600 hover:underline font-semibold text-sm">Clear all filters</button>
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}

