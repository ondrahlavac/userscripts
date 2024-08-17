// ==UserScript==
// @name        YouTube Simple Speed Control
// @version     0.1.1
// @author      Ondra Hlaváč <ondra@hlavac.cz>
// @description Adds a simple speed control to YouTube videos.
// @namespace   https://ondra.hlavac.cz/
// @match       https://www.youtube.com/watch*
// @grant       none
// @license     ISC
// @run-at      document-end
// @homepageURL https://github.com/ondrahlavac/userscripts
// @updateURL   https://github.com/ondrahlavac/userscripts/raw/master/youtube-simple-speed-control.user.js
// @downloadURL https://github.com/ondrahlavac/userscripts/raw/master/youtube-simple-speed-control.user.js
// @supportURL  https://github.com/ondrahlavac/userscripts/issues
// ==/UserScript==

window.addEventListener('load', function() {
  const player = document.querySelector('video');
  if (player) {
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Equal' || event.code === 'NumpadAdd') {
        player.playbackRate += 0.1;
      } else if (event.code === 'Minus' || event.code === 'NumpadSubtract') {
        player.playbackRate -= 0.1;
      } else if (event.code === 'Digit8' || event.code === 'NumpadMultiply') {
        player.playbackRate = 1;
      }
    });
  }
}, false);