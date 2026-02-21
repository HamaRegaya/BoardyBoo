import { Settings } from "lucide-react";

export default function ProfilePage() {
    return (
        <div className="dash-page" style={{ height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--fg-muted)' }}>
            <Settings size={48} style={{ opacity: 0.2, marginBottom: '24px' }} />
            <h1 className="dash-title" style={{ color: 'var(--fg-main)' }}>Settings & Profile</h1>
            <p className="dash-subtitle" style={{ maxWidth: '400px', margin: '0 auto' }}>
                Manage your learning goals, preferred subjects, and account settings. Coming soon!
            </p>
        </div>
    );
}
