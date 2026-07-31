/* ==========================================================
   MAIN ENTRY
   Project: Ansh Portfolio
========================================================== */

/* ------------------------------
   Global Styles
------------------------------ */

import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/typography.css";
import "./styles/global.css";
import "./styles/utilities.css";

/* ------------------------------
   Section Styles
------------------------------ */

import "./sections/navbar/navbar.css";
import "./sections/hero/hero.css";
import "./sections/about/about.css";
import "./sections/skills/skills.css";
import "./sections/projects/projects.css";
import "./sections/loader/loader.css";
import "./sections/experience/experience.css";
import "./sections/cursor/cursor.css";
import "./sections/contact/contact.css";
import "./sections/footer/footer.css";

/* ------------------------------
   Section Scripts
------------------------------ */

import { initLoader } from "./sections/loader/loader.js";
import { initHero } from "./sections/hero/hero.js";
import "./sections/navbar/navbar.js";
import { initCursor } from "./sections/cursor/cursor.js";

/* ------------------------------
   Libraries
------------------------------ */

import { createIcons, icons } from "lucide";

import "./lib/gsap";
import "./lib/lenis";

/* ------------------------------
   Application
------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  createIcons({ icons });

  const destroyHero = initHero();
  const destroyLoader = initLoader();
  const destroyCursor = initCursor();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      destroyHero();
      destroyLoader();
      destroyCursor();
    });
  }

  console.log("🚀 Ansh Portfolio Initialized");
});