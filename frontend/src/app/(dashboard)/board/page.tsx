"use client";

/**
 * Main page — composes Toolbar, WhiteboardCanvas, and TranscriptPanel.
 *
 * Wires the useWebSocket and useAudio hooks together so that:
 *  - Mic audio → WebSocket → ADK
 *  - ADK audio → speaker
 *  - ADK canvas commands → Excalidraw
 *  - Transcript messages rendered in side panel
 */

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import TranscriptPanel from "@/components/TranscriptPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudio } from "@/hooks/useAudio";
import { useAuth } from "@/components/AuthProvider";
import type { WhiteboardCanvasRef } from "@/components/WhiteboardCanvas";
import { WS_URL } from "@/lib/constants";
import { generateId, base64ToArrayBuffer } from "@/lib/utils";

// Dynamic import — Excalidraw cannot be SSR'd
const WhiteboardCanvas = dynamic(
  () => import("@/components/WhiteboardCanvas"),
  { ssr: false }
);

// WS_URL and generateId are imported from @/lib/constants and @/lib/utils

export default function Page() {
  // Stable session identifiers
  const [userId] = useState(() => `user-${generateId()}`);
  const [sessionId] = useState(() => `sess-${generateId()}`);

  const canvasRef = useRef<WhiteboardCanvasRef>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Snapshot auto-send interval ref
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── WebSocket hook ──────────────────────────────────────────────────────

  const {
    status,
    messages,
    canvasCommands,
    isGeneratingImage,
    isSavingProgress,
    connect,
    disconnect,
    sendText,
    sendAudio,
    sendImage,
    sendCanvasSnapshot,
  } = useWebSocket();

  // ── Auth hook ───────────────────────────────────────────────────────────
  const { user, getToken } = useAuth();

  // ── Audio hook ──────────────────────────────────────────────────────────

  const {
    startRecording,
    stopRecording,
    initPlayer,
    playAudioChunk,
    clearPlayback,
    cleanup: cleanupAudio,
  } = useAudio();

  // ── Apply canvas commands from the AI ───────────────────────────────────
  // Canvas commands are now passed as props to WhiteboardCanvas
  // (bypasses the dynamic import ref-forwarding issue)

  // ── Forward audio events received from WebSocket to the player ─────────

  // The useWebSocket hook exposes audio via the onAudio callback
  // registered at connect-time (see handleConnect).

  // ── Connect handler ─────────────────────────────────────────────────────

  const handleConnect = useCallback(async () => {
    if (!user) return; // Wait for auth

    try {
      const token = await getToken();
      if (!token) {
        console.error("Missing auth token, cannot connect.");
        return;
      }
      
      const url = `${WS_URL}/ws/${user.uid}/${sessionId}?token=${token}`;
      connect(url, {
        onAudio: (audioData: ArrayBuffer) => {
          playAudioChunk(audioData);
        },
        onInterrupt: clearPlayback, // Flush the ring buffer when ADK signals an interrupt
        onToolAudio: (base64Data: string) => {
          const pcm = base64ToArrayBuffer(base64Data);
          playAudioChunk(pcm);
        },
      });
      initPlayer();
    } catch (err) {
      console.error("Failed to acquire token or connect:", err);
    }
  }, [connect, user, sessionId, getToken, initPlayer, playAudioChunk]);

  // ── Camera handlers ─────────────────────────────────────────────────────

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const captureAndSend = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    sendImage(base64, "image/jpeg");
    // Flash effect for user feedback
    if (videoRef.current) {
      videoRef.current.style.opacity = "0.3";
      setTimeout(() => {
        if (videoRef.current) videoRef.current.style.opacity = "1";
      }, 150);
    }
  }, [sendImage]);

  // ── Disconnect handler ──────────────────────────────────────────────────

  const handleDisconnect = useCallback(() => {
    // Stop mic
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    }
    // Stop camera
    closeCamera();
    // Stop auto-snapshots
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
    disconnect();
    clearPlayback();
  }, [disconnect, isRecording, stopRecording, clearPlayback, closeCamera]);

  // ── Mic toggle ──────────────────────────────────────────────────────────

  const handleToggleMic = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    } else {
      await startRecording((pcmData: ArrayBuffer) => {
        sendAudio(pcmData);
      });
      setIsRecording(true);
    }
  }, [isRecording, startRecording, stopRecording, sendAudio]);

  // ── Send canvas snapshot ────────────────────────────────────────────────

  const handleSendSnapshot = useCallback(async () => {
    const snapshot = await canvasRef.current?.getSnapshot();
    if (snapshot) {
      sendImage(snapshot, "image/jpeg");
    }
  }, [sendImage]);

  // ── Auto-start mic when session connects ─────────────────────────────────

  useEffect(() => {
    if (status === "connected" && !isRecording) {
      startRecording((pcmData: ArrayBuffer) => {
        sendAudio(pcmData);
      }).then(() => {
        setIsRecording(true);
      }).catch((err) => {
        console.error("Failed to auto-start microphone:", err);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // ── Auto-snapshot (every 30 s) when connected ───────────────────────────

  useEffect(() => {
    if (status === "connected") {
      snapshotIntervalRef.current = setInterval(async () => {
        const snapshot = await canvasRef.current?.getSnapshot();
        if (snapshot) {
          sendCanvasSnapshot(snapshot);
        }
      }, 30_000);
    } else if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }

    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, [status, sendCanvasSnapshot]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // ── Derived state ─────────────────────────────────────────────────────
  const connected = status === "connected";

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="app-layout">
      {/* Floating session controls — replaces the old full-width Toolbar */}
      <div className="session-bar">
        <div className={`status-pill ${status}`}>
          <span className="status-dot-inner" />
          <span>
            {status === "connected"
              ? "Live Session"
              : status === "connecting"
              ? "Connecting…"
              : "No Session"}
          </span>
        </div>

        {!connected ? (
          <button
            className="btn btn-start"
            onClick={handleConnect}
            disabled={status === "connecting"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            {status === "connecting" ? "Connecting…" : "Start Session"}
          </button>
        ) : (
          <div className="session-bar-actions">
            <button
              className="toolbar-action-btn"
              onClick={handleSendSnapshot}
              title="Send canvas snapshot to tutor"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <span>Snapshot</span>
            </button>

            <button
              className={`toolbar-action-btn ${isCameraOpen ? "camera-active" : ""}`}
              onClick={isCameraOpen ? closeCamera : openCamera}
              title={isCameraOpen ? "Close camera" : "Show your homework to the tutor"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isCameraOpen ? (
                  <><path d="M16.5 9.4l-2-1.3a2 2 0 0 0-3 1.7v4.4a2 2 0 0 0 3 1.7l2-1.3"/><rect x="2" y="6" width="12" height="12" rx="2"/><line x1="1" y1="1" x2="23" y2="23"/></>
                ) : (
                  <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>
                )}
              </svg>
              <span>{isCameraOpen ? "Close" : "Camera"}</span>
            </button>

            <button
              className={`toolbar-mic-btn ${isRecording ? "active" : ""}`}
              onClick={handleToggleMic}
              title={isRecording ? "Mute microphone" : "Unmute microphone"}
            >
              {isRecording ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
              <span>{isRecording ? "Listening" : "Muted"}</span>
            </button>

            <button className="toolbar-action-btn danger" onClick={handleDisconnect}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
              <span>End</span>
            </button>
          </div>
        )}
      </div>

      <div className="content-area">
        {/* Camera preview overlay */}
        {isCameraOpen && (
          <div className="camera-preview">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
            <div className="camera-controls">
              <button className="camera-capture-btn" onClick={captureAndSend} title="Send to tutor">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                Send to Tutor
              </button>
              <button className="camera-close-btn" onClick={closeCamera}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Canvas panel */}
        <div className="canvas-panel">
          <WhiteboardCanvas ref={canvasRef} canvasCommands={canvasCommands} isGeneratingImage={isGeneratingImage} />
        </div>

        {/* Side panel — transcript */}
        <div className="side-panel">
          <TranscriptPanel messages={messages} onSendText={sendText} userPhotoURL={user?.photoURL || undefined} />
        </div>
      </div>
    </main>
  );
}
