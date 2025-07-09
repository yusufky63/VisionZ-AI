"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";

interface GridBackgroundProps {
  theme: "dark" | "light";
  width?: number | string;
  height?: number | string;
  className?: string;
}

const GridBackground = React.memo(
  ({
    theme,
    width = "100%",
    height = "100%",
    className = "",
  }: GridBackgroundProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameRef = useRef<number>();
    const [mounted, setMounted] = useState(false);

    // Ensure component only renders on client side
    useEffect(() => {
      setMounted(true);
    }, []);

    const updateCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas || !mounted || typeof window === 'undefined') return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const targetWidth =
        typeof width === "number" ? width : parent.clientWidth;
      const targetHeight =
        typeof height === "number" ? height : parent.clientHeight;

      // SSR-safe devicePixelRatio check
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

      if (
        canvas.width !== targetWidth * dpr ||
        canvas.height !== targetHeight * dpr
      ) {
        canvas.width = targetWidth * dpr;
        canvas.height = targetHeight * dpr;
        canvas.style.width = `${targetWidth}px`;
        canvas.style.height = `${targetHeight}px`;
      }

      return dpr;
    }, [width, height, mounted]);

    const drawBackground = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = theme === "dark" ? "#000000" : "#ffffff";
        ctx.fillRect(0, 0, width, height);
      },
      [theme]
    );

    const createNoiseTexture = useCallback(
      (width: number, height: number) => {
        if (!mounted || typeof document === 'undefined') return null;
        
        const noiseCanvas = document.createElement("canvas");
        noiseCanvas.width = width;
        noiseCanvas.height = height;
        const noiseCtx = noiseCanvas.getContext("2d", { alpha: false });
        if (!noiseCtx) return null;

        const imageData = noiseCtx.createImageData(width, height);
        const data = imageData.data;
        const len = data.length;

        for (let i = 0; i < len; i += 4) {
          const value = (Math.random() * 255) | 0;
          data[i] = data[i + 1] = data[i + 2] = value;
          data[i + 3] = 255;
        }

        noiseCtx.putImageData(imageData, 0, 0);
        return noiseCanvas;
      },
      [mounted]
    );

    const drawNoise = useCallback(
      (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (!mounted) return;
        
        const isDark = theme === "dark";
        const noiseTexture = createNoiseTexture(width, height);
        if (!noiseTexture) return;

        ctx.globalAlpha = isDark ? 0.05 : 0.02;
        ctx.globalCompositeOperation = isDark ? "lighter" : "multiply";
        ctx.drawImage(noiseTexture, 0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      },
      [theme, createNoiseTexture, mounted]
    );

    const render = useCallback(() => {
      if (!mounted || typeof window === 'undefined') return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const dpr = updateCanvasSize() || 1;
      const { width, height } = canvas;

      ctx.scale(dpr, dpr);
      drawBackground(ctx, width, height);
      drawNoise(ctx, width, height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }, [updateCanvasSize, drawBackground, drawNoise, mounted]);

    useEffect(() => {
      if (!mounted || typeof window === 'undefined') return;
      
      const debouncedResize = () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        frameRef.current = requestAnimationFrame(render);
      };

      debouncedResize();
      window.addEventListener("resize", debouncedResize, { passive: true });

      return () => {
        window.removeEventListener("resize", debouncedResize);
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }, [render, mounted]);

    // Don't render anything until mounted
    if (!mounted) {
      return (
        <div 
          className={className}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            background: theme === "dark" ? "#000" : "#fff",
          }}
        />
      );
    }

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          top: 0,
          left: 0,
          pointerEvents: "none",
          background: theme === "dark" ? "#000" : "#fff",
        }}
      />
    );
  }
);

GridBackground.displayName = 'GridBackground';

export default GridBackground;
