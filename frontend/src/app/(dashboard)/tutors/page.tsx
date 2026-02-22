import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function TutorsPage() {
    return (
        <div className="dash-page tutor-pro-page">
            <div className="dash-header" style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 className="dash-title" style={{ fontSize: '36px', marginBottom: '16px' }}>
                    Meet Your Tutors
                </h1>
                <p className="dash-subtitle" style={{ fontSize: '18px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
                    Your journey begins here. Select an AI persona carefully crafted to match your unique learning style and goals.
                </p>
            </div>

            <div className="tutor-grid pro">
                {/* The Guide */}
                <div className="tutor-card pro guide">
                    <div className="tutor-card-bg"></div>
                    <div className="tutor-avatar-circle">
                        <Image src="/personas/owl.png" alt="The Guide Persona" fill style={{ objectFit: 'cover' }} priority />
                    </div>
                    <div className="tutor-content">
                        <div className="tutor-header-info">
                            <h2>The Guide</h2>
                            <span className="tutor-badge socratic"><Sparkles size={12} /> Socratic Method</span>
                        </div>
                        <p>Patient and wise. Asks leading questions to help you arrive at the answer yourself, building deep comprehension.</p>
                        <div className="tutor-actions">
                            <Link href="/tutors/guide" className="tutor-select-btn">
                                View Profile <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* The Professor (Nova) */}
                <div className="tutor-card pro professor">
                    <div className="tutor-card-bg"></div>
                    <div className="tutor-avatar-circle">
                        <Image src="/personas/star.png" alt="Nova Persona" fill style={{ objectFit: 'cover' }} priority />
                    </div>
                    <div className="tutor-content">
                        <div className="tutor-header-info">
                            <h2>Nova</h2>
                            <span className="tutor-badge direct"><Sparkles size={12} /> Direct & Rigorous</span>
                        </div>
                        <p>Highly professional and focused on correctness. Explains complex topics directly and ensures academic excellence.</p>
                        <div className="tutor-actions">
                            <Link href="/tutors/nova" className="tutor-select-btn">
                                View Profile <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* The Buddy */}
                <div className="tutor-card pro buddy">
                    <div className="tutor-card-bg"></div>
                    <div className="tutor-avatar-circle">
                        <Image src="/personas/orb.png" alt="The Buddy Persona" fill style={{ objectFit: 'cover' }} priority />
                    </div>
                    <div className="tutor-content">
                        <div className="tutor-header-info">
                            <h2>The Buddy</h2>
                            <span className="tutor-badge high-energy"><Sparkles size={12} /> High Energy</span>
                        </div>
                        <p>Cheerful and encouraging! Uses simple analogies, celebrates your wins, and makes learning feel like a game.</p>
                        <div className="tutor-actions">
                            <Link href="/tutors/buddy" className="tutor-select-btn">
                                View Profile <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
