/**
 * pieces-svg.js
 * Inline SVG chess pieces from the cburnett set (Lichess).
 * Encoded as data URIs so the app works completely offline.
 */

'use strict';

// Each piece SVG is a small, elegant vector — the cburnett set
// These are the canonical Lichess open-source piece SVGs.

const PIECE_SVGS = {};

// ─────────────────────────────────────────────────────────────────
// WHITE PIECES
// ─────────────────────────────────────────────────────────────────

PIECE_SVGS['wP'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03L15 29H10v3h5l-3 3h16l-3-3h5v-3h-5l-3.41-2.97C21.06 24.84 22 23.03 22 21c0-2.41-1.33-4.5-3.28-5.62C19.21 14.71 19.5 13.89 19.5 13c0-2.21 1.79-4 3-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

PIECE_SVGS['wR'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/>
    <path d="M34 14l-3 3H14l-3-3"/>
    <path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
    <path d="M11 14h23" fill="none" stroke-linejoin="miter"/>
  </g>
</svg>`;

PIECE_SVGS['wN'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/>
    <path d="M24 18c.38 5.12-4 6.5-8 6.5-3.88 0-7-2-7-8 0-5 3.5-9 8-9 3 0 6.5 1 8 3" fill="#fff"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#000" stroke="#000"/>
    <path d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#000" stroke="#000"/>
  </g>
</svg>`;

PIECE_SVGS['wB'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#fff" stroke-linecap="butt">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/>
  </g>
</svg>`;

PIECE_SVGS['wQ'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM24.5 7.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM41 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM16 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM33 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" stroke="none"/>
    <path d="M9 26c8.5-8.5 15.5-7 22 0" fill="none" stroke-linecap="butt"/>
    <path d="M12 11c1 5.5 5 7 9 7 4 0 7-1.5 9-7" fill="none"/>
    <path d="M28.5 11c1 5.5 5 7 9 7 4 0 7-1.5 9-7" fill="none"/>
    <path d="M22.5 11c-1 5.5-5 7-9 7-4 0-7-1.5-9-7" fill="none"/>
    <path d="M18 11l-5 15m7-15l3 15m5-15l-3 15m5-15l5 15" fill="none"/>
    <path d="M11.5 30c3.5-1 22.5-1 26 0l2.5 12.5H9L11.5 30z" stroke-linecap="butt"/>
    <path d="M11.5 30c3.5 2.5 15.5 3 22 0" fill="none"/>
  </g>
</svg>`;

PIECE_SVGS['wK'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-2.5-8.5-.5-2.5 6.5 0 10L11.5 37z" fill="#fff"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/>
  </g>
</svg>`;

// ─────────────────────────────────────────────────────────────────
// BLACK PIECES (same shapes, filled black, white stroke)
// ─────────────────────────────────────────────────────────────────

PIECE_SVGS['bP'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03L15 29H10v3h5l-3 3h16l-3-3h5v-3h-5l-3.41-2.97C21.06 24.84 22 23.03 22 21c0-2.41-1.33-4.5-3.28-5.62C19.21 14.71 19.5 13.89 19.5 13c0-2.21 1.79-4 3-4z" fill="#333" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

PIECE_SVGS['bR'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="#333" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/>
    <path d="M34 14l-3 3H14l-3-3"/>
    <path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
    <path d="M11 14h23" fill="none" stroke-linejoin="miter"/>
  </g>
</svg>`;

PIECE_SVGS['bN'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#333"/>
    <path d="M24 18c.38 5.12-4 6.5-8 6.5-3.88 0-7-2-7-8 0-5 3.5-9 8-9 3 0 6.5 1 8 3" fill="#333"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill="#fff" stroke="#fff"/>
    <path d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#fff" stroke="#fff"/>
  </g>
</svg>`;

PIECE_SVGS['bB'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <g fill="#333" stroke-linecap="butt">
      <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
      <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
      <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
    </g>
    <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/>
  </g>
</svg>`;

PIECE_SVGS['bQ'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="#333" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM24.5 7.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM41 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM16 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM33 8.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" stroke="none"/>
    <path d="M9 26c8.5-8.5 15.5-7 22 0" fill="none" stroke-linecap="butt"/>
    <path d="M12 11c1 5.5 5 7 9 7 4 0 7-1.5 9-7" fill="none"/>
    <path d="M28.5 11c1 5.5 5 7 9 7 4 0 7-1.5 9-7" fill="none"/>
    <path d="M22.5 11c-1 5.5-5 7-9 7-4 0-7-1.5-9-7" fill="none"/>
    <path d="M18 11l-5 15m7-15l3 15m5-15l-3 15m5-15l5 15" fill="none"/>
    <path d="M11.5 30c3.5-1 22.5-1 26 0l2.5 12.5H9L11.5 30z" stroke-linecap="butt"/>
    <path d="M11.5 30c3.5 2.5 15.5 3 22 0" fill="none"/>
  </g>
</svg>`;

PIECE_SVGS['bK'] = `<svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
  <g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#333" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-2.5-8.5-.5-2.5 6.5 0 10L11.5 37z" fill="#333"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/>
  </g>
</svg>`;

// ── Encode SVGs to data URIs ──────────────────────────────────────
const PIECE_DATA_URIS = {};
Object.entries(PIECE_SVGS).forEach(([code, svg]) => {
  PIECE_DATA_URIS[code] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
});

// Export
window.PIECE_DATA_URIS = PIECE_DATA_URIS;
