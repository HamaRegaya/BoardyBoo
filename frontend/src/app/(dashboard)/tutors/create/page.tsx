"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, User, Mic, FileText, Check, ChevronRight, Paintbrush, BookOpen, Pen, Sparkles, Smile, GraduationCap, Shield, Hexagon } from "lucide-react";
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
            {/* ── Wizard Header ─────────────────────────────────────── */}
            <div className="wizard-header">
                <Link href="/tutors" className="wizard-back">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>

                <div className="wizard-progress-container">
                    <div className="wizard-step-info">
                        <h2>{step === 1 ? "Create Your AI Tutor" : step === 2 ? "Customize Appearance" : "Teaching Methodology"}</h2>
                        <span className="step-count">Step {step} of 3</span>
                    </div>

                    <div className="wizard-progress-bar">
                        <div className={`progress-segment ${step >= 1 ? 'active' : ''}`}>
                            <span className="segment-label">CORE IDENTITY</span>
                        </div>
                        <div className={`progress-segment ${step >= 2 ? 'active' : ''}`}>
                            <span className="segment-label">APPEARANCE</span>
                        </div>
                        <div className={`progress-segment ${step >= 3 ? 'active' : ''}`}>
                            <span className="segment-label">KNOWLEDGE BASE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Wizard Content Split ──────────────────────────────── */}
            <div className="wizard-content">

                {/* Left Panel: Sticky Live Preview */}
                <div className="wizard-preview-panel">
                    <div className="preview-card">
                        <div className="preview-badge">
                            <span className="pulse-dot"></span> Live Preview
                        </div>

                        <div className="preview-image-wrapper">
                            {/* In a real app, this image would update based on 'Appearance' selections */}
                            {step === 1 ? (
                                <Image src="/personas/star.png" alt="Preview Placeholder" layout="fill" objectFit="contain" className="fade-in" />
                            ) : (
                                <Image src="/personas/orb.png" alt="Preview Nova" layout="fill" objectFit="cover" className="fade-in rounded-img" />
                            )}

                            {step === 3 && (
                                <div className="preview-floating-status">
                                    <span className="status-dot green"></span> Ready to Initialize
                                </div>
                            )}
                        </div>

                        {step === 3 && (
                            <div className="preview-details fade-in">
                                <h3>{tutorName || "Nova"}</h3>
                                <p>{expertise.join(" • ") || "Astrophysics"} • {personality}</p>
                            </div>
                        )}

                        <div className="preview-quote">
                            "{step === 1 ? "I am beginning to take shape..." : step === 2 ? "Looking good! Let's refine my voice." : "I'm almost ready to start teaching! Just tell me how you learn best."}"
                        </div>
                    </div>
                </div>

                {/* Right Panel: Scrollable Form Areas */}
                <div className="wizard-form-panel">

                    {/* ── Step 1: Core Identity ── */}
                    {step === 1 && (
                        <div className="wizard-step-form fade-in">
                            <div className="form-section">
                                <label className="form-label">Name your tutor</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        placeholder="e.g. Nova, Atlas, Sage..."
                                        value={tutorName}
                                        onChange={(e) => setTutorName(e.target.value)}
                                        className="wizard-input"
                                    />
                                    <Pen size={14} className="input-icon" />
                                </div>
                                <p className="form-hint">This name will be used in all your sessions.</p>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Areas of Expertise <span className="label-sub">(Select up to 3)</span></label>
                                <div className="pills-grid">
                                    {['Physics', 'Art History', 'Logic', 'Programming', 'Linguistics'].map(subject => (
                                        <button
                                            key={subject}
                                            onClick={() => toggleExpertise(subject)}
                                            className={`expertise-pill ${expertise.includes(subject) ? 'selected' : ''}`}
                                        >
                                            <BookOpen size={14} /> {subject}
                                        </button>
                                    ))}
                                    <button className="expertise-pill dashed">
                                        + Add Custom
                                    </button>
                                </div>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Core Personality</label>
                                <div className="radio-cards-grid">
                                    {[
                                        { name: "Academic", desc: "Formal, structured, and precise. Focuses on curriculum.", icon: <GraduationCap size={20} className="text-blue" /> },
                                        { name: "Playful", desc: "Fun, engaging, and uses analogies. Makes learning a game.", icon: <Smile size={20} className="text-pink" /> },
                                        { name: "Stoic", desc: "Calm, patient, and direct. Focuses on facts and logic.", icon: <Shield size={20} className="text-slate" /> },
                                        { name: "Enthusiastic", desc: "High energy, motivating, and celebrates every win.", icon: <Sparkles size={20} className="text-orange" /> }
                                    ].map(p => (
                                        <div
                                            key={p.name}
                                            className={`radio-card ${personality === p.name ? 'selected' : ''}`}
                                            onClick={() => setPersonality(p.name)}
                                        >
                                            <div className="radio-card-header">
                                                <div className="rc-icon">{p.icon}</div>
                                                <div className={`rc-circle ${personality === p.name ? 'checked' : ''}`}></div>
                                            </div>
                                            <div className="rc-content">
                                                <h4>{p.name}</h4>
                                                <p>{p.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="wizard-footer space-between">
                                <button className="wizard-btn-ghost">Cancel</button>
                                <button
                                    className="wizard-btn-primary"
                                    disabled={!isStep1Valid}
                                    onClick={() => setStep(2)}
                                >
                                    Next: Appearance <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ── Step 2: Appearance ── */}
                    {step === 2 && (
                        <div className="wizard-step-form fade-in">
                            <div className="form-card-section">
                                <div className="fcs-header">
                                    <div className="fcs-icon"><Mic size={18} className="text-primary" /></div>
                                    <div className="fcs-titles">
                                        <h3>Voice Selection</h3>
                                        <p>Choose how your tutor sounds.</p>
                                    </div>
                                </div>
                                <div className="voice-list">
                                    {[
                                        { name: "Friendly Female", desc: "Warm, encouraging, and clear enunciation." },
                                        { name: "Wise Male", desc: "Deep, authoritative, and paced perfectly for complex topics." },
                                        { name: "Robotic Neutral", desc: "Efficient, precise, and devoid of emotional distraction." },
                                        { name: "Energetic Youth", desc: "Fast-paced, high energy, great for quick review sessions." }
                                    ].map(v => (
                                        <div
                                            key={v.name}
                                            className={`voice-row ${voice === v.name ? 'selected' : ''}`}
                                            onClick={() => setVoice(v.name)}
                                        >
                                            <div className="play-btn-circle">▶</div>
                                            <div className="vr-content">
                                                <h4>{v.name}</h4>
                                                <p>{v.desc}</p>
                                            </div>
                                            {voice === v.name && <span className="vr-active-badge">Active</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-card-section">
                                <div className="fcs-header-controls">
                                    <div className="fcs-titles-left">
                                        <div className="fcs-icon"><Hexagon size={18} className="text-primary" /></div>
                                        <div className="fcs-titles">
                                            <h3>Pitch & Speed</h3>
                                            <p>Fine-tune the audio delivery.</p>
                                        </div>
                                    </div>
                                    <button className="reset-btn">RESET TO DEFAULT</button>
                                </div>

                                <div className="slider-group">
                                    <div className="slider-header">
                                        <span className="sh-label">♪ Pitch</span>
                                        <span className="sh-value bg-gray">Medium</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={pitch}
                                        onChange={(e) => setPitch(Number(e.target.value))}
                                        className="custom-range"
                                    />
                                    <div className="slider-labels">
                                        <span>Deep</span>
                                        <span>High</span>
                                    </div>
                                </div>

                                <div className="slider-group">
                                    <div className="slider-header">
                                        <span className="sh-label">⚡ Speaking Rate</span>
                                        <span className="sh-value bg-gray">{speed.toFixed(1)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.5" max="2.0" step="0.1"
                                        value={speed}
                                        onChange={(e) => setSpeed(Number(e.target.value))}
                                        className="custom-range"
                                    />
                                    <div className="slider-labels">
                                        <span>Slow (0.5x)</span>
                                        <span>Fast (2.0x)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="wizard-footer space-between">
                                <button className="wizard-btn-outline" onClick={() => setStep(1)}>Back</button>
                                <button className="wizard-btn-primary" onClick={() => setStep(3)}>
                                    Continue to Personality <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ── Step 3: Knowledge Base ── */}
                    {step === 3 && (
                        <div className="wizard-step-form fade-in">

                            <h4 className="top-label-caps">HOW I LEARN BEST</h4>
                            <div className="methodology-list">
                                {[
                                    { name: "Socratic Method", desc: "Nova will guide you with thought-provoking questions instead of giving answers directly. Best for deep understanding." },
                                    { name: "Direct Instruction", desc: "Clear, concise explanations followed by examples. Efficient for learning new facts and procedures quickly." },
                                    { name: "Storytelling & Analogy", desc: "Concepts are explained through metaphors, real-world stories, and creative analogies. Great for abstract topics." }
                                ].map(m => (
                                    <div
                                        key={m.name}
                                        className={`method-row ${methodology === m.name ? 'selected' : ''}`}
                                        onClick={() => setMethodology(m.name)}
                                    >
                                        <div className={`radio-circle ${methodology === m.name ? 'checked' : ''}`}></div>
                                        <div className="mr-content">
                                            <h4>{m.name}</h4>
                                            <p>{m.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="form-card-section">
                                <div className="fcs-header-controls">
                                    <div className="fcs-titles-left">
                                        <div className="fcs-icon"><FileText size={18} className="text-primary" /></div>
                                        <div className="fcs-titles">
                                            <h3>Tutor Strictness</h3>
                                        </div>
                                    </div>
                                    <span className="sh-value bg-blue-light">{strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}</span>
                                </div>

                                <input
                                    type="range"
                                    min="0" max="100"
                                    value={strictness}
                                    onChange={(e) => setStrictness(Number(e.target.value))}
                                    className="custom-range mt-4"
                                />
                                <div className="slider-labels-images mt-2">
                                    <div className="sl-img text-center">
                                        <div>😌</div>
                                        <span>CHILL</span>
                                    </div>
                                    <div className="sl-img text-center">
                                        <div>⚖️</div>
                                        <span>BALANCED</span>
                                    </div>
                                    <div className="sl-img text-center">
                                        <div>😤</div>
                                        <span>DEMANDING</span>
                                    </div>
                                </div>

                                <div className="info-box-gray mt-4">
                                    <strong>{strictness < 33 ? 'Chill' : strictness > 66 ? 'Demanding' : 'Balanced'}:</strong>
                                    {strictness < 33 ? " Nova will be extremely lenient, ignore minor mistakes, and prioritize keeping you motivated." :
                                        strictness > 66 ? " Nova expects perfection, will aggressively correct errors, and assign mandatory follow-up homework." :
                                            " Nova will correct major mistakes but allow you to explore ideas freely. Homework is optional but recommended."}
                                </div>
                            </div>

                            <div className="wizard-footer center-col">
                                <button className="wizard-btn-primary full-width large">
                                    <Sparkles size={18} /> Bring Nova to Life
                                </button>
                                <button className="wizard-btn-ghost mt-2 text-sm">Save as Draft & Continue Later</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
