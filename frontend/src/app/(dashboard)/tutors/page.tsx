import { Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function TutorsPage() {
    return (
        <div className="dash-page">
            <div className="dash-header" style={{ marginBottom: '40px' }}>
                <h1 className="dash-title">Choose Your Tutor</h1>
                <p className="dash-subtitle">Select an AI persona that best fits your learning style.</p>
            </div>

            <div className="tutor-grid">
                {/* The Guide */}
                <div className="tutor-card guide">
                    <div className="tutor-img-wrapper">
                        <Image src="/persona-guide.png" alt="The Guide Persona" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div className="tutor-content">
                        <h2>The Guide</h2>
                        <span className="tutor-badge">Socratic Method</span>
                        <p>Patient and wise. Asks leading questions to help you arrive at the answer yourself.</p>
                        <Link href="/board" className="tutor-select-btn">
                            Select Tutor <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* The Professor */}
                <div className="tutor-card professor">
                    <div className="tutor-img-wrapper">
                        <Image src="/persona-strict.png" alt="The Professor Persona" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div className="tutor-content">
                        <h2>The Professor</h2>
                        <span className="tutor-badge">Direct & Strict</span>
                        <p>Highly professional and focused on correctness. Explains complex topics directly.</p>
                        <Link href="/board" className="tutor-select-btn">
                            Select Tutor <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>

                {/* The Buddy */}
                <div className="tutor-card buddy">
                    <div className="tutor-img-wrapper">
                        <Image src="/persona-buddy.png" alt="The Buddy Persona" fill style={{ objectFit: 'cover' }} />
                    </div>
                    <div className="tutor-content">
                        <h2>The Buddy</h2>
                        <span className="tutor-badge">High Energy</span>
                        <p>Cheerful and encouraging! Uses emojis, simple analogies, and celebrates your wins.</p>
                        <Link href="/board" className="tutor-select-btn">
                            Select Tutor <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
