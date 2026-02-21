import { Users } from "lucide-react";

export default function TutorsPage() {
    return (
        <div className="dash-page" style={{ height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--fg-muted)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '24px' }} />
            <h1 className="dash-title" style={{ color: 'var(--fg-main)' }}>AI Personas</h1>
            <p className="dash-subtitle" style={{ maxWidth: '400px', margin: '0 auto' }}>
                Select different tutoring styles (e.g., Socratic Guide, Strict Professor) before launching a session. Coming soon!
            </p>
        </div>
    );
}
