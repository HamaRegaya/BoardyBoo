import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function TutorsPage() {
    return (
        <div className="dash-page tutor-enhanced-page">
            <div className="dash-header" style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 className="dash-title" style={{ fontSize: '42px', marginBottom: '16px' }}>Meet Your Tutors</h1>
                <p className="dash-subtitle" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    Select an AI persona that perfectly matches your learning style. Each tutor has a unique personality and teaching method.
                </p>
            </div>

            <div className="tutor-grid enhanced">
                {/* The Guide */}
                <div className="tutor-card enhanced guide">
                    <div className="tutor-glow-bg"></div>
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/owl.png" alt="The Guide Persona" fill style={{ objectFit: 'contain', padding: '20px' }} priority />
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
                <div className="tutor-card enhanced professor">
                    <div className="tutor-glow-bg"></div>
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/star.png" alt="The Professor Persona" fill style={{ objectFit: 'contain', padding: '20px' }} priority />
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
                <div className="tutor-card enhanced buddy">
                    <div className="tutor-glow-bg"></div>
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/orb.png" alt="The Buddy Persona" fill style={{ objectFit: 'contain', padding: '20px' }} priority />
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
