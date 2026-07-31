/* ==========================================================
   LOADER
   File: src/sections/loader/loader.js

   Drives the preloader defined in loader.css:
   - Progress 0 → 85% animated immediately via GSAP
   - Holds until the real `window.load` event fires
   - Progress 85 → 100% once assets are actually ready
   - Restrained exit sequence, then hands off to the hero
     reveal timeline
   - Respects prefers-reduced-motion
   - Returns destroyLoader() for clean Vite HMR teardown
========================================================== */

import { gsap } from "../../lib/gsap";

const EXIT_HOLD_MS = 250;

export function initLoader() {
  const loaderEl = document.querySelector("[data-loader]");
  const barFillEl = document.querySelector("[data-loader-bar-fill]");
  const percentageEl = document.querySelector("[data-loader-percentage]");
  const nameEl = document.querySelector(".loader__name");
  const innerEl = document.querySelector(".loader__inner");

  if (!loaderEl || !barFillEl || !percentageEl) {
    document.documentElement.classList.remove("is-loading");
    return () => {};
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const progress = { value: 0 };
  let holdTimeoutId = null;
  let loadHandled = false;
  let destroyed = false;

  const masterTl = gsap.timeline();
  let exitTl = null;

  /* -----------------------------------------------------
     Lock scroll while the loader is visible.
     ----------------------------------------------------- */
  document.documentElement.classList.add("is-loading");
  document.body.style.overflow = "hidden";

  function renderProgress() {
    const rounded = Math.round(progress.value);
    barFillEl.style.width = `${progress.value}%`;
    percentageEl.textContent = `${rounded}%`;
  }

  /* -----------------------------------------------------
     Stage 1 — 0 → 85%, starts immediately, independent of
     real asset load time, to keep perceived performance high.
     ----------------------------------------------------- */
  function runInitialProgress() {
    if (prefersReducedMotion) {
      progress.value = 85;
      renderProgress();
      return;
    }

    masterTl.to(progress, {
      value: 85,
      duration: 1.4,
      ease: "power2.out",
      onUpdate: renderProgress,
    });
  }

  /* -----------------------------------------------------
     Stage 2 — 85 → 100%, triggered by the real window.load
     event. If the page is already loaded (readyState
     'complete') by the time we get here, fire immediately.
     ----------------------------------------------------- */
  function handleWindowLoad() {
    if (loadHandled || destroyed) return;
    loadHandled = true;

    const finishProgress = () => {
      if (destroyed) return;

      const completeTl = gsap.timeline({
        onComplete: () => {
          holdTimeoutId = window.setTimeout(runExitSequence, EXIT_HOLD_MS);
        },
      });

      if (prefersReducedMotion) {
        progress.value = 100;
        renderProgress();
        holdTimeoutId = window.setTimeout(runExitSequence, EXIT_HOLD_MS);
        return;
      }

      completeTl.to(progress, {
        value: 100,
        duration: 0.5,
        ease: "power3.out",
        onUpdate: renderProgress,
      });
    };

    // Ensure stage 1 has visually settled before racing to 100.
    if (masterTl.isActive()) {
      masterTl.eventCallback("onComplete", finishProgress);
    } else {
      finishProgress();
    }
  }

  /* -----------------------------------------------------
     Exit sequence — effortless, not dramatic. Slight lift
     on the brand text, a subtle bump to the ambient glow,
     then a soft fade + micro scale/lift of the whole loader.
     ----------------------------------------------------- */
  function runExitSequence() {
    if (destroyed) return;

    if (prefersReducedMotion) {
      completeExit();
      return;
    }

    exitTl = gsap.timeline({
      onComplete: completeExit,
    });

    exitTl
      .to(percentageEl, {
        opacity: 0,
        duration: 0.35,
        ease: "power2.out",
      })
      .to(
        nameEl,
        {
          y: -6,
          duration: 0.45,
          ease: "power2.out",
        },
        "<"
      )
      .to(
        innerEl,
        {
          "--loader-glow-opacity": 0.2,
          duration: 0.45,
          ease: "power2.out",
        },
        "<"
      )
      .to(loaderEl, {
        opacity: 0,
        scale: 1.02,
        y: -8,
        duration: 0.7,
        ease: "expo.out",
      });
  }

  function completeExit() {
    if (destroyed) return;

    loaderEl.setAttribute("aria-hidden", "true");
    loaderEl.style.pointerEvents = "none";
    loaderEl.style.visibility = "hidden";

    document.documentElement.classList.remove("is-loading");
    document.body.style.overflow = "";

  }

  /* -----------------------------------------------------
     Hero reveal — single coordinated timeline, tasteful
     stagger, no bounce/overshoot. Every target is looked up
     defensively so absent elements are simply skipped.
     ----------------------------------------------------- */
  /*function revealHero() {
    const navbar = document.querySelector(".navbar");
    const eyebrow = document.querySelector(".hero__eyebrow");
    const title = document.querySelector(".hero__title");
    const description = document.querySelector(".hero__description");
    const actions = document.querySelector(".hero__actions");
    const media = document.querySelector(".hero__media");
    const scrollIndicator = document.querySelector(".hero__scroll");

    const targets = [
      navbar,
      eyebrow,
      title,
      description,
      actions,
      media,
      scrollIndicator,
    ].filter(Boolean);

    if (targets.length === 0) return;

    if (prefersReducedMotion) {
      gsap.set(targets, { opacity: 1, y: 0, clearProps: "all" });
      return;
    }

    gsap.set(targets, { opacity: 0, y: 16 });
    if (media) gsap.set(media, { y: 20, scale: 0.98 });

    const revealTl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 0.8 },
    });

    if (navbar) revealTl.to(navbar, { opacity: 1, y: 0 }, 0);
    if (eyebrow) revealTl.to(eyebrow, { opacity: 1, y: 0 }, 0.15);
    if (title) revealTl.to(title, { opacity: 1, y: 0 }, 0.28);
    if (description) revealTl.to(description, { opacity: 1, y: 0 }, 0.4);
    if (actions) revealTl.to(actions, { opacity: 1, y: 0 }, 0.5);
    if (media)
      revealTl.to(media, { opacity: 1, y: 0, scale: 1, duration: 1 }, 0.3);
    if (scrollIndicator)
      revealTl.to(scrollIndicator, { opacity: 1, y: 0 }, 0.7);
  }*/

  /* -----------------------------------------------------
     Wire up + start.
     ----------------------------------------------------- */
  renderProgress();
  runInitialProgress();

  if (document.readyState === "complete") {
    handleWindowLoad();
  } else {
    window.addEventListener("load", handleWindowLoad, { once: true });
  }

  /* -----------------------------------------------------
     Teardown — safe for Vite HMR: kills timelines, clears
     the pending hold timeout, removes the load listener,
     and restores scroll/loading state.
     ----------------------------------------------------- */
  return function destroyLoader() {
    destroyed = true;

    window.removeEventListener("load", handleWindowLoad);

    if (holdTimeoutId !== null) {
      window.clearTimeout(holdTimeoutId);
      holdTimeoutId = null;
    }

    masterTl.kill();
    if (exitTl) exitTl.kill();

    document.documentElement.classList.remove("is-loading");
    document.body.style.overflow = "";
  };
}