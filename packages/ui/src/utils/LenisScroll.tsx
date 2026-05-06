import { useEffect, useRef } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenisInstance__?: Lenis;
  }
}

export interface LenisOptions {
  duration?: number;
  easing?: (t: number) => number;
  lerp?: number;
  wheelMultiplier?: number;
  touchMultiplier?: number;
  infinite?: boolean;
  gestureOrientation?: "vertical" | "horizontal" | "both";
  syncTouch?: boolean;
  syncTouchLerp?: number;
  preventDefault?: boolean;
}

/**
 * Lenis smooth scroll context hook
 * Provides smooth scrolling throughout the app
 */
export const useLenisScroll = (options?: LenisOptions) => {
  const lenisRef = useRef<Lenis | null>(null);
  const duration = options?.duration;
  const easing = options?.easing;
  const lerp = options?.lerp;
  const wheelMultiplier = options?.wheelMultiplier;
  const touchMultiplier = options?.touchMultiplier;
  const infinite = options?.infinite;
  const gestureOrientation = options?.gestureOrientation;
  const syncTouch = options?.syncTouch;

  useEffect(() => {
    // Initialize Lenis only on client side
    if (typeof window === "undefined") return;

    // Create Lenis instance with custom options
    lenisRef.current = new Lenis({
      duration: duration ?? 1.2,
      easing: easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      lerp: lerp ?? 0.1,
      wheelMultiplier: wheelMultiplier ?? 1,
      touchMultiplier: touchMultiplier ?? 2,
      infinite: infinite ?? false,
      gestureOrientation: gestureOrientation ?? "vertical",
      syncTouch: syncTouch ?? false,
    });

    if (typeof window !== "undefined") {
      window.__lenisInstance__ = lenisRef.current;
    }

    // Animation frame loop for smooth scrolling
    let rafId: number;
    const raf = (time: number) => {
      lenisRef.current?.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      if (typeof window !== "undefined") {
        delete window.__lenisInstance__;
      }
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [
    duration,
    easing,
    lerp,
    wheelMultiplier,
    touchMultiplier,
    infinite,
    gestureOrientation,
    syncTouch,
  ]);

  return lenisRef.current;
};

/**
 * Lenis provider component - wrap your app with this
 * Usage: <LenisScroll><YourApp /></LenisScroll>
 */
export const LenisScroll: React.FC<{
  children: React.ReactNode;
  options?: LenisOptions;
}> = ({
  children,
  options,
}: {
  children: React.ReactNode;
  options?: LenisOptions;
}) => {
  useLenisScroll(options);

  return <>{children}</>;
};

/**
 * Smooth scroll to element
 */
export const scrollToElement = (
  element: HTMLElement | null,
  options?: { offset?: number; duration?: number }
) => {
  if (!element) return;

  if (typeof window !== "undefined" && window.__lenisInstance__) {
    const lenis = window.__lenisInstance__;

    if (!lenis) {
      element.scrollIntoView({ behavior: "smooth" });
      return;
    }

    lenis.scrollTo(element, {
      offset: options?.offset,
      duration: options?.duration,
    });
  } else {
    // Fallback to native scroll if Lenis not available
    element.scrollIntoView({ behavior: "smooth" });
  }
};

/**
 * Smooth scroll to position
 */
export const scrollToPosition = (
  y: number,
  options?: { duration?: number }
) => {
  if (typeof window !== "undefined" && window.__lenisInstance__) {
    const lenis = window.__lenisInstance__;

    if (!lenis) {
      globalThis.window?.scrollTo({ top: y, behavior: "smooth" });
      return;
    }

    lenis.scrollTo(y, {
      duration: options?.duration,
    });
  } else if (typeof window !== "undefined") {
    // Fallback to native scroll
    globalThis.window?.scrollTo({ top: y, behavior: "smooth" });
  }
};

export default LenisScroll;
