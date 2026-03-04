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
import type { CanvasCommand, AnimationGroup } from "@/hooks/useWebSocket";

// Corner radius applied to AI-generated images (px)
const IMAGE_CORNER_RADIUS = 20;

/**
 * Draw the image onto an offscreen canvas with rounded-rect clipping,
 * returning a new data URL with smooth corners baked into the pixels.
 */
async function roundImageCorners(dataURL: string, radius = IMAGE_CORNER_RADIUS): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      // Clip to a rounded rectangle
      ctx.beginPath();
      ctx.roundRect(0, 0, img.width, img.height, radius);
      ctx.clip();

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(dataURL); // fallback: return original
    img.src = dataURL;
  });
}

export interface WhiteboardCanvasRef {
  getSnapshot: () => Promise<string | null>;
  getSceneElements: () => any[];
}

interface WhiteboardCanvasProps {
  canvasCommands: CanvasCommand[];
  onCanvasChange?: () => void;
  isGeneratingImage?: boolean;
  isSavingProgress?: boolean;
}

const WhiteboardCanvas = forwardRef<WhiteboardCanvasRef, WhiteboardCanvasProps>(
  ({ canvasCommands, onCanvasChange, isGeneratingImage = false, isSavingProgress = false }, ref) => {
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

    // ── Helper: compute bottom edge of existing scene content ─────────
    //    Returns the Y coordinate just past the lowest visible element.
    //    Used to push new tutor content below student drawings.

    const getContentBottomY = useCallback((api: any): number => {
      const elements = api.getSceneElements();
      let maxBottom = 0;
      for (const el of elements) {
        if (el.isDeleted) continue;
        let bottom = (el.y ?? 0) + (el.height ?? 0);
        // For freedraw / line / arrow, height might be 0; compute from points
        if (el.points && Array.isArray(el.points) && el.points.length > 0) {
          const maxPtY = Math.max(...el.points.map((p: number[]) => p[1] ?? 0));
          const minPtY = Math.min(...el.points.map((p: number[]) => p[1] ?? 0));
          bottom = Math.max(bottom, (el.y ?? 0) + maxPtY);
          // Also account for negative points (drawing upward from anchor)
          bottom = Math.max(bottom, (el.y ?? 0) + Math.abs(maxPtY - minPtY));
        }
        maxBottom = Math.max(maxBottom, bottom);
      }
      return maxBottom;
    }, []);

    // ── Helper: shift new elements below existing content ────────────
    const TUTOR_CONTENT_MARGIN = 40; // px gap between student & tutor content

    const shiftElementsBelowContent = useCallback(
      (api: any, newElements: any[]): any[] => {
        if (!newElements || newElements.length === 0) return newElements;

        const contentBottom = getContentBottomY(api);
        if (contentBottom <= 0) return newElements; // canvas is empty

        // Find the top-most Y of incoming new elements
        let minNewY = Infinity;
        for (const el of newElements) {
          minNewY = Math.min(minNewY, el.y ?? 0);
        }

        // If the new elements would land inside/above existing content, push down
        const targetY = contentBottom + TUTOR_CONTENT_MARGIN;
        if (minNewY < targetY) {
          const offsetY = targetY - minNewY;
          console.log(
            `[Canvas] Shifting ${newElements.length} new elements down by ${Math.round(offsetY)}px (contentBottom=${Math.round(contentBottom)}, minNewY=${Math.round(minNewY)})`
          );
          return newElements.map((el: any) => ({
            ...el,
            y: (el.y ?? 0) + offsetY,
          }));
        }

        return newElements;
      },
      [getContentBottomY]
    );

    // ── Apply canvas commands when they arrive or API becomes ready ───────
    // For commands with animation metadata, elements are drawn smoothly
    // using requestAnimationFrame — lines grow progressively and text
    // fades in, creating an immersive "tutor is drawing" effect.

    const animFrameRef = useRef<number>(0);

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
          `[Canvas] Applying cmd #${i}: tool=${cmd.tool} action=${cmd.action} elements=${cmd.elements?.length} animated=${!!cmd.animation}`
        );

        if (cmd.action === "clear") {
          api.updateScene({ elements: [] });
          continue;
        }

        // Register image files BEFORE adding elements so Excalidraw can resolve fileIds
        if (cmd.files && typeof cmd.files === "object") {
          const rawEntries = Object.values(cmd.files).map((f: any) => ({
            id: f.id,
            dataURL: f.dataURL as string,
            mimeType: f.mimeType,
            created: f.created || Date.now(),
          }));

          // Apply rounded corners (async) then register with Excalidraw
          if (rawEntries.length > 0) {
            (async () => {
              const fileEntries = await Promise.all(
                rawEntries.map(async (entry) => ({
                  ...entry,
                  dataURL: await roundImageCorners(entry.dataURL),
                }))
              );
              try {
                api.addFiles(fileEntries);
                console.log(`[Canvas] Registered ${fileEntries.length} file(s) with rounded corners`);
              } catch (err) {
                console.warn("[Canvas] addFiles failed:", err);
              }
            })();
          }
        }
        
        // ── Animated rendering path (smooth via requestAnimationFrame) ─
        if (cmd.animation && cmd.animation.length > 0) {
          const groups = cmd.animation;
          const allConverted = cmd.action === "add"
            ? shiftElementsBelowContent(api, toExcalidrawElements(cmd.elements))
            : toExcalidrawElements(cmd.elements);
          const baseElements = [...api.getSceneElements()];

          // Scroll to frame the full plot area before drawing starts
          try {
            api.scrollToContent(allConverted, { fitToContent: true, animate: true, duration: 300 });
          } catch { /* ignore */ }

          // Pre-compute per-group draw duration from delay gaps
          const groupMeta = groups.map((g, idx) => {
            const nextDelay =
              idx < groups.length - 1 ? groups[idx + 1].delay : g.delay + 400;
            return {
              ...g,
              drawDuration: Math.max(nextDelay - g.delay, 120),
              elements: allConverted.slice(g.start, g.end),
            };
          });

          // Cache each element's full data for interpolation
          const fullData = new Map<
            string,
            { points?: number[][]; opacity: number }
          >();
          for (const gm of groupMeta) {
            for (const el of gm.elements) {
              fullData.set(el.id, {
                points: el.points
                  ? el.points.map((p: number[]) => [...p])
                  : undefined,
                opacity: el.opacity ?? 100,
              });
            }
          }

          const startTs = performance.now();
          let frame = 0;

          const tick = (now: number) => {
            const elapsed = now - startTs;
            const animated: any[] = [];
            let allDone = true;
            frame++;

            for (const gm of groupMeta) {
              if (elapsed < gm.delay) {
                allDone = false;
                continue; // group hasn't started yet
              }

              const rawT = Math.min(
                (elapsed - gm.delay) / gm.drawDuration,
                1.0
              );
              // Ease-out cubic for a natural deceleration feel
              const t = 1 - Math.pow(1 - rawT, 3);

              for (const el of gm.elements) {
                const fd = fullData.get(el.id)!;

                if (
                  (el.type === "line" || el.type === "arrow") &&
                  fd.points &&
                  fd.points.length >= 2
                ) {
                  // ── Smooth line growth ──
                  const pts = fd.points;
                  let partial: number[][];

                  if (pts.length === 2) {
                    // Two-point line → interpolate endpoint
                    const [sx, sy] = pts[0];
                    const [ex, ey] = pts[1];
                    partial = [
                      [sx, sy],
                      [sx + (ex - sx) * t, sy + (ey - sy) * t],
                    ];
                  } else {
                    // Multi-point polyline → reveal + interpolate tip
                    const segs = pts.length - 1;
                    const pos = t * segs;
                    const idx = Math.floor(pos);
                    const frac = pos - idx;

                    partial = pts.slice(0, idx + 1);
                    if (frac > 0 && idx + 1 < pts.length) {
                      const a = pts[idx];
                      const b = pts[idx + 1];
                      partial.push([
                        a[0] + (b[0] - a[0]) * frac,
                        a[1] + (b[1] - a[1]) * frac,
                      ]);
                    }
                  }

                  const tip = partial[partial.length - 1] ?? [0, 0];
                  animated.push({
                    ...el,
                    points: partial,
                    width: tip[0],
                    height: tip[1],
                    version: (el.version ?? 1) + frame,
                    versionNonce: Math.floor(Math.random() * 1e9),
                  });
                } else {
                  // ── Non-line element → opacity fade-in ──
                  animated.push({
                    ...el,
                    opacity: Math.round(fd.opacity * t),
                    version: (el.version ?? 1) + frame,
                    versionNonce: Math.floor(Math.random() * 1e9),
                  });
                }
              }

              if (rawT < 1.0) allDone = false;
            }

            api.updateScene({ elements: [...baseElements, ...animated] });

            if (!allDone) {
              animFrameRef.current = requestAnimationFrame(tick);
            } else {
              // Ensure pixel-perfect final state
              const finalEls = allConverted.map((el: any) => ({
                ...el,
                version: (el.version ?? 1) + frame + 1,
                versionNonce: Math.floor(Math.random() * 1e9),
              }));
              api.updateScene({
                elements: [...baseElements, ...finalEls],
              });
              console.log(
                `[Canvas Anim] Complete in ${Math.round(elapsed)}ms, total elements: ${api.getSceneElements().length}`
              );
            }
          };

          animFrameRef.current = requestAnimationFrame(tick);
          console.log(
            `[Canvas] Started smooth animation: ${groupMeta.length} groups, ~${
              groups[groups.length - 1]?.delay + 400
            }ms`
          );
          continue; // skip non-animated path
        }

        // ── Standard (non-animated) rendering path ───────────────────
        const rawElements = toExcalidrawElements(cmd.elements);
        // For "add" actions, shift new content below existing student drawings
        const newElements = cmd.action === "add"
          ? shiftElementsBelowContent(api, rawElements)
          : rawElements;

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

      // Cleanup animation frame on unmount or dependency change
      return () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = 0;
        }
      };
    }, [canvasCommands, ready, toExcalidrawElements, shiftElementsBelowContent]);

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

    // Expose getSnapshot and getSceneElements via ref
    useImperativeHandle(ref, () => ({
      getSnapshot,
      getSceneElements: () => apiRef.current?.getSceneElements() ?? [],
    }), [getSnapshot]);

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

        {/* ── Image-generation loading overlay ────────────────────── */}
        {isGeneratingImage && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.78)",
              backdropFilter: "blur(4px)",
              zIndex: 50,
              gap: "16px",
              pointerEvents: "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/video_loading.gif"
              alt="Generating image…"
              style={{ width: 120, height: 120, objectFit: "contain" }}
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#495057",
                letterSpacing: "0.01em",
              }}
            >
              ✨ Generating image…
            </span>
          </div>
        )}

        {/* ── Save-progress loading overlay ─────────────────────── */}
        {isSavingProgress && (
          <div
            style={{
              position: "absolute",
              bottom: 24,
              right: 24,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(124, 58, 237, 0.92)",
              backdropFilter: "blur(8px)",
              borderRadius: "16px",
              padding: "12px 20px",
              zIndex: 50,
              boxShadow: "0 8px 32px rgba(124, 58, 237, 0.3)",
              animation: "fadeInUp 0.3s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/save_progress_loading.gif"
              alt="Saving progress…"
              style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 8 }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "white",
                letterSpacing: "0.01em",
              }}
            >
              📊 Saving progress…
            </span>
          </div>
        )}
      </div>
    );
  }
);

WhiteboardCanvas.displayName = "WhiteboardCanvas";
export default WhiteboardCanvas;
