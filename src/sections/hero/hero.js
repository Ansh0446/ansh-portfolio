/* ==========================================================
   HERO
   File: src/sections/hero/hero.js

   Owns the Hero entrance animation only. Elements start
   hidden via inline styles on the HTML itself (no CSS
   changes) to guarantee zero flash before JS runs. Reveal
   is triggered once the loader finishes — detected via a
   MutationObserver on the loader's aria-hidden state, so
   this module stays fully decoupled from loader.js.
========================================================== */

import { gsap } from "../../lib/gsap";

export function initHero() {
  const heroEl = document.querySelector("#hero");
  const badgeEl = document.querySelector("[data-hero-badge]");
  const headingEl = document.querySelector("[data-hero-heading]");
  const subtitleEl = document.querySelector("[data-hero-subtitle]");
  const ctaEl = document.querySelector("[data-hero-cta]");
  const ctaItems = document.querySelectorAll("[data-hero-cta-item]");
  const mediaEl = document.querySelector("[data-hero-media]");
  const scrollEl = document.querySelector("[data-hero-scroll]");

  if (!heroEl) {
    return () => {};
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const targets = [
    badgeEl,
    headingEl,
    subtitleEl,
    ctaEl,
    mediaEl,
    scrollEl,
  ].filter(Boolean);

  let revealed = false;
  let destroyed = false;
  let revealTl = null;
  let observer = null;
  let fallbackTimeoutId = null;

  /* -----------------------------------------------------
     Initial hidden state — clears the inline opacity:0
     placeholder and hands control to GSAP, so there is no
     gap between the HTML's static hide and JS's own state.
     ----------------------------------------------------- */
  function setInitialState() {
    if (prefersReducedMotion) {
      gsap.set(targets, { clearProps: "opacity" });
      return;
    }

    gsap.set(badgeEl, { opacity: 0, y: 14 });
    gsap.set(headingEl, { opacity: 0, y: 20 });
    gsap.set(subtitleEl, { opacity: 0, y: 14 });
    gsap.set(ctaEl, { opacity: 0, y: 12 });
    if (ctaItems.length) gsap.set(ctaItems, { opacity: 0, y: 10 });
    gsap.set(mediaEl, { opacity: 0, y: 24, scale: 0.97 });
    gsap.set(scrollEl, { opacity: 0, y: 8 });
  }

  /* -----------------------------------------------------
     Reveal timeline — single coordinated sequence, subtle
     opacity + y + micro-scale only, restrained easing.
     ----------------------------------------------------- */
  function reveal() {
    if (revealed || destroyed) return;
    revealed = true;

    if (fallbackTimeoutId !== null) {
      window.clearTimeout(fallbackTimeoutId);
      fallbackTimeoutId = null;
    }

    if (prefersReducedMotion) {
      gsap.set(targets, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
      if (ctaItems.length) gsap.set(ctaItems, { opacity: 1, y: 0 });
      return;
    }

    revealTl = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    if (badgeEl) {
      revealTl.to(badgeEl, { opacity: 1, y: 0, duration: 0.7 }, 0);
    }

    if (headingEl) {
      revealTl.to(headingEl, { opacity: 1, y: 0, duration: 0.9 }, 0.12);
    }

    if (subtitleEl) {
      revealTl.to(subtitleEl, { opacity: 1, y: 0, duration: 0.8 }, 0.28);
    }

    if (ctaEl) {
      revealTl.to(ctaEl, { opacity: 1, y: 0, duration: 0.7 }, 0.4);
    }

    if (ctaItems.length) {
      revealTl.to(
        ctaItems,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
        },
        0.46
      );
    }

    if (mediaEl) {
      revealTl.to(
        mediaEl,
        { opacity: 1, y: 0, scale: 1, duration: 1.1, ease: "expo.out" },
        0.2
      );
    }

    if (scrollEl) {
      revealTl.to(scrollEl, { opacity: 1, y: 0, duration: 0.6 }, 0.9);
    }
  }

  /* -----------------------------------------------------
     Trigger detection — watches the loader's aria-hidden
     attribute and reveals the moment it flips to "true".
     A window.load fallback guarantees the hero never stays
     hidden if the loader element is missing or already gone.
     ----------------------------------------------------- */
  function watchLoader() {
    const loaderEl = document.querySelector("[data-loader]");

    if (!loaderEl) {
      reveal();
      return;
    }

    if (loaderEl.getAttribute("aria-hidden") === "true") {
      reveal();
      return;
    }

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "aria-hidden") {
          if (loaderEl.getAttribute("aria-hidden") === "true") {
            reveal();
            observer?.disconnect();
            observer = null;
          }
        }
      }
    });

    observer.observe(loaderEl, { attributes: true });

    fallbackTimeoutId = window.setTimeout(() => {
      reveal();
      observer?.disconnect();
      observer = null;
    }, 6000);
  }

  setInitialState();
  watchLoader();

  /* -----------------------------------------------------
     Teardown — safe for Vite HMR: disconnects the observer,
     clears the fallback timer, and kills the timeline.
     ----------------------------------------------------- */
  return function destroyHero() {
    destroyed = true;

    observer?.disconnect();
    observer = null;

    if (fallbackTimeoutId !== null) {
      window.clearTimeout(fallbackTimeoutId);
      fallbackTimeoutId = null;
    }

    revealTl?.kill();
    revealTl = null;
  };
}