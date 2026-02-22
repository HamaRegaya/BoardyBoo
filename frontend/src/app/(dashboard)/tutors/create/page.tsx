"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, User, Mic, FileText, Check, ChevronRight, Paintbrush, BookOpen, Pen, Sparkles, Smile, GraduationCap, Shield, Hexagon, Beaker, Play, SlidersHorizontal, Settings, HelpCircle, PenTool } from "lucide-react";
import "../../dashboard.css";

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
                        <button className="wizard-text-link">Exit</button>
                        <div className="wizard-avatar">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                ) : (
                    <div className="wizard-topbar-actions step2-actions">
                        <Link href="/tutors" className="wizard-back-link">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <div className="wizard-mini-progress">
                            <span className="step-text">Step {step} of 3</span>
                            <div className="mini-bar">
                                <div className="mini-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ── Step 1 Header Info (Only visible on Step 1) ── */}
            {step === 1 && (
                <div className="wizard-header-strip">
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
                </div>
            )}

            {/* ── Main Content Area ── */}
            <div className="wizard-content-area">

                {/* Left Panel: Preview */}
                <div className={`wizard-preview-col ${step > 1 ? 'step-advanced' : ''}`}>
                    {step > 1 && (
                        <div className="preview-header-titles">
                            <h2>{step === 2 ? 'Customize Appearance' : 'Teaching Methodology'}</h2>
                            <p>{step === 2 ? 'Refine the look of your AI companion.' : 'Define how Nova should explain concepts and interact with you during sessions.'}</p>
                        </div>
                    )}

                    <div className="preview-card-wrap">
                        {step === 1 && (
                            <div className="preview-badge-top">
                                <span className="pulse-dot-purple"></span> Live Preview
                            </div>
                        )}

                        <div className={`preview-image-box ${step === 1 ? 'step1-style' : ''}`}>
                            {step === 1 ? (
                                <>
                                    <div className="img-container-inner" style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                                        <Image src="/personas/star.png" alt="Preview Placeholder" layout="fill" objectFit="cover" className="rounded-2xl" />
                                        {/* Floating Decorators matching mockup */}
                                        <div className="floating-icon green-icon left-center"><Settings size={14} /></div>
                                        <div className="floating-icon purple-icon top-right"><Beaker size={14} /></div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Image src="/personas/orb.png" alt="Preview Nova" layout="fill" objectFit="cover" className="rounded-2xl" />
                                    {step === 2 && (
                                        <div className="color-picker-float">
                                            <div className="c-dot purple active"></div>
                                            <div className="c-dot teal"></div>
                                            <div className="c-dot orange"></div>
                                        </div>
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
                        </div>
                        <div className="preview-quote-bottom">
                            "{step === 1 ? "I am beginning to take shape..." : step === 2 ? "Looking good! Let's refine my voice." : "I'm almost ready to start teaching! Just tell me how you learn best."}"
                        </div>
                    </div>
                </div>

                {/* Right Panel: Scrollable Form */}
                <div className="wizard-form-col">

                    {/* STEP 1 FORM */}
                    {step === 1 && (
                        <div className="wizard-form-card fade-in">
                            <div className="form-group">
                                <label className="lbl">Name your tutor</label>
                                <div className="input-box">
                                    <input
                                        type="text"
                                        placeholder="e.g. Nova, Atlas, Sage..."
                                        value={tutorName}
                                        onChange={(e) => setTutorName(e.target.value)}
                                        className="text-input"
                                    />
                                    <Pen size={16} className="text-muted" />
                                </div>
                                <p className="hint-text">This name will be used in all your sessions.</p>
                            </div>

                            <div className="form-group">
                                <div className="lbl-row">
                                    <label className="lbl">Areas of Expertise</label>
                                    <span className="lbl-sub">(Select up to 3)</span>
                                </div>
                                <div className="pills-flex">
                                    {[
                                        { name: 'Physics', icon: <Beaker size={14} /> },
                                        { name: 'Art History', icon: <Paintbrush size={14} /> },
                                        { name: 'Logic', icon: <Hexagon size={14} /> },
                                        { name: 'Programming', icon: <FileText size={14} /> },
                                        { name: 'Linguistics', icon: <BookOpen size={14} /> }
                                    ].map(subj => (
                                        <button
                                            key={subj.name}
                                            onClick={() => toggleExpertise(subj.name)}
                                            className={`pill ${expertise.includes(subj.name) ? 'active' : ''}`}
                                        >
                                            {subj.icon} {subj.name}
                                        </button>
                                    ))}
                                    <button className="pill dashed">
                                        + Add Custom
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="lbl">Core Personality</label>
                                <div className="cards-grid">
                                    {[
                                        { name: "Academic", desc: "Formal, structured, and precise. Focuses on curriculum.", icon: <GraduationCap size={20} className="icon-blue" /> },
                                        { name: "Playful", desc: "Fun, engaging, and uses analogies. Makes learning a game.", icon: <Smile size={20} className="icon-pink" /> },
                                        { name: "Stoic", desc: "Calm, patient, and direct. Focuses on facts and logic.", icon: <Shield size={20} className="icon-slate" /> },
                                        { name: "Enthusiastic", desc: "High energy, motivating, and celebrates every win.", icon: <Sparkles size={20} className="icon-orange" /> }
                                    ].map(p => (
                                        <div
                                            key={p.name}
                                            className={`sel-card ${personality === p.name ? 'active' : ''}`}
                                            onClick={() => setPersonality(p.name)}
                                        >
                                            <div className="sc-icon">{p.icon}</div>
                                            <div className="sc-info">
                                                <h4>{p.name}</h4>
                                                <p>{p.desc}</p>
                                            </div>
                                            <div className={`radio-dot ${personality === p.name ? 'active' : ''}`}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions right">
                                <button className="btn-text">Cancel</button>
                                <button
                                    className="btn-primary"
                                    disabled={!isStep1Valid}
                                    onClick={() => setStep(2)}
                                >
                                    Next: Appearance <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}


                    {/* STEP 2 FORM */}
                    {step === 2 && (
                        <div className="wizard-form-stack fade-in">
                            <div className="wizard-form-card">
                                <div className="fc-header">
                                    <div className="fc-icon"><Mic size={20} /></div>
                                    <div className="fc-title-group">
                                        <h3>Voice Selection</h3>
                                        <p>Choose how your tutor sounds.</p>
                                    </div>
                                </div>
                                <div className="voice-list-vertical">
                                    {[
                                        { name: "Friendly Female", desc: "Warm, encouraging, and clear enunciation." },
                                        { name: "Wise Male", desc: "Deep, authoritative, and paced perfectly for complex topics." },
                                        { name: "Robotic Neutral", desc: "Efficient, precise, and devoid of emotional distraction." },
                                        { name: "Energetic Youth", desc: "Fast-paced, high energy, great for quick review sessions." }
                                    ].map(v => (
                                        <div
                                            key={v.name}
                                            className={`voice-itm ${voice === v.name ? 'active' : ''}`}
                                            onClick={() => setVoice(v.name)}
                                        >
                                            <div className="v-play"><Play size={14} /></div>
                                            <div className="v-info">
                                                <h4>{v.name}</h4>
                                                <p>{v.desc}</p>
                                            </div>
                                            {voice === v.name && <div className="badge-active">Active</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="wizard-form-card">
                                <div className="fc-header split">
                                    <div className="fc-left">
                                        <div className="fc-icon"><SlidersHorizontal size={20} /></div>
                                        <div className="fc-title-group">
                                            <h3>Pitch & Speed</h3>
                                            <p>Fine-tune the audio delivery.</p>
                                        </div>
                                    </div>
                                    <button className="btn-reset">RESET TO DEFAULT</button>
                                </div>

                                <div className="slider-box">
                                    <div className="sb-head">
                                        <span className="sb-label">♪ Pitch</span>
                                        <span className="sb-val">Medium</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100"
                                        value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                                        className="range-inp"
                                    />
                                    <div className="sb-foot"><span>Deep</span><span>High</span></div>
                                </div>

                                <div className="slider-box">
                                    <div className="sb-head">
                                        <span className="sb-label">⚡ Speaking Rate</span>
                                        <span className="sb-val">{speed.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range" min="0.5" max="2.0" step="0.1"
                                        value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
                                        className="range-inp"
                                    />
                                    <div className="sb-foot"><span>Slow (0.5x)</span><span>Fast (2.0x)</span></div>
                                </div>
                            </div>

                            <div className="form-actions split">
                                <button className="btn-outline" onClick={() => setStep(1)}>Back</button>
                                <button className="btn-primary" onClick={() => setStep(3)}>
                                    Continue to Personality <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}


                    {/* STEP 3 FORM */}
                    {step === 3 && (
                        <div className="wizard-form-stack fade-in">
                            <span className="up-label">HOW I LEARN BEST</span>

                            <div className="method-list">
                                {[
                                    { name: "Socratic Method", desc: "Nova will guide you with thought-provoking questions instead of giving answers directly. Best for deep understanding.", icon: <HelpCircle size={18} /> },
                                    { name: "Direct Instruction", desc: "Clear, concise explanations followed by examples. Efficient for learning new facts and procedures quickly.", icon: <GraduationCap size={18} /> },
                                    { name: "Storytelling & Analogy", desc: "Concepts are explained through metaphors, real-world stories, and creative analogies. Great for abstract topics.", icon: <BookOpen size={18} /> }
                                ].map(m => (
                                    <div
                                        key={m.name}
                                        className={`method-itm ${methodology === m.name ? 'active' : ''}`}
                                        onClick={() => setMethodology(m.name)}
                                    >
                                        <div className={`radio-dot ${methodology === m.name ? 'active' : ''}`}></div>
                                        <div className="mi-icon">{m.icon}</div>
                                        <div className="mi-info">
                                            <h4>{m.name}</h4>
                                            <p>{m.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="wizard-form-card">
                                <div className="fc-header split mb-6">
                                    <div className="fc-left">
                                        <div className="fc-icon"><SlidersHorizontal size={20} /></div>
                                        <h3>Tutor Strictness</h3>
                                    </div>
                                    <span className="badge-light">{strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}</span>
                                </div>

                                <input
                                    type="range" min="0" max="100"
                                    value={strictness} onChange={(e) => setStrictness(Number(e.target.value))}
                                    className="range-inp lg"
                                />

                                <div className="strict-labels">
                                    <div className="sl-col"><div>😌</div><span>CHILL</span></div>
                                    <div className="sl-col"><div>⚖️</div><span>BALANCED</span></div>
                                    <div className="sl-col"><div>😤</div><span>DEMANDING</span></div>
                                </div>

                                <div className="strict-desc">
                                    <strong>{strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}:</strong>
                                    {strictness < 33 ? " Nova will be extremely lenient, ignore minor mistakes, and prioritize keeping you motivated." :
                                        strictness > 66 ? " Nova expects perfection, will aggressively correct errors, and assign mandatory follow-up homework." :
                                            " Nova will correct major mistakes but allow you to explore ideas freely. Homework is optional but recommended."}
                                </div>
                            </div>

                            <div className="form-actions center-col">
                                <button className="btn-primary w-full lg-btn">
                                    <Sparkles size={18} /> Bring Nova to Life
                                </button>
                                <button className="btn-text sm">Save as Draft & Continue Later</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
