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
import Toolbar from "@/components/Toolbar";
import TranscriptPanel from "@/components/TranscriptPanel";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudio } from "@/hooks/useAudio";
import type { WhiteboardCanvasRef } from "@/components/WhiteboardCanvas";

// Dynamic import — Excalidraw cannot be SSR'd
const WhiteboardCanvas = dynamic(
  () => import("@/components/WhiteboardCanvas"),
  { ssr: false }
);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export default function Page() {
  // Stable session identifiers
  const [userId] = useState(() => `user-${generateId()}`);
  const [sessionId] = useState(() => `sess-${generateId()}`);

  const canvasRef = useRef<WhiteboardCanvasRef>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Snapshot auto-send interval ref
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── WebSocket hook ──────────────────────────────────────────────────────

  const {
    status,
    messages,
    canvasCommands,
    connect,
    disconnect,
    sendText,
    sendAudio,
    sendImage,
    sendCanvasSnapshot,
  } = useWebSocket();

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

  const handleConnect = useCallback(() => {
    const url = `${WS_URL}/ws/${userId}/${sessionId}`;
    connect(url, {
      onAudio: (audioData: ArrayBuffer) => {
        playAudioChunk(audioData);
      },
    });
    initPlayer();
  }, [connect, userId, sessionId, initPlayer, playAudioChunk]);

  // ── Disconnect handler ──────────────────────────────────────────────────

  const handleDisconnect = useCallback(() => {
    // Stop mic
    if (isRecording) {
      stopRecording();
      setIsRecording(false);
    }
    // Stop auto-snapshots
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }
    disconnect();
    clearPlayback();
  }, [disconnect, isRecording, stopRecording, clearPlayback]);

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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="app-layout">
      <Toolbar
        status={status}
        isRecording={isRecording}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onToggleMic={handleToggleMic}
        onSendSnapshot={handleSendSnapshot}
      />

      <div className="content-area">
        {/* Canvas panel */}
        <div className="canvas-panel">
          <WhiteboardCanvas ref={canvasRef} canvasCommands={canvasCommands} />
        </div>

        {/* Side panel — transcript */}
        <div className="side-panel">
          <TranscriptPanel messages={messages} onSendText={sendText} />
        </div>
      </div>
    </main>
  );
}
