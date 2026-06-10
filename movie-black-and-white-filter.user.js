// ==UserScript==
// @name         Video Black & White Movie Filter
// @namespace    https://ondra.hlavac.cz/
// @version      1.0.0
// @description  Toggle black-and-white movie-style filter on the currently playing HTML5 video.
// @author       Ondra Hlaváč <ondra@hlavac.cz>
// @match        *://*/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// @homepageURL  https://github.com/ondrahlavac/userscripts
// @updateURL    https://github.com/ondrahlavac/userscripts/raw/master/movie-black-and-white-filter.user.js
// @downloadURL  https://github.com/ondrahlavac/userscripts/raw/master/movie-black-and-white-filter.user.js
// @supportURL   https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

(() => {
  "use strict";

  const CLASS_NAME = "oht-bw-movie-filter";

  const STYLE_ID = "oht-bw-movie-filter-style";

  const css = `
    video.${CLASS_NAME} {
      filter:
        grayscale(1)
        contrast(1.18)
        brightness(0.92)
        sepia(0.08) !important;
    }
  `;

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  function isUsableVideo(video) {
    return (
      video instanceof HTMLVideoElement &&
      video.readyState >= 2 &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    );
  }

  function getPlayingVideos() {
    return [...document.querySelectorAll("video")].filter(
      (video) => isUsableVideo(video) && !video.paused && !video.ended,
    );
  }

  function getLargestVideo(videos) {
    return (
      videos
        .map((video) => ({
          video,
          area:
            video.getBoundingClientRect().width *
            video.getBoundingClientRect().height,
        }))
        .sort((a, b) => b.area - a.area)[0]?.video || null
    );
  }

  function getTargetVideo() {
    const playing = getPlayingVideos();

    if (playing.length > 0) {
      return getLargestVideo(playing);
    }

    const allVideos = [...document.querySelectorAll("video")].filter(
      isUsableVideo,
    );

    return getLargestVideo(allVideos);
  }

  function showToast(message) {
    const existing = document.getElementById("oht-bw-filter-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "oht-bw-filter-toast";
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: "2147483647",
      padding: "10px 14px",
      background: "rgba(0, 0, 0, 0.75)",
      color: "white",
      fontSize: "14px",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "8px",
      pointerEvents: "none",
    });

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 1400);
  }

  function toggleFilter() {
    injectStyle();

    const video = getTargetVideo();

    if (!video) {
      showToast("No video found");
      return;
    }

    video.classList.toggle(CLASS_NAME);

    const enabled = video.classList.contains(CLASS_NAME);
    showToast(enabled ? "B&W movie filter: ON" : "B&W movie filter: OFF");
  }

  function isTypingTarget(element) {
    if (!element) return false;

    const tag = element.tagName?.toLowerCase();

    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      element.isContentEditable
    );
  }

  window.addEventListener(
    "keydown",
    (event) => {
      if (isTypingTarget(document.activeElement)) return;

      // Shortcut: Alt + Shift + B
      if (
        event.altKey &&
        event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.code === "KeyB"
      ) {
        event.preventDefault();
        event.stopPropagation();
        toggleFilter();
      }
    },
    true,
  );
})();
