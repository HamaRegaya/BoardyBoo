import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import "../dashboard.css";

export default function TutorsPage() {
    return (
        <div className="dash-page tutor-minimal-page">
            <div className="dash-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 className="dash-title" style={{ fontSize: '32px', marginBottom: '12px' }}>Meet Your Tutors</h1>
                <p className="dash-subtitle" style={{ fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    Select an AI persona that perfectly matches your learning style.
                </p>
            </div>

            <div className="tutor-grid minimal">
                {/* The Guide */}
                <div className="tutor-card minimal guide">
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/owl.png" alt="The Guide Persona" fill style={{ objectFit: 'contain', padding: '10px' }} priority />
                    </div>
                    <div className="tutor-content">
                        <h2>The Guide</h2>
                        <p>Patient and wise. Uses the Socratic method.</p>
                        <Link href="/tutors/guide" className="tutor-select-btn">
                            View Profile <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* The Professor */}
                <div className="tutor-card minimal professor">
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/star.png" alt="The Professor Persona" fill style={{ objectFit: 'contain', padding: '10px' }} priority />
                    </div>
                    <div className="tutor-content">
                        <h2>Nova</h2>
                        <p>Direct, professional, and rigorous.</p>
                        <Link href="/tutors/nova" className="tutor-select-btn">
                            View Profile <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* The Buddy */}
                <div className="tutor-card minimal buddy">
                    <div className="tutor-img-wrapper">
                        <Image src="/personas/orb.png" alt="The Buddy Persona" fill style={{ objectFit: 'contain', padding: '10px' }} priority />
                    </div>
                    <div className="tutor-content">
                        <h2>The Buddy</h2>
                        <p>High energy, cheerful, and encouraging!</p>
                        <Link href="/tutors/buddy" className="tutor-select-btn">
                            View Profile <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
