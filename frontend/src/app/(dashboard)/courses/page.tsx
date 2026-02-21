import { GraduationCap } from "lucide-react";

export default function CoursesPage() {
    return (
        <div className="dash-page" style={{ height: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--fg-muted)' }}>
            <GraduationCap size={48} style={{ opacity: 0.2, marginBottom: '24px' }} />
            <h1 className="dash-title" style={{ color: 'var(--fg-main)' }}>Courses</h1>
            <p className="dash-subtitle" style={{ maxWidth: '400px', margin: '0 auto' }}>
                Structured AI-guided curriculums for Math, Science, and more are currently under construction. Check back soon!
            </p>
        </div>
    );
}
