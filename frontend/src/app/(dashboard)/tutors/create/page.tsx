"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Mic, FileText, Check, ChevronRight, Paintbrush, BookOpen, Pen, Sparkles, Smile, GraduationCap, Shield, Hexagon, Beaker, Play, SlidersHorizontal, Settings, HelpCircle, PenTool } from "lucide-react";
import "../tutors.css";

export default function CreateTutorWizard() {
    const [step, setStep] = useState(1);

    // Form State
    const [tutorName, setTutorName] = useState("");
    const [expertise, setExpertise] = useState<string[]>([]);
    const [personality, setPersonality] = useState("Academic");

    // Step 2 State
    const [voice, setVoice] = useState("Friendly Female");
    const [pitch, setPitch] = useState(50);
    const [speed, setSpeed] = useState(1.1);

    // Step 3 State
    const [methodology, setMethodology] = useState("Socratic Method");
    const [strictness, setStrictness] = useState(50);

    const toggleExpertise = (subject: string) => {
        if (expertise.includes(subject)) {
            setExpertise(expertise.filter(e => e !== subject));
        } else if (expertise.length < 3) {
            setExpertise([...expertise, subject]);
        }
    };

    const isStep1Valid = tutorName.trim() !== "" && expertise.length > 0;

    // Animation Variants
    const stepVariants = {
        hidden: { opacity: 0, x: 40, scale: 0.95 },
        visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 30 } },
        exit: { opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.2 } }
    };

    const previewVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { delay: 0.1, type: "spring", stiffness: 200, damping: 20 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    return (
        <div className="wizard-page">
            {/* ── Topbar (Step 2/3 style) ── */}
            <header className="wizard-global-topbar">
                <div className="topbar-logo-zone">
                    <Link href="/" className="dash-brand">
                        <div className="dash-brand-icon"><PenTool size={16} /></div>
                        <span className="dash-brand-name">Magic Whiteboard Tutor</span>
                    </Link>
                </div>

                {step === 1 ? (
                    <div className="wizard-topbar-actions">
                        <button className="wizard-text-link">Save Draft</button>
                        <Link href="/tutors" className="wizard-text-link">Exit</Link>
                        <div className="wizard-avatar">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                ) : (
                    <div className="wizard-topbar-actions step2-actions">
                        <button onClick={() => setStep(step - 1)} className="wizard-back-link">
                            <ArrowLeft size={16} /> Back
                        </button>
                        <div className="wizard-mini-progress">
                            <span className="step-text">Step {step} of 3</span>
                            <div className="mini-bar">
                                <motion.div
                                    className="mini-fill"
                                    initial={{ width: `${((step - 1) / 3) * 100}%` }}
                                    animate={{ width: `${(step / 3) * 100}%` }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Step 1 Header Info (Only visible on Step 1) ── */}
            <AnimatePresence>
                {step === 1 && (
                    <motion.div
                        className="wizard-header-strip"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0, scaleY: 0 }}
                    >
                        <div className="w-header-top">
                            <h2>Create Your AI Tutor</h2>
                            <span className="step-count">Step 1 of 3</span>
                        </div>
                        <div className="w-progress-line">
                            <div className="progress-node active" style={{ width: '33%' }}>
                                <span>CORE IDENTITY</span>
                            </div>
                            <div className="progress-node" style={{ width: '33%' }}>
                                <span>APPEARANCE</span>
                            </div>
                            <div className="progress-node" style={{ width: '33%' }}>
                                <span>KNOWLEDGE BASE</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content Area ── */}
            <div className="wizard-content-area overflow-hidden">

                {/* Left Panel: Preview */}
                <div className={`wizard-preview-col ${step > 1 ? 'step-advanced' : ''}`}>
                    <AnimatePresence mode="wait">
                        {step > 1 && (
                            <motion.div
                                key={`title-${step}`}
                                className="preview-header-titles"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                            >
                                <h2>{step === 2 ? 'Customize Appearance' : 'Teaching Methodology'}</h2>
                                <p>{step === 2 ? 'Refine the look of your AI companion.' : 'Define how your tutor should explain concepts and interact with you during sessions.'}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="preview-card-wrap relative">
                        {step === 1 && (
                            <motion.div className="preview-badge-top" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                <span className="pulse-dot-purple"></span> Live Preview
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`preview-${step}`}
                                className={`preview-image-box ${step === 1 ? 'step1-style' : ''} shadow-2xl relative overflow-hidden`}
                                variants={previewVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {step === 1 ? (
                                    <div className="img-container-inner" style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                                        <Image src="/personas/star.png" alt="Preview Placeholder" fill style={{ objectFit: 'cover' }} className="rounded-2xl" />
                                        {/* Floating Decorators matching mockup */}
                                        <motion.div
                                            className="floating-icon green-icon left-center"
                                            animate={{ y: [-5, 5, -5] }}
                                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                        >
                                            <Settings size={14} />
                                        </motion.div>
                                        <motion.div
                                            className="floating-icon purple-icon top-right"
                                            animate={{ y: [5, -5, 5] }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 1 }}
                                        >
                                            <Beaker size={14} />
                                        </motion.div>

                                        {/* Overlay showing typed title preview */}
                                        <motion.div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/20">
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate">{tutorName || "Tutor Name"}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{expertise.length > 0 ? expertise.join(", ") : "Select expertise"}</p>
                                        </motion.div>

                                    </div>
                                ) : (
                                    <>
                                        <Image src="/personas/orb.png" alt="Preview Nova" fill style={{ objectFit: 'cover' }} className="rounded-2xl" />
                                        {step === 2 && (
                                            <motion.div
                                                className="color-picker-float absolute right-4 top-4 bg-white/90 p-2 rounded-full shadow-lg flex flex-col gap-2"
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white cursor-pointer shadow-sm ring-2 ring-purple-300"></div>
                                                <div className="w-6 h-6 rounded-full bg-teal-400 border-2 border-white cursor-pointer shadow-sm"></div>
                                                <div className="w-6 h-6 rounded-full bg-orange-400 border-2 border-white cursor-pointer shadow-sm"></div>
                                            </motion.div>
                                        )}
                                        {step === 3 && (
                                            <div className="preview-floating-status">
                                                <span className="status-dot green"></span> Ready to Initialize
                                            </div>
                                        )}
                                    </>
                                )}

                                {step === 3 && (
                                    <div className="preview-meta-overlay">
                                        <h3>{tutorName || "Nova"}</h3>
                                        <p>{expertise.join(" • ") || "Astrophysics"} • {personality}</p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`quote-${step}`}
                                className="preview-quote-bottom"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                "{step === 1 ? "I am beginning to take shape..." : step === 2 ? "Looking good! Let's refine my voice." : "I'm almost ready to start teaching! Just tell me how you learn best."}"
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Scrollable Form */}
                <div className="wizard-form-col overflow-x-hidden p-6 relative">
                    <AnimatePresence mode="wait">
                        {/* STEP 1 FORM */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                className="wizard-form-card"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <div className="form-group mb-6">
                                    <label className="fc-title block mb-2 text-sm">Name your tutor</label>
                                    <div className="input-box relative">
                                        <input
                                            type="text"
                                            placeholder="e.g. Nova, Atlas, Sage..."
                                            value={tutorName}
                                            onChange={(e) => setTutorName(e.target.value)}
                                            className="wizard-input"
                                        />
                                        <Pen size={16} className="input-icon" />
                                    </div>
                                    <p className="hint-text">This name will be used in all your sessions.</p>
                                </div>

                                <div className="form-group mb-4">
                                    <div className="lbl-row flex justify-between items-center mb-3">
                                        <label className="fc-title text-sm">Areas of Expertise</label>
                                        <span className="wizard-sub-badge">(Select up to 3)</span>
                                    </div>
                                    <div className="pills-flex flex flex-wrap gap-2">
                                        {[
                                            { name: 'Physics', icon: <Beaker size={14} /> },
                                            { name: 'Art History', icon: <Paintbrush size={14} /> },
                                            { name: 'Logic', icon: <Hexagon size={14} /> },
                                            { name: 'Programming', icon: <FileText size={14} /> },
                                            { name: 'Linguistics', icon: <BookOpen size={14} /> }
                                        ].map(subj => {
                                            const isActive = expertise.includes(subj.name);
                                            return (
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    key={subj.name}
                                                    onClick={() => toggleExpertise(subj.name)}
                                                    className={`wizard-pill ${isActive ? 'active' : ''}`}
                                                >
                                                    {subj.icon} {subj.name}
                                                </motion.button>
                                            );
                                        })}
                                        <motion.button whileHover={{ scale: 1.05 }} className="wizard-pill dashed">
                                            + Add Custom
                                        </motion.button>
                                    </div>
                                </div>

                                <div className="form-group mb-4">
                                    <label className="fc-title block mb-3 text-sm">Core Personality</label>
                                    <div className="cards-grid grid grid-cols-2 gap-4">
                                        {[
                                            { name: "Academic", desc: "Formal, structured, precise.", icon: <GraduationCap size={20} className="text-blue-500" /> },
                                            { name: "Playful", desc: "Fun, engaging, uses analogies.", icon: <Smile size={20} className="text-pink-500" /> },
                                            { name: "Stoic", desc: "Calm, patient, direct.", icon: <Shield size={20} className="text-slate-500" /> },
                                            { name: "Enthusiastic", desc: "High energy, motivating.", icon: <Sparkles size={20} className="text-amber-500" /> }
                                        ].map(p => {
                                            const isActive = personality === p.name;
                                            return (
                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    key={p.name}
                                                    className={`per-card ${isActive ? 'active' : ''}`}
                                                    onClick={() => setPersonality(p.name)}
                                                >
                                                    <div className="per-card-header">
                                                        <div className="per-card-icon">
                                                            {p.icon}
                                                        </div>
                                                        <div className="per-card-radio">
                                                            {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="per-card-radio-inner" />}
                                                        </div>
                                                    </div>
                                                    <div className="per-card-body">
                                                        <h4>{p.name}</h4>
                                                        <p>{p.desc}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="form-actions right flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <button className="wizard-btn-text">Cancel</button>
                                    <motion.button
                                        whileHover={isStep1Valid ? { scale: 1.02 } : {}}
                                        whileTap={isStep1Valid ? { scale: 0.98 } : {}}
                                        className="wizard-btn-primary"
                                        disabled={!isStep1Valid}
                                        onClick={() => setStep(2)}
                                    >
                                        Next: Appearance <ArrowRight size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}


                        {/* STEP 2 FORM */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                className="wizard-form-stack"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <div className="wizard-form-card mb-4">
                                    <div className="fc-header flex gap-4 items-center mb-4">
                                        <div className="fc-icon fc-icon-indigo"><Mic size={20} /></div>
                                        <div className="fc-title-group">
                                            <h3 className="fc-title">Voice Selection</h3>
                                            <p className="fc-desc">Choose how your tutor sounds.</p>
                                        </div>
                                    </div>
                                    <div className="voice-list-vertical flex flex-col gap-3">
                                        {[
                                            { name: "Friendly Female", desc: "Warm, encouraging, and clear enunciation." },
                                            { name: "Wise Male", desc: "Deep, authoritative, and paced perfectly for complex topics." },
                                            { name: "Robotic Neutral", desc: "Efficient, precise, and devoid of emotional distraction." },
                                            { name: "Energetic Youth", desc: "Fast-paced, high energy, great for quick review sessions." }
                                        ].map(v => {
                                            const isActive = voice === v.name;
                                            return (
                                                <motion.div
                                                    whileHover={{ scale: 1.01 }}
                                                    key={v.name}
                                                    className={`voice-itm ${isActive ? 'active' : ''}`}
                                                    onClick={() => setVoice(v.name)}
                                                >
                                                    <div className="v-play"><Play size={14} fill={isActive ? "currentColor" : "none"} /></div>
                                                    <div className="v-info">
                                                        <h4>{v.name}</h4>
                                                        <p>{v.desc}</p>
                                                    </div>
                                                    {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="badge-active">Active</motion.div>}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="wizard-form-card mb-4">
                                    <div className="fc-header split flex justify-between items-center mb-4">
                                        <div className="fc-left flex gap-4 items-center">
                                            <div className="fc-icon fc-icon-slate"><SlidersHorizontal size={20} /></div>
                                            <div className="fc-title-group">
                                                <h3 className="fc-title">Pitch & Speed</h3>
                                                <p className="fc-desc">Fine-tune the audio delivery.</p>
                                            </div>
                                        </div>
                                        <button className="btn-reset-v2">RESET</button>
                                    </div>

                                    <div className="slider-box mb-6">
                                        <div className="sb-head flex justify-between items-center mb-2">
                                            <span className="sb-label font-semibold text-slate-700 dark:text-slate-300">♪ Pitch</span>
                                            <span className="sb-val text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-600">{pitch < 33 ? 'Deep' : pitch > 66 ? 'High' : 'Medium'}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="sb-foot flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>Deep</span><span>High</span></div>
                                    </div>

                                    <div className="slider-box">
                                        <div className="sb-head flex justify-between items-center mb-2">
                                            <span className="sb-label font-semibold text-slate-700 dark:text-slate-300">⚡ Speaking Rate</span>
                                            <span className="sb-val text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-600">{speed.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range" min="0.5" max="2.0" step="0.1"
                                            value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                                            className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="sb-foot flex justify-between text-xs text-slate-400 mt-2 font-medium"><span>Slow (0.5x)</span><span>Fast (2.0x)</span></div>
                                    </div>
                                </div>

                                <div className="form-actions split flex justify-between items-center pt-4">
                                    <button className="wizard-btn-outline" onClick={() => setStep(1)}>Back</button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="wizard-btn-primary"
                                        onClick={() => setStep(3)}
                                    >
                                        Continue to Settings <ArrowRight size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}


                        {/* STEP 3 FORM */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                className="wizard-form-stack"
                                variants={stepVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="up-label-line block"></span>
                                    <span className="fc-section-title">How I Learn Best</span>
                                </div>

                                <div className="method-list flex flex-col gap-3 mb-6">
                                    {[
                                        { name: "Socratic Method", desc: "Guides you with thought-provoking questions. Best for deep understanding.", icon: <HelpCircle size={20} className="text-blue-500" /> },
                                        { name: "Direct Instruction", desc: "Clear explanations followed by examples. Efficient for learning facts.", icon: <GraduationCap size={20} className="text-emerald-500" /> },
                                        { name: "Storytelling & Analogy", desc: "Metaphors and real-world stories. Great for abstract topics.", icon: <BookOpen size={20} className="text-purple-500" /> }
                                    ].map(m => {
                                        const isActive = methodology === m.name;
                                        return (
                                            <motion.div
                                                whileHover={{ scale: 1.01 }}
                                                key={m.name}
                                                className={`method-itm ${isActive ? 'active' : ''}`}
                                                onClick={() => setMethodology(m.name)}
                                            >
                                                <div className="mi-radio">
                                                    {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mi-radio-inner" />}
                                                </div>
                                                <div className="mi-icon">
                                                    {m.icon}
                                                </div>
                                                <div className="mi-info">
                                                    <h4>{m.name}</h4>
                                                    <p>{m.desc}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                <div className="wizard-form-card mb-4">
                                    <div className="fc-header split flex justify-between items-center mb-4">
                                        <div className="fc-left flex gap-4 items-center">
                                            <div className="fc-icon fc-icon-rose"><SlidersHorizontal size={20} /></div>
                                            <h3 className="fc-title">Tutor Strictness</h3>
                                        </div>
                                        <span className={`strict-badge ${strictness < 33 ? 'chill' : strictness > 66 ? 'demanding' : 'balanced'}`}>
                                            {strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}
                                        </span>
                                    </div>

                                    <input
                                        type="range" min="0" max="100"
                                        value={strictness} onChange={(e) => setStrictness(Number(e.target.value))}
                                        className="w-full accent-indigo-600 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer mb-4"
                                    />

                                    <div className="strict-labels flex justify-between mt-2">
                                        <div className="sl-col text-center opacity-70">
                                            <div className="text-2xl mb-1">😌</div>
                                            <span className="text-xs font-bold text-slate-500">CHILL</span>
                                        </div>
                                        <div className="sl-col text-center opacity-70">
                                            <div className="text-2xl mb-1">⚖️</div>
                                            <span className="text-xs font-bold text-slate-500">BALANCED</span>
                                        </div>
                                        <div className="sl-col text-center opacity-70">
                                            <div className="text-2xl mb-1">😤</div>
                                            <span className="text-xs font-bold text-slate-500">DEMANDING</span>
                                        </div>
                                    </div>

                                    <div className="strict-desc mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <strong className="text-slate-700 dark:text-slate-300 mr-2">{strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}:</strong>
                                        <span className="text-slate-500 text-sm">
                                            {strictness < 33 ? ` ${tutorName || 'Your tutor'} will be extremely lenient, ignore minor mistakes, and prioritize keeping you motivated.` :
                                                strictness > 66 ? ` ${tutorName || 'Your tutor'} expects perfection, will aggressively correct errors, and assign mandatory follow-up homework.` :
                                                    ` ${tutorName || 'Your tutor'} will correct major mistakes but allow you to explore ideas freely. Homework is optional but recommended.`}
                                        </span>
                                    </div>
                                </div>

                                <div className="form-actions center-col flex flex-col gap-4 items-center w-full">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="wizard-btn-primary w-btn-lg w-full flex justify-center items-center gap-3"
                                    >
                                        <Sparkles size={20} /> Bring Tutor to Life
                                    </motion.button>
                                    <button className="wizard-btn-text">Save as Draft & Continue Later</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
