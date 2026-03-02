"use client";

/**
 * TranscriptPanel — lesson activity feed with timeline-style entries.
 */

import { useEffect, useRef, useState } from "react";
import type { TranscriptEntry } from "@/hooks/useWebSocket";

interface Props {
  messages: TranscriptEntry[];
  onSendText: (text: string) => void;
  /** Google profile photo URL for the signed-in user. */
  userPhotoURL?: string;
}

export default function TranscriptPanel({ messages, onSendText, userPhotoURL }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setInput("");
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`panel-container ${collapsed ? "collapsed" : ""}`}>
      <button
        className="panel-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Show panel" : "Hide panel"}
      >
        {collapsed ? "◀" : "▶"}
      </button>

      <div className="panel-header">
        <div className="panel-header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <span className="panel-header-text">Lesson Activity</span>
        <span className="panel-msg-count">{messages.length}</span>
      </div>

      <div className="activity-feed" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ced4da" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <p>Draw on the whiteboard or start talking to your tutor</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`activity-item ${m.role} ${m.partial ? "partial" : ""}`}>
            <div className="activity-avatar">
              {m.role === "user" ? (
                userPhotoURL ? (
                  <img src={userPhotoURL} alt="You" width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                )
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-3H7V9h10v2zm0-3H7V6h10v2z"/></svg>
              )}
            </div>
            <div className="activity-content">
              <div className="activity-meta">
                <span className="activity-sender">
                  {m.role === "user" ? "You" : m.agentName || "Tutor"}
                </span>
                <span className="activity-time">{formatTime(m.timestamp)}</span>
              </div>
              <div className="activity-text">
                {m.text}
                {m.partial && <span className="typing-dots"><span/><span/><span/></span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form className="panel-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ask your tutor…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  );
}
