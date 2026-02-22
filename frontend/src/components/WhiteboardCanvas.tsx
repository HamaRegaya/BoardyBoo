"use client";

/**
 * WhiteboardCanvas — wraps Excalidraw with canvas-command handling.
 *
 * Receives canvas commands as a prop and applies them to Excalidraw.
 * Uses `convertToExcalidrawElements` (official Excalidraw utility) to
 * create properly-formed elements from minimal AI-generated skeletons.
 * Also exposes getSnapshot via ref for canvas export.
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import "@excalidraw/excalidraw/index.css";
import type { CanvasCommand } from "@/hooks/useWebSocket";

export interface WhiteboardCanvasRef {
  getSnapshot: () => Promise<string | null>;
}

interface Props {
  canvasCommands: CanvasCommand[];
  onCanvasChange?: () => void;
}

const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, Props>(
  ({ canvasCommands, onCanvasChange }, ref) => {
    const [ready, setReady] = useState(false);
    const apiRef = useRef<any>(null);
    const [ExcalidrawComp, setExcalidrawComp] = useState<any>(null);
    const convertRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const lastAppliedRef = useRef(0);

    // Load Excalidraw + convertToExcalidrawElements once
    useEffect(() => {
      const timer = setTimeout(() => {
        setMounted(true);
        import("@excalidraw/excalidraw").then((mod) => {
          setExcalidrawComp(() => mod.Excalidraw);
          convertRef.current = mod.convertToExcalidrawElements;
          console.log(
            "[Canvas] Excalidraw module loaded, convertToExcalidrawElements available:",
            typeof mod.convertToExcalidrawElements === "function"
          );
        });
      }, 100);
      return () => clearTimeout(timer);
    }, []);

    // ── Convert AI element descriptors → Excalidraw element skeletons ─────
    //    Then pass through convertToExcalidrawElements for proper creation

    const toExcalidrawElements = useCallback((aiElements: any[]) => {
      const convert = convertRef.current;

      // Separate image elements (handled manually) from standard elements
      const imageElements: any[] = [];
      const standardElements: any[] = [];

      for (const el of aiElements) {
        if (el.type === "image") {
          imageElements.push(el);
        } else {
          standardElements.push(el);
        }
      }

      // Build skeletons for standard elements
      const skeletons = standardElements.map((el: any) => {
        const base: any = {
          type: el.type || "text",
          x: el.x ?? 0,
          y: el.y ?? 0,
          strokeColor: el.strokeColor ?? "#1e1e1e",
          backgroundColor: el.backgroundColor ?? "transparent",
          fillStyle: el.fillStyle ?? "hachure",
          opacity: el.opacity ?? 100,
        };

        if (el.width != null) base.width = el.width;
        if (el.height != null) base.height = el.height;

        // Text elements
        if (base.type === "text") {
          base.text = el.text ?? "";
          base.fontSize = el.fontSize ?? 20;
          base.fontFamily = el.fontFamily ?? 1;
        }

        // Arrow/line elements
        if (base.type === "arrow" || base.type === "line") {
          base.points = el.points ?? [
            [0, 0],
            [el.width ?? 100, el.height ?? 50],
          ];
        }

        // Freedraw
        if (base.type === "freedraw") {
          base.points = el.points ?? [[0, 0]];
        }

        return base;
      });

      // Convert standard elements via Excalidraw's official converter
      let convertedStandard: any[] = [];
      if (skeletons.length > 0) {
        if (convert) {
          try {
            convertedStandard = convert(skeletons, { regenerateIds: true });
            console.log(`[Canvas] convertToExcalidrawElements: ${skeletons.length} skeletons → ${convertedStandard.length} elements`);
          } catch (err) {
            console.warn("[Canvas] convertToExcalidrawElements failed, falling back:", err);
            convertedStandard = skeletons;
          }
        } else {
          convertedStandard = skeletons;
        }
      }

      // Build image elements manually (convertToExcalidrawElements doesn't support images)
      let nextId = Date.now();
      const convertedImages = imageElements.map((el: any) => ({
        type: "image" as const,
        id: `ai-img-${nextId++}`,
        x: el.x ?? 0,
        y: el.y ?? 0,
        width: el.width ?? 400,
        height: el.height ?? 300,
        fileId: el.fileId,
        status: "saved",
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: Math.floor(Math.random() * 100000),
        isDeleted: false,
        groupIds: [],
        boundElements: null,
        link: null,
        locked: false,
        angle: 0,
        strokeColor: "transparent",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 0,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
      }));

      if (convertedImages.length > 0) {
        console.log(`[Canvas] Created ${convertedImages.length} image element(s)`);
      }

      return [...convertedStandard, ...convertedImages];
    }, []);

    // ── Apply canvas commands when they arrive or API becomes ready ───────

    useEffect(() => {
      const api = apiRef.current;
      if (!api || !ready) {
        if (canvasCommands.length > lastAppliedRef.current) {
          console.log(
            `[Canvas] ${canvasCommands.length - lastAppliedRef.current} commands queued, waiting for API (ready=${ready})`
          );
        }
        return;
      }

      for (let i = lastAppliedRef.current; i < canvasCommands.length; i++) {
        const cmd = canvasCommands[i];
        console.log(
          `[Canvas] Applying cmd #${i}: tool=${cmd.tool} action=${cmd.action} elements=${cmd.elements?.length}`
        );

        if (cmd.action === "clear") {
          api.updateScene({ elements: [] });
          continue;
        }

        // Register image files BEFORE adding elements so Excalidraw can resolve fileIds
        if (cmd.files && typeof cmd.files === "object") {
          const fileEntries = Object.values(cmd.files).map((f: any) => ({
            id: f.id,
            dataURL: f.dataURL,
            mimeType: f.mimeType,
            created: f.created || Date.now(),
          }));
          if (fileEntries.length > 0) {
            try {
              api.addFiles(fileEntries);
              console.log(`[Canvas] Registered ${fileEntries.length} file(s) with Excalidraw`);
            } catch (err) {
              console.warn("[Canvas] addFiles failed:", err);
            }
          }
        }

        const newElements = toExcalidrawElements(cmd.elements);

        if (cmd.action === "replace") {
          api.updateScene({ elements: newElements });
        } else {
          const existing = api.getSceneElements();
          api.updateScene({
            elements: [...existing, ...newElements],
          });
        }

        // Auto-scroll to show the newly added content
        try {
          api.scrollToContent(newElements, { fitToContent: true, animate: true, duration: 300 });
        } catch {
          // scrollToContent may fail if elements are empty
        }

        console.log(
          `[Canvas] Scene updated, total elements: ${api.getSceneElements().length}`
        );
      }
      lastAppliedRef.current = canvasCommands.length;
    }, [canvasCommands, ready, toExcalidrawElements]);

    // ── Get canvas snapshot as base64 JPEG ────────────────────────────────

    const getSnapshot = useCallback(async (): Promise<string | null> => {
      const api = apiRef.current;
      if (!api) return null;

      try {
        const { exportToBlob } = await import("@excalidraw/excalidraw");
        const blob = await exportToBlob({
          elements: api.getSceneElements(),
          appState: api.getAppState(),
          files: api.getFiles(),
          mimeType: "image/jpeg",
          quality: 0.85,
        });

        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(",")[1]);
          };
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Failed to export canvas snapshot", err);
        return null;
      }
    }, []);

    // Expose only getSnapshot via ref
    useImperativeHandle(ref, () => ({ getSnapshot }), [getSnapshot]);

    if (!ExcalidrawComp || !mounted) {
      return (
        <div
          ref={containerRef}
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#868e96",
          }}
        >
          Loading whiteboard…
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%", position: "relative" }}
      >
        <ExcalidrawComp
          excalidrawAPI={(api: any) => {
            apiRef.current = api;
            console.log("[Canvas] Excalidraw API ready");
            setReady(true);
          }}
          onChange={onCanvasChange}
          theme="light"
          initialData={{
            appState: {
              viewBackgroundColor: "#ffffff",
            },
            libraryItems: [],
          }}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
            },
          }}
        />
      </div>
    );
  }
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";
export default WhiteboardCanvas;
