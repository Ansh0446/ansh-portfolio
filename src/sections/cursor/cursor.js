/* ==========================================================
   CUSTOM CURSOR
   File: src/sections/cursor/cursor.js

   Drives the custom cursor defined in cursor.css:
   - GSAP quickTo (rAF-backed) for buttery dot/outline tracking
   - Hover growth over interactive elements
   - Magnetic pull for [data-magnetic] elements
   - Auto-disabled on touch devices and below 1024px
   - Clean teardown (no leaked listeners/tickers)
========================================================== */

import { gsap } from "gsap";

const DESKTOP_QUERY = "(min-width: 1024px)";
const HOVER_SELECTOR =
  'a, button, input, textarea, select, [data-cursor="hover"]';
const MAGNETIC_SELECTOR = "[data-magnetic]";
const MAGNETIC_STRENGTH = 0.35;
const MAGNETIC_EASE_DURATION = 0.5;

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function initCursor() {
  const cursor = document.querySelector("[data-cursor]");
  const dotEl = document.querySelector("[data-cursor-dot]");
  const outlineEl = document.querySelector("[data-cursor-outline]");

  if (!cursor || !dotEl || !outlineEl) {
    return () => {};
  }

  if (isTouchDevice()) {
    return () => {};
  }

  const desktopMql = window.matchMedia(DESKTOP_QUERY);

  let isActive = false;
  let isVisible = false;
  let currentHoverTarget = null;
  let currentMagneticTarget = null;

  /* -----------------------------------------------------
     GSAP quickTo setters — one fast (dot), one eased
     (outline) — both driven by GSAP's internal rAF ticker.
     ----------------------------------------------------- */
  const dotX = gsap.quickTo(dotEl, "x", {
  duration: 0.01,
  ease: "none",
});

const dotY = gsap.quickTo(dotEl, "y", {
  duration: 0.01,
  ease: "none",
});

const outlineX = gsap.quickTo(outlineEl, "x", {
  duration: 0.03,
  ease: "power2.out",
});

const outlineY = gsap.quickTo(outlineEl, "y", {
  duration: 0.03,
  ease: "power2.out",
});
  /* -----------------------------------------------------
     Center the dot/outline on the pointer via GSAP xPercent/
     yPercent (constant, set once — avoids recalculating
     offsets on every frame).
     ----------------------------------------------------- */
  gsap.set([dotEl, outlineEl], { xPercent: -50, yPercent: -50 });

  function onPointerMove(e) {
    const { clientX, clientY } = e;

    dotX(clientX);
    dotY(clientY);
    outlineX(clientX);
    outlineY(clientY);

    if (!isVisible) {
      showCursor();
    }

    if (currentMagneticTarget) {
      applyMagneticPull(currentMagneticTarget, clientX, clientY);
    }
  }

  function showCursor() {
    isVisible = true;
    cursor.classList.remove("cursor--hidden");
  }

  function hideCursor() {
    isVisible = false;
    cursor.classList.add("cursor--hidden");
  }

  function onMouseLeaveViewport(e) {
    if (!e.relatedTarget && !e.toElement) {
      hideCursor();
    }
  }

  function onMouseEnterViewport() {
    showCursor();
  }

  /* -----------------------------------------------------
     Hover state — event delegation via mouseover/mouseout,
     using closest() so nested markup inside links/buttons
     still triggers correctly.
     ----------------------------------------------------- */
  function onMouseOver(e) {
    const hoverTarget = e.target.closest(HOVER_SELECTOR);
    if (hoverTarget && hoverTarget !== currentHoverTarget) {
      currentHoverTarget = hoverTarget;
      cursor.classList.add("cursor--hover");
    }

    const magneticTarget = e.target.closest(MAGNETIC_SELECTOR);
    if (magneticTarget && magneticTarget !== currentMagneticTarget) {
      currentMagneticTarget = magneticTarget;
    }
  }

  function onMouseOut(e) {
    if (
      currentHoverTarget &&
      !e.relatedTarget?.closest?.(HOVER_SELECTOR)
    ) {
      cursor.classList.remove("cursor--hover");
      currentHoverTarget = null;
    }

    if (
      currentMagneticTarget &&
      !e.relatedTarget?.closest?.(MAGNETIC_SELECTOR)
    ) {
      resetMagneticTarget(currentMagneticTarget);
      currentMagneticTarget = null;
    }
  }

  /* -----------------------------------------------------
     Active state (press/click) — brief compression.
     ----------------------------------------------------- */
  function onMouseDown() {
    cursor.classList.add("cursor--active");
  }

  function onMouseUp() {
    cursor.classList.remove("cursor--active");
  }

  /* -----------------------------------------------------
     Magnetic pull — nudges the target element toward the
     pointer, eased back to rest on mouseleave.
     ----------------------------------------------------- */
  function applyMagneticPull(target, pointerX, pointerY) {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (pointerX - centerX) * MAGNETIC_STRENGTH;
    const deltaY = (pointerY - centerY) * MAGNETIC_STRENGTH;

    gsap.to(target, {
      x: deltaX,
      y: deltaY,
      duration: 0.3,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  function resetMagneticTarget(target) {
    gsap.to(target, {
      x: 0,
      y: 0,
      duration: MAGNETIC_EASE_DURATION,
      ease: "elastic.out(1, 0.4)",
      overwrite: "auto",
    });
  }

  /* -----------------------------------------------------
     Enable / disable based on viewport width. Below the
     desktop breakpoint we fully detach listeners and
     restore the native cursor rather than just hiding the
     custom one, to avoid dead work on mobile/tablet.
     ----------------------------------------------------- */
  function attachListeners() {
    window.addEventListener("mousemove", onPointerMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeaveViewport);
    document.addEventListener("mouseenter", onMouseEnterViewport);
  }

  function detachListeners() {
    window.removeEventListener("mousemove", onPointerMove);
    document.removeEventListener("mouseover", onMouseOver);
    document.removeEventListener("mouseout", onMouseOut);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mouseleave", onMouseLeaveViewport);
    document.removeEventListener("mouseenter", onMouseEnterViewport);
  }

  function enable() {
    if (isActive) return;
    isActive = true;

    document.documentElement.classList.add("has-custom-cursor");
    attachListeners();
    showCursor();
  }

  function disable() {
    if (!isActive) return;
    isActive = false;

    document.documentElement.classList.remove("has-custom-cursor");
    detachListeners();
    hideCursor();
    cursor.classList.remove("cursor--hover", "cursor--active");

    if (currentMagneticTarget) {
      resetMagneticTarget(currentMagneticTarget);
      currentMagneticTarget = null;
    }
    currentHoverTarget = null;
  }

  function handleBreakpointChange(e) {
    if (e.matches) {
      enable();
    } else {
      disable();
    }
  }

  if (desktopMql.matches) {
    enable();
  }

  desktopMql.addEventListener("change", handleBreakpointChange);

  /* -----------------------------------------------------
     Teardown — call on HMR dispose / route change / app
     unmount to guarantee no leaked listeners or tickers.
     ----------------------------------------------------- */
  return function destroyCursor() {
    disable();
    desktopMql.removeEventListener("change", handleBreakpointChange);
    dotX.tween?.kill?.();
    dotY.tween?.kill?.();
    outlineX.tween?.kill?.();
    outlineY.tween?.kill?.();
  };
}