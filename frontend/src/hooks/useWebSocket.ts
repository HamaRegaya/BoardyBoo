/**
 * useWebSocket — manages the WebSocket connection to the ADK backend.
 *
 * Handles:
 * - Text messages (JSON) and binary audio frames
 * - ADK event parsing and dispatch
 * - Canvas command extraction from tool-call events
 *
 * Usage:
 *   const { status, messages, canvasCommands, connect, ... } = useWebSocket();
 *   connect(url, { onAudio });
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { base64ToArrayBuffer } from "@/lib/utils";
import type {
  TranscriptEntry,
  CanvasCommand,
  ConnectionStatus,
  ConnectOptions,
} from "@/types/whiteboard";

// Re-export types for consumers that import from this hook
export type { TranscriptEntry, CanvasCommand, ConnectionStatus };

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<TranscriptEntry[]>([]);
  const [canvasCommands, setCanvasCommands] = useState<CanvasCommand[]>([]);

  // Refs for mutable input/output transcription tracking
  const currentInputIdRef = useRef<string | null>(null);
  const currentOutputIdRef = useRef<string | null>(null);

  // Store callbacks in refs so the message handler always sees the latest
  const onAudioRef = useRef<((pcm: ArrayBuffer) => void) | undefined>(undefined);

  // ── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback((url: string, opts?: ConnectOptions) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    setStatus("connecting");

    onAudioRef.current = opts?.onAudio;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      setStatus("connected");
      console.log("[WS] Connected to", url);
    };

    ws.onclose = () => {
      setStatus("disconnected");
      console.log("[WS] Disconnected");
    };

    ws.onerror = (e) => {
      console.error("[WS] Error", e);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (event.data instanceof ArrayBuffer) {
        // Binary audio from server
        onAudioRef.current?.(event.data);
        return;
      }

      try {
        const adkEvent = JSON.parse(event.data as string);
        // Debug: log all non-audio events
        if (adkEvent.content?.parts) {
          for (const p of adkEvent.content.parts) {
            if (p.functionCall || p.function_call) {
              console.log("[WS] FunctionCall event:", JSON.stringify(adkEvent).substring(0, 500));
            }
            if (p.functionResponse || p.function_response) {
              console.log("[WS] FunctionResponse event:", JSON.stringify(adkEvent).substring(0, 500));
            }
          }
        }
        handleADKEvent(adkEvent);
      } catch (err) {
        console.warn("[WS] Non-JSON message", err);
      }
    };
  }, []);

  // ── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  // ── Send helpers ─────────────────────────────────────────────────────────

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "text", text }));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text,
          partial: false,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const sendAudio = useCallback((pcmData: ArrayBuffer) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(pcmData);
    }
  }, []);

  const sendImage = useCallback(
    (base64Data: string, mimeType = "image/jpeg") => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "image", data: base64Data, mimeType })
        );
      }
    },
    []
  );

  const sendCanvasSnapshot = useCallback(
    (base64Data: string, mimeType = "image/jpeg") => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({ type: "canvas", data: base64Data, mimeType })
        );
      }
    },
    []
  );

  // ── ADK Event handler ───────────────────────────────────────────────────

  const handleADKEvent = useCallback(
    (event: any) => {
      // Debug: log event keys
      const keys = Object.keys(event).filter(k => event[k] != null);
      if (!keys.every(k => ["id", "timestamp", "author", "invocationId", "actions", "liveSessionResumptionUpdate"].includes(k))) {
        console.log("[ADK Event] keys:", keys.join(", "));
      }

      // ─ Error events ─
      if (event.type === "error") {
        console.warn("[ADK Error]", event);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "agent",
            text: `⚠️ ${event.message}`,
            partial: false,
            timestamp: Date.now(),
          },
        ]);
        return;
      }

      // ─ Input transcription (user speech → text) ─
      if (event.inputTranscription?.text) {
        const text = event.inputTranscription.text;
        const finished = event.inputTranscription.finished;

        if (!currentInputIdRef.current) {
          const id = crypto.randomUUID();
          currentInputIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            { id, role: "user", text, partial: !finished, timestamp: Date.now() },
          ]);
        } else {
          const curId = currentInputIdRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === curId
                ? { ...m, text: m.text + text, partial: !finished }
                : m
            )
          );
        }
        if (finished) currentInputIdRef.current = null;
      }

      // ─ Output transcription (model speech → text) ─
      if (event.outputTranscription?.text) {
        const text = event.outputTranscription.text;
        const finished = event.outputTranscription.finished;

        // Finalize any open input transcription
        if (currentInputIdRef.current && !currentOutputIdRef.current) {
          currentInputIdRef.current = null;
        }

        if (!currentOutputIdRef.current) {
          const id = crypto.randomUUID();
          currentOutputIdRef.current = id;
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: "agent",
              text,
              agentName: event.author,
              partial: !finished,
              timestamp: Date.now(),
            },
          ]);
        } else {
          const curId = currentOutputIdRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === curId
                ? { ...m, text: m.text + text, partial: !finished }
                : m
            )
          );
        }
        if (finished) currentOutputIdRef.current = null;
      }

      // ─ Audio content (inline PCM) ─
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          if (part.inlineData?.mimeType?.startsWith("audio/pcm")) {
            const audioB64 = part.inlineData.data;
            if (audioB64) {
              onAudioRef.current?.(base64ToArrayBuffer(audioB64));
            }
          }
        }
      }

      // ─ Extract canvas commands from function response events ─
      if (event.content?.parts) {
        for (const part of event.content.parts) {
          // Handle both camelCase (by_alias=True) and snake_case keys
          const fnResp = part.functionResponse ?? part.function_response;
          if (fnResp) {
            const resp = fnResp.response;
            console.log(
              "[ADK FnResponse]",
              fnResp.name,
              JSON.stringify(resp)?.substring(0, 300)
            );
            // Extract canvas command if it has elements
            if (resp && Array.isArray(resp.elements)) {
              const cmd: CanvasCommand = {
                tool: resp.tool || fnResp.name || "unknown",
                action: resp.action || "add",
                elements: resp.elements,
              };
              console.log("[Canvas CMD]", cmd.tool, cmd.action, cmd.elements.length, "elements");
              setCanvasCommands((prev) => [...prev, cmd]);
            }
          }
        }
      }

      // ─ Turn complete / interrupted ─
      if (event.turnComplete) {
        currentOutputIdRef.current = null;
      }
      if (event.interrupted) {
        currentOutputIdRef.current = null;
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    status,
    messages,
    canvasCommands,
    connect,
    disconnect,
    sendText,
    sendAudio,
    sendImage,
    sendCanvasSnapshot,
  };
}

// base64ToArrayBuffer is imported from @/lib/utils
