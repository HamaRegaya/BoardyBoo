import { Play } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="dash-page">
            <div className="dash-header">
                <h1 className="dash-title">Welcome back!</h1>
                <p className="dash-subtitle">Ready to dive into a new subject?</p>
            </div>

            <div className="dash-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '32px' }}>
                <div className="dash-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Quick Start</h2>
                    <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginBottom: '24px' }}>Jump straight into a blank interactive whiteboard.</p>
                    <Link href="/board" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
                        <Play size={16} /> Open Whiteboard
                    </Link>
                </div>

                <div className="dash-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Learning Streak</h2>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent)' }}>3</span>
                        <span style={{ color: 'var(--fg-muted)', fontWeight: 500 }}>Days</span>
                    </div>
                    <p style={{ color: 'var(--fg-muted)', fontSize: '14px', marginTop: '8px' }}>You're on a roll! Keep coming back to build your knowledge.</p>
                </div>
            </div>
        </div>
    );
}
