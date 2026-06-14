/**
 * app.js — Chess Learner UI Controller
 * Features: SVG pieces · Move descriptions · Voice narration ·
 *           Speed above PGN · Controls in sidebar
 */

'use strict';

// ── Piece resolution ──────────────────────────────────────────────
function pieceUrl(code) {
  return window.PIECE_DATA_URIS?.[code] || '';
}

// ── DOM ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const boardEl        = $('chess-board');
const pgnInput       = $('pgn-input');
const btnAnalyze     = $('btn-analyze-modal');
const btnClear       = $('btn-clear');
const btnLoadSample  = $('btn-load-sample');
const btnPlayPause   = $('btn-play-pause');
const btnStart       = $('btn-start');
const btnEnd         = $('btn-end');
const btnPrev        = $('btn-prev');
const btnNext        = $('btn-next');
const btnVoice       = $('btn-voice');
const speedSlider    = $('speed-slider');
const speedVal       = $('speed-val');
const moveCounter    = $('move-counter');
const progressLabel  = $('progress-label');
const progressFill   = $('progress-fill');
const progressKnob   = $('progress-knob');
const progressTrack  = $('progress-track');
const moveListEl     = $('move-list');
const gameInfoEl     = $('game-info');
const statusText     = $('status-text');
const statusDot      = $('status-dot');
const blackCaptures  = null; // Removed
const whiteCaptures  = null; // Removed
const toastEl        = $('toast');
const playIconSvg    = $('play-icon');
const playLabelEl    = $('play-label');
const voiceIcon      = $('voice-icon');
const voiceLabelEl   = $('voice-label');

const infoEvent   = $('info-event');
const infoPlayers = $('info-players');
const infoDate    = $('info-date');
const infoResult  = $('info-result');

// ── State ────────────────────────────────────────────────────────
let engine        = new ChessEngine();
let allMoves      = [];
let gameHistory   = [];
let currentStep   = 0;
let totalSteps    = 0;
let playInterval  = null;
let isPlaying     = false;
let playSpeed     = 2000;
// Analysis State
let explainOn = false;
let analyzedSteps = new Set();
const btnExplain = $('btn-explain');
const explainLabel = $('explain-label');
const explainPanel = $('explain-panel');
const explainTranscript = $('explain-transcript');
let boardStates   = [];
let captureStates = [];
let voiceEnabled  = true;
let stockfish     = null;
let lastEval      = 0;
let moveEvaluations = []; // index matches currentStep
let evaluatingStep = -1;

// ── SVG icon paths ────────────────────────────────────────────────
const PLAY_SVG  = '<path d="M8 5v14l11-7z"/>';
const PAUSE_SVG = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

const VOICE_ON_SVG  = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
const VOICE_OFF_SVG = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';

// ── Toast ────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  toastTimer = setTimeout(() => toastEl.className = 'toast', 3500);
}

// ── Voice narration ───────────────────────────────────────────────
// Piece spoken names
const PIECE_SPOKEN = {
  K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn'
};

/**
 * Builds a natural spoken sentence from a move.
 * Format: "White knight moved from f6 to g8"
 *         "Black bishop captures on c5"
 *         "White castles kingside"
 */
function buildSpeechText(step) {
  if (step === 0) return 'Starting position';
  const hist = gameHistory[step - 1];
  if (!hist) return '';

  const { move } = hist;
  const san      = move.san || '';
  const cleanSan = san.replace(/[+#!?]/g, '');

  // Odd step = White just moved, Even step = Black just moved
  const color = step % 2 === 1 ? 'White' : 'Black';

  const fromSq = idxToSq(move.from);  // e.g. "f6"
  const toSq   = idxToSq(move.to);    // e.g. "g8"

  // Derive spoken from/to: "ef 6" → "f 6" …read letter then digit separately
  const spokenSq = sq => sq[0] + ' ' + sq[1]; // "f6" → "f 6" (TTS reads naturally)

  // Castling
  if (cleanSan === 'O-O')   return `${color} castles king side`;
  if (cleanSan === 'O-O-O') return `${color} castles queen side`;

  // Piece name
  let pieceChar = 'P';
  if (/^[KQRBN]/.test(cleanSan)) pieceChar = cleanSan[0];
  const pieceName = PIECE_SPOKEN[pieceChar] || 'pawn';

  const isCapture  = cleanSan.includes('x');
  const promoMatch = cleanSan.match(/=([QRBN])$/);

  let text = `${color} ${pieceName} `;

  if (isCapture) {
    text += `captures on ${spokenSq(toSq)}`;
  } else {
    text += `moved from ${spokenSq(fromSq)} to ${spokenSq(toSq)}`;
  }

  if (promoMatch) {
    text += `, promotes to ${PIECE_SPOKEN[promoMatch[1]] || promoMatch[1]}`;
  }

  if (san.includes('#'))      text += '. Checkmate!';
  else if (san.includes('+')) text += '. Check!';

  return text;
}

function speakMove(step) {
  if (!voiceEnabled || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const text = buildSpeechText(step);
  if (!text || step === 0) return;
  const utt    = new SpeechSynthesisUtterance(text);
  utt.rate     = 1.05;
  utt.pitch    = 1.0;
  utt.volume   = 1.0;
  speechSynthesis.speak(utt);
}

// Voice toggle
function syncVoiceButton() {
  if (voiceEnabled) {
    btnVoice.classList.add('active');
    voiceIcon.innerHTML  = VOICE_ON_SVG;
    if (voiceLabelEl) voiceLabelEl.textContent = 'Voice On';
  } else {
    btnVoice.classList.remove('active');
    voiceIcon.innerHTML  = VOICE_OFF_SVG;
    if (voiceLabelEl) voiceLabelEl.textContent = 'Voice Off';
    speechSynthesis.cancel();
  }
}

btnVoice.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  syncVoiceButton();
});

// ── Board Init ───────────────────────────────────────────────────
function initBoard() {
  boardEl.innerHTML = '';
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const sq = document.createElement('div');
      sq.className = `square ${(rank + file) % 2 === 1 ? 'light' : 'dark'}`;
      sq.dataset.idx = rank * 8 + file;
      boardEl.appendChild(sq);
    }
  }
}

// ── Board Render ─────────────────────────────────────────────────
function renderBoard(board, fromIdx = null, toIdx = null) {
  const squares = boardEl.querySelectorAll('.square');
  squares.forEach(sq => {
    const idx   = parseInt(sq.dataset.idx);
    const piece = board[idx];
    const base  = (Math.floor(idx / 8) + (idx % 8)) % 2 === 1 ? 'light' : 'dark';
    let cls = `square ${base}`;
    if (idx === fromIdx) cls += ' hl-from';
    if (idx === toIdx)   cls += ' hl-to';
    sq.className = cls;
    sq.innerHTML = '';
    if (piece) {
      const img     = document.createElement('img');
      img.src       = pieceUrl(piece);
      img.className = 'piece-img';
      img.alt       = piece;
      img.draggable = false;
      if (piece[0] === 'b') img.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))';
      sq.appendChild(img);
    }
  });

  // King-in-check highlight
  if (currentStep > 0) {
    const checkColor = currentStep % 2 === 1 ? 'b' : 'w'; // opposite just moved
    const kingIdx    = board.indexOf(checkColor + 'K');
    if (kingIdx !== -1 && isKingInCheck(board, kingIdx, checkColor)) {
      squares.forEach(sq => {
        if (parseInt(sq.dataset.idx) === kingIdx) sq.classList.add('in-check');
      });
    }
  }
}

function isKingInCheck(board, kingIdx, color) {
  const opp = color === 'w' ? 'b' : 'w';
  for (let i = 0; i < 64; i++) {
    if (!board[i] || board[i][0] !== opp) continue;
    if (attacksSquare(board, i, kingIdx, board[i][1])) return true;
  }
  return false;
}

function attacksSquare(board, from, to, type) {
  const fr = Math.floor(from / 8), ff = from % 8;
  const tr = Math.floor(to / 8),   tf = to % 8;
  const dr = tr - fr, df = tf - ff;
  const color = board[from][0];
  const clear = () => {
    const sr = Math.sign(dr), sf = Math.sign(df);
    let r = fr + sr, f = ff + sf;
    while (r !== tr || f !== tf) { if (board[r * 8 + f]) return false; r += sr; f += sf; }
    return true;
  };
  switch (type) {
    case 'P': { const d = color === 'w' ? 1 : -1; return dr === d && Math.abs(df) === 1; }
    case 'N': return (Math.abs(dr) === 2 && Math.abs(df) === 1) || (Math.abs(dr) === 1 && Math.abs(df) === 2);
    case 'B': return Math.abs(dr) === Math.abs(df) && dr !== 0 && clear();
    case 'R': return (dr === 0 || df === 0) && (dr !== 0 || df !== 0) && clear();
    case 'Q': return ((Math.abs(dr) === Math.abs(df) && dr !== 0) || ((dr === 0 || df === 0) && (dr !== 0 || df !== 0))) && clear();
    case 'K': return Math.abs(dr) <= 1 && Math.abs(df) <= 1 && (dr || df);
    default: return false;
  }
}

// ── Catch engine capture loops securely driving UI ─────────────────────────────────────────────────────
let currentCapW = [];
let currentCapB = [];
let capturesTeamView = 'white';
const SCORE_VALS = { 'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9, 'K': 0 };

function renderCaptures(capW, capB) {
  currentCapW = capW; // capW = what White natively captured from Black
  currentCapB = capB; // capB = what Black natively captured from White
  const getVal = arr => arr.reduce((sum, p) => sum + (SCORE_VALS[p[1]] || 0), 0);
  const diff = getVal(capW) - getVal(capB);
  
  const scoreW = $('score-val-white');
  const scoreB = $('score-val-black');
  
  if (scoreW && scoreB) {
    const absDiff = Math.abs(diff);
    if (diff > 0) {
      scoreW.textContent = `+${absDiff}`;
      scoreB.textContent = '+0';
    } else if (diff < 0) {
      scoreW.textContent = '+0';
      scoreB.textContent = `+${absDiff}`;
    } else {
      scoreW.textContent = '+0';
      scoreB.textContent = '+0';
    }
  }
  
  if ($('captures-modal')?.open) updateCapturesModal();
}

function updateCapturesModal() {
  const order = p => ['Q','R','B','N','P'].indexOf(p[1]);
  const toSymbols = arr => [...arr].sort((a, b) => order(a) - order(b)).map(p => PIECES?.[p] || '').join('');
  
  if (capturesTeamView === 'white') {
     $('captures-modal-title').textContent = "White Intel";
     $('modal-captures').textContent = toSymbols(currentCapW) || "—";
     $('modal-sacrifices').textContent = toSymbols(currentCapB) || "—";
  } else {
     $('captures-modal-title').textContent = "Black Intel";
     $('modal-captures').textContent = toSymbols(currentCapB) || "—";
     $('modal-sacrifices').textContent = toSymbols(currentCapW) || "—";
  }
  
  // Build Visual Audit Timeline
  const logEl = $('audit-log');
  if (!logEl) return;
  
  let lastW = 0, lastB = 0;
  let linesHTML = [];
  
  for (let i = 1; i <= currentStep; i++) {
     const st = captureStates[i];
     if (!st) continue;
     const wArr = st.capturedByWhite, bArr = st.capturedByBlack;
     const moveNumStr = Math.ceil(i/2) + (i%2 !== 0 ? '.' : '...');
     const san = allMoves[i-1];
     
     // Did White Capture something?
     if (wArr.length > lastW) {
         const pieceStr = wArr[wArr.length - 1]; // ex: "Bp"
         if (pieceStr && pieceStr.length > 1) {
             const pType = pieceStr[1].toUpperCase();
             const pName = PIECE_NAMES[pType] || 'Pawn';
             const pts = SCORE_VALS[pType] || 0;
             const icon = PIECES[pieceStr] || pType;
             
             if (capturesTeamView === 'white') {
                 linesHTML.unshift(`<div class="audit-item"><span class="audit-move">${moveNumStr} ${san}</span><div style="display:flex; align-items:center; gap:8px;"><span style="font-size:1.15rem; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.3));">${icon}</span><span style="font-size:0.75rem; color:var(--text-3); font-weight:500; min-width:45px;">${pName}</span><span class="audit-change positive">+${pts} pts</span></div></div>`);
             } else {
                 linesHTML.unshift(`<div class="audit-item"><span class="audit-move">${moveNumStr} ${san}</span><div style="display:flex; align-items:center; gap:8px;"><span style="font-size:1.15rem; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.3));">${icon}</span><span style="font-size:0.75rem; color:var(--text-3); font-weight:500; min-width:45px;">${pName}</span><span class="audit-change negative">-${pts} pts</span></div></div>`);
             }
         }
     }
     
     // Did Black Capture something?
     if (bArr.length > lastB) {
         const pieceStr = bArr[bArr.length - 1]; // ex: "Wp"
         if (pieceStr && pieceStr.length > 1) {
             const pType = pieceStr[1].toUpperCase();
             const pName = PIECE_NAMES[pType] || 'Pawn';
             const pts = SCORE_VALS[pType] || 0;
             const icon = PIECES[pieceStr] || pType;
             
             if (capturesTeamView === 'black') {
                 linesHTML.unshift(`<div class="audit-item"><span class="audit-move">${moveNumStr} ${san}</span><div style="display:flex; align-items:center; gap:8px;"><span style="font-size:1.15rem; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.3));">${icon}</span><span style="font-size:0.75rem; color:var(--text-3); font-weight:500; min-width:45px;">${pName}</span><span class="audit-change positive">+${pts} pts</span></div></div>`);
             } else {
                 linesHTML.unshift(`<div class="audit-item"><span class="audit-move">${moveNumStr} ${san}</span><div style="display:flex; align-items:center; gap:8px;"><span style="font-size:1.15rem; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.3));">${icon}</span><span style="font-size:0.75rem; color:var(--text-3); font-weight:500; min-width:45px;">${pName}</span><span class="audit-change negative">-${pts} pts</span></div></div>`);
             }
         }
     }
     
     lastW = wArr.length;
     lastB = bArr.length;
  }
  
  if (linesHTML.length === 0) {
      logEl.innerHTML = '<div style="font-size:0.75rem; color:var(--text-4); text-align:center; padding: 12px; margin-top: 10px;">Zero material exchanges</div>';
  } else {
      logEl.innerHTML = linesHTML.join('');
  }
}

// ── Move Description (for move list display) ─────────────────────
const PIECE_NAMES = { K: 'King', Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight', P: 'Pawn' };

function describeMove(san) {
  const clean = san.replace(/[+#!?]/g, '');
  if (clean === 'O-O')   return 'Kingside castling';
  if (clean === 'O-O-O') return 'Queenside castling';
  const isCapture  = clean.includes('x');
  const promoMatch = clean.match(/=([QRBN])$/);
  let pieceChar = 'P';
  if (/^[KQRBN]/.test(clean)) pieceChar = clean[0];
  const pieceName = PIECE_NAMES[pieceChar] || 'Pawn';
  const destMatch = clean.replace(/=[QRBN]$/, '').match(/([a-h][1-8])$/);
  const dest = destMatch ? destMatch[1].toUpperCase() : '?';
  let desc = pieceName;
  if (isCapture) desc += ` captures ${dest}`;
  else           desc += ` → ${dest}`;
  if (promoMatch)        desc += ` (=${PIECE_NAMES[promoMatch[1]]})`;
  if (san.includes('#')) desc += ' · ✓✓';
  else if (san.includes('+')) desc += ' · ✓';
  return desc;
}

// ── Move List ─────────────────────────────────────────────────────
function renderMoveList(moves) {
  moveListEl.innerHTML = '';
  for (let i = 0; i < moves.length; i += 2) {
    const pair = document.createElement('div');
    pair.className = 'move-pair';
    const numEl = document.createElement('span');
    numEl.className = 'move-num';
    numEl.textContent = `${Math.floor(i / 2) + 1}.`;
    pair.appendChild(numEl);
    pair.appendChild(buildMoveChip(moves[i], i + 1));
    if (i + 1 < moves.length) {
      pair.appendChild(buildMoveChip(moves[i + 1], i + 2));
    } else {
      pair.appendChild(document.createElement('span'));
    }
    moveListEl.appendChild(pair);
  }
}

function buildMoveChip(san, step) {
  const chip   = document.createElement('div');
  chip.className = 'move-chip';
  chip.dataset.step = step;
  chip.setAttribute('role', 'listitem');
  const sanEl  = document.createElement('span');
  sanEl.className = 'move-san';
  sanEl.textContent = san;
  const descEl = document.createElement('span');
  descEl.className = 'move-desc';
  descEl.textContent = describeMove(san);
  
  chip.appendChild(sanEl);
  chip.appendChild(descEl);
  chip.addEventListener('click', () => { stopPlay(); jumpToStep(step); });
  return chip;
}

// Scroll active move into center of visible list area horizontally
function highlightMove(step) {
  moveListEl.querySelectorAll('.move-chip').forEach(el =>
    el.classList.toggle('active', parseInt(el.dataset.step) === step)
  );
  const active = moveListEl.querySelector('.move-chip.active');
  if (active) {
    const listW     = moveListEl.clientWidth;
    const chipLeft  = active.offsetLeft;
    const chipW     = active.offsetWidth;
    moveListEl.scrollTo({ left: chipLeft - listW / 2 + chipW / 2, behavior: 'smooth' });
  }
}

// ── Progress ──────────────────────────────────────────────────────
function idxToSq(idx) {
  return String.fromCharCode(97 + (idx % 8)) + (Math.floor(idx / 8) + 1);
}

function updateProgress() {
  const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  progressKnob.style.left  = `${pct}%`;
  progressTrack.setAttribute('aria-valuenow', Math.round(pct));
  const label = `Move ${currentStep} / ${totalSteps}`;
  if (progressLabel) progressLabel.textContent = label;
  if (moveCounter)   moveCounter.textContent   = `${currentStep} / ${totalSteps}`;
}

// ── Status Bar ────────────────────────────────────────────────────
function updateStatus(step) {
  if (step === 0) {
    statusText.textContent = 'Starting position';
    return;
  }
  const hist = gameHistory[step - 1];
  if (!hist) return;
  const { move } = hist;
  // odd step = White moved, even step = Black moved
  const color   = step % 2 === 1 ? 'White' : 'Black';
  const fromSq  = idxToSq(move.from);
  const toSq    = idxToSq(move.to);
  const desc    = describeMove(move.san);
  statusText.textContent = `${color}: ${move.san} — ${desc}  (${fromSq} → ${toSq})`;
}

// ── Navigation ────────────────────────────────────────────────────
let lastVoiceStep = -1;

function jumpToStep(step) {
  if (step < 0 || step > totalSteps) return;
  currentStep = step;
  updateView();
}

function updateView() {
  const board = boardStates[currentStep];
  const caps  = captureStates[currentStep];
  let fromIdx = null, toIdx = null;
  if (currentStep > 0 && gameHistory[currentStep - 1]) {
    fromIdx = gameHistory[currentStep - 1].move.from;
    toIdx   = gameHistory[currentStep - 1].move.to;
  }
  renderBoard(board, fromIdx, toIdx);
  if (caps) renderCaptures(caps.capturedByWhite, caps.capturedByBlack);
  updateProgress();
  updateStatus(currentStep);
  highlightMove(currentStep);
  syncButtons();
  syncSpeedSlider();

  // Engine Evaluation
  if (stockfish) {
    const tempEngine = new ChessEngine();
    for (let i = 0; i < currentStep; i++) {
        tempEngine.applySAN(allMoves[i]);
    }
    const fen = tempEngine.generateFen();
    evaluatingStep = currentStep;
    console.log(`[Engine] Analyzing Step ${currentStep}: ${fen}`);
    stockfish.postMessage(`position fen ${fen}`);
    stockfish.postMessage('go depth 10');
  }

  // Speak move (only if it's a new step, not on jump-back re-renders of same step)
  if (currentStep !== lastVoiceStep && currentStep > 0) {
    speakMove(currentStep);
  }
  lastVoiceStep = currentStep;
}

function syncButtons() {
  btnStart.disabled     = currentStep === 0;
  btnPrev.disabled      = currentStep === 0;
  btnNext.disabled      = currentStep === totalSteps;
  btnEnd.disabled       = currentStep === totalSteps;
  btnPlayPause.disabled = totalSteps === 0;
}

function syncSpeedSlider() {
  const min = parseInt(speedSlider.min);
  const max = parseInt(speedSlider.max);
  const val = parseInt(speedSlider.value);
  const pct = ((val - min) / (max - min)) * 100;
  speedSlider.style.setProperty('--fill', `${pct}%`);
}

// ── Playback ──────────────────────────────────────────────────────
function startPlay() {
  if (currentStep >= totalSteps) jumpToStep(0);
  isPlaying = true;
  btnPlayPause.classList.add('playing');
  playIconSvg.innerHTML = PAUSE_SVG;
  if (playLabelEl) playLabelEl.textContent = 'Pause';
  statusDot.style.background = '#ef5350';
  playInterval = setInterval(() => {
    if (currentStep >= totalSteps) { stopPlay(); return; }
    jumpToStep(currentStep + 1);
  }, playSpeed);
}

function stopPlay() {
  isPlaying = false;
  clearInterval(playInterval);
  playInterval = null;
  btnPlayPause.classList.remove('playing');
  playIconSvg.innerHTML = PLAY_SVG;
  if (playLabelEl) playLabelEl.textContent = 'Play';
  statusDot.style.background = '';
}

function togglePlay() {
  if (isPlaying) stopPlay();
  else startPlay();
}

// ── Event Listeners ───────────────────────────────────────────────
btnPlayPause.addEventListener('click', togglePlay);
btnStart.addEventListener('click', () => { stopPlay(); speechSynthesis.cancel(); jumpToStep(0); });
btnEnd.addEventListener('click',   () => { stopPlay(); jumpToStep(totalSteps); });
btnPrev.addEventListener('click',  () => { stopPlay(); speechSynthesis.cancel(); jumpToStep(currentStep - 1); });
btnNext.addEventListener('click',  () => { stopPlay(); jumpToStep(currentStep + 1); });
if (btnClear) {
    btnClear.addEventListener('click', fullReset);
}

speedSlider.addEventListener('input', () => {
  playSpeed = parseInt(speedSlider.value);
  speedVal.textContent = `${(playSpeed / 1000).toFixed(1)}s`;
  syncSpeedSlider();
  if (isPlaying) { stopPlay(); startPlay(); }
});

progressTrack.addEventListener('click', e => {
  if (totalSteps === 0) return;
  const rect = progressTrack.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  jumpToStep(Math.round(pct * totalSteps));
});

// ── Keyboard Shortcuts ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target === pgnInput) return;
  const map = {
    Space:      () => { e.preventDefault(); togglePlay(); },
    ArrowRight: () => { e.preventDefault(); stopPlay(); jumpToStep(currentStep + 1); },
    ArrowLeft:  () => { e.preventDefault(); stopPlay(); speechSynthesis.cancel(); jumpToStep(currentStep - 1); },
    Home:       () => { e.preventDefault(); stopPlay(); speechSynthesis.cancel(); jumpToStep(0); },
    End:        () => { e.preventDefault(); stopPlay(); jumpToStep(totalSteps); },
  };
  if (map[e.code]) map[e.code]();
});

pgnInput.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); loadGame(); }
});

// ── Sample Games (local fallback) ─────────────────────────────
const SAMPLE_GAMES = [
  {
    name: 'Immortal Game (Anderssen vs Kieseritzky, 1851)',
    pgn: `[Event "London"]
[Site "London ENG"]
[Date "1851.06.21"]
[White "Adolf Anderssen"]
[Black "Lionel Kieseritzky"]
[Result "1-0"]

1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6
7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6
13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6
Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`
  },
  {
    name: 'Opera Game (Morphy vs Consultants, 1858)',
    pgn: `[Event "Paris Opera"]
[Site "Paris FRA"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duke Karl / Count Isouard"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6
7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O
Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`
  },
  {
    name: 'Evergreen Game (Anderssen vs Dufresne, 1852)',
    pgn: `[Event "Berlin"]
[Date "1852.??.??"]
[White "Adolf Anderssen"]
[Black "Jean Dufresne"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4
7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8
13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6
Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+
Kf8 24. Bxe7# 1-0`
  },
  {
    name: 'Game of the Century (Fischer vs Byrne, 1956)',
    pgn: `[Event "Third Rosenwald Trophy"]
[Site "New York, NY USA"]
[Date "1956.10.17"]
[White "Donald Byrne"]
[Black "Robert James Fischer"]
[Result "0-1"]

1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4
7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3
13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6
18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+
23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2
28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5
33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+
37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`
  },
  {
    name: 'Kasparov vs Topalov, 1999 (Kasparov\'s Immortal)',
    pgn: `[Event "Hoogeveen"]
[Site "Hoogeveen NED"]
[Date "1999.10.20"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7
8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O
14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5
20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4
25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7
30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2
35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3
40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    name: 'Deep Blue vs Kasparov, 1996 Game 1',
    pgn: `[Event "IBM Man-Machine, New York USA"]
[Site "Philadelphia USA"]
[Date "1996.02.10"]
[White "Deep Blue"]
[Black "Garry Kasparov"]
[Result "1-0"]

1. e4 c5 2. c3 d5 3. exd5 Qxd5 4. d4 Nf6 5. Nf3 Bg4 6. Be2 e6 7. h3 Bh5
8. O-O Nc6 9. Be3 cxd4 10. cxd4 Bb4 11. a3 Ba5 12. Nc3 Qd6 13. Nb5 Qe7
14. Ne5 Bxe2 15. Qxe2 O-O 16. Rac1 Rac8 17. Bg5 Bb6 18. Bxf6 gxf6 19. Nc4 Rfd8
20. Nxb6 axb6 21. Rfd1 f5 22. Qe3 Qf6 23. d5 Rxd5 24. Rxd5 exd5 25. b3 Kh8
26. Qxb6 Rg8 27. Qc5 d4 28. Nd6 f4 29. Nxb7 Ne5 30. Qd5 f3 31. g3 Nd3
32. Rc7 Re8 33. Nd6 Re1+ 34. Kh2 Nxf2 35. Nxf7+ Kg7 36. Ng5+ Kh6 37. Rxh7# 1-0`
  },
];

if (btnLoadSample) {
  btnLoadSample.addEventListener('click', () => {
    const g = SAMPLE_GAMES[Math.floor(Math.random() * SAMPLE_GAMES.length)];
    pgnInput.value = g.pgn;
    showToast(`Loaded: ${g.name}`, 'ok');
  });
}

// ── PGN Mentor — fetch ZIP → unzip → load first game ─────────────
// All URLs scraped from https://www.pgnmentor.com/files.html
// (same list as games_list.txt, line 2 onwards)
const PGNMENTOR_URLS = [
  'https://www.pgnmentor.com/players/Abdusattorov.zip',
  'https://www.pgnmentor.com/players/Adams.zip',
  'https://www.pgnmentor.com/players/Akobian.zip',
  'https://www.pgnmentor.com/players/Akopian.zip',
  'https://www.pgnmentor.com/players/Alekhine.zip',
  'https://www.pgnmentor.com/players/Alexeev.zip',
  'https://www.pgnmentor.com/players/Anand.zip',
  'https://www.pgnmentor.com/players/Anderssen.zip',
  'https://www.pgnmentor.com/players/Aronian.zip',
  'https://www.pgnmentor.com/players/Bacrot.zip',
  'https://www.pgnmentor.com/players/Botvinnik.zip',
  'https://www.pgnmentor.com/players/Bronstein.zip',
  'https://www.pgnmentor.com/players/Capablanca.zip',
  'https://www.pgnmentor.com/players/Carlsen.zip',
  'https://www.pgnmentor.com/players/Caruana.zip',
  'https://www.pgnmentor.com/players/Chigorin.zip',
  'https://www.pgnmentor.com/players/Ding.zip',
  'https://www.pgnmentor.com/players/Duda.zip',
  'https://www.pgnmentor.com/players/Euwe.zip',
  'https://www.pgnmentor.com/players/Erigaisi.zip',
  'https://www.pgnmentor.com/players/Firouzja.zip',
  'https://www.pgnmentor.com/players/Fischer.zip',
  'https://www.pgnmentor.com/players/Gelfand.zip',
  'https://www.pgnmentor.com/players/Giri.zip',
  'https://www.pgnmentor.com/players/Grischuk.zip',
  'https://www.pgnmentor.com/players/Gukesh.zip',
  'https://www.pgnmentor.com/players/Harikrishna.zip',
  'https://www.pgnmentor.com/players/Ivanchuk.zip',
  'https://www.pgnmentor.com/players/Kamsky.zip',
  'https://www.pgnmentor.com/players/Karjakin.zip',
  'https://www.pgnmentor.com/players/Karpov.zip',
  'https://www.pgnmentor.com/players/Kasparov.zip',
  'https://www.pgnmentor.com/players/Keres.zip',
  'https://www.pgnmentor.com/players/Koneru.zip',
  'https://www.pgnmentor.com/players/Korchnoi.zip',
  'https://www.pgnmentor.com/players/Kramnik.zip',
  'https://www.pgnmentor.com/players/Larsen.zip',
  'https://www.pgnmentor.com/players/Lasker.zip',
  'https://www.pgnmentor.com/players/Leko.zip',
  'https://www.pgnmentor.com/players/Mamedyarov.zip',
  'https://www.pgnmentor.com/players/Morphy.zip',
  'https://www.pgnmentor.com/players/Nakamura.zip',
  'https://www.pgnmentor.com/players/Nepomniachtchi.zip',
  'https://www.pgnmentor.com/players/Nimzowitsch.zip',
  'https://www.pgnmentor.com/players/Petrosian.zip',
  'https://www.pgnmentor.com/players/Philidor.zip',
  'https://www.pgnmentor.com/players/PolgarJ.zip',
  'https://www.pgnmentor.com/players/Praggnanandhaa.zip',
  'https://www.pgnmentor.com/players/Radjabov.zip',
  'https://www.pgnmentor.com/players/Rubinstein.zip',
  'https://www.pgnmentor.com/players/Shirov.zip',
  'https://www.pgnmentor.com/players/Short.zip',
  'https://www.pgnmentor.com/players/Smyslov.zip',
  'https://www.pgnmentor.com/players/So.zip',
  'https://www.pgnmentor.com/players/Spassky.zip',
  'https://www.pgnmentor.com/players/Steinitz.zip',
  'https://www.pgnmentor.com/players/Tal.zip',
  'https://www.pgnmentor.com/players/Tarrasch.zip',
  'https://www.pgnmentor.com/players/Timman.zip',
  'https://www.pgnmentor.com/players/Topalov.zip',
  'https://www.pgnmentor.com/players/VachierLagrave.zip',
  'https://www.pgnmentor.com/players/VanWely.zip',
  'https://www.pgnmentor.com/players/Wojtaszek.zip',
  'https://www.pgnmentor.com/players/Zukertort.zip',
];

// List of public CORS proxies for fetching ZIP arrays explicitly ensuring maximum fallback support natively.
const CORS_PROXIES = [
  url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
  url => `https://crossorigin.me/${url}`
];

/**
 * Strip PGN annotations so the engine can parse cleanly:
 *   {comments}, (variations), $NAG, ;line comments
 * Only applied to the movetext, not the [Tag] headers.
 */
function stripAnnotations(pgn) {
  // Separate headers (everything up to last ]) from movetext
  const lastBracket = pgn.lastIndexOf(']');
  if (lastBracket === -1) return pgn;
  const headers   = pgn.slice(0, lastBracket + 1);
  let   movetext  = pgn.slice(lastBracket + 1);

  // Character-by-character strip
  let out = '';
  let depth = 0;      // parenthesis depth (variations)
  let inBrace = false;
  let inSemi  = false;

  for (let i = 0; i < movetext.length; i++) {
    const c = movetext[i];
    if (inSemi)  { if (c === '\n') inSemi = false; continue; }
    if (inBrace) { if (c === '}') inBrace = false; continue; }
    if (c === '{') { inBrace = true; continue; }
    if (c === ';') { inSemi  = true; continue; }
    if (c === '(') { depth++;  continue; }
    if (c === ')') { depth--;  continue; }
    if (depth > 0) continue;
    if (c === '$') { // NAG: $1, $2 …
      while (i + 1 < movetext.length && /\d/.test(movetext[i + 1])) i++;
      continue;
    }
    out += c;
  }

  // Collapse whitespace and return full PGN
  return headers + '\n\n' + out.replace(/\s+/g, ' ').trim();
}

/**
 * Extract the first complete game from a multi-game PGN file.
 * A game runs from [Event to its terminal result token.
 */
function extractFirstGame(fullPgn) {
  // Normalise line endings
  const text = fullPgn.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Match: optional BOM/whitespace, then one full game
  const m = text.match(/(\[Event[\s\S]+?(?:1-0|0-1|1\/2-1\/2|\*)\s*(?:\n|$))/);
  return m ? m[1].trim() : text.trim();
}

const btnFetch   = $('btn-fetch-game');
const fetchLabel = $('fetch-label');

async function fetchZipAndLoad(zipUrl) {
  for (const makeProxy of CORS_PROXIES) {
    try {
      const proxyUrl = makeProxy(zipUrl);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(18000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      if (buf.byteLength < 500) throw new Error('Buffer too small. Ignored.');

      const zip = await JSZip.loadAsync(buf);
      const pgnEntry = Object.values(zip.files).find(f => !f.dir && f.name.toLowerCase().endsWith('.pgn'));
      if (!pgnEntry) throw new Error('No PGN inside ZIP');

      const rawPgn = await pgnEntry.async('string');
      const firstGame = extractFirstGame(rawPgn);
      return stripAnnotations(firstGame);
    } catch (err) {
      console.warn(`[Proxy Failed] ${zipUrl}:`, err.message);
    }
  }
  throw new Error('All CORS proxies unconditionally exhausted or forcibly blocked by origin server.');
}

async function loadRandomGameFromList() {
  if (!btnFetch) return;

  btnFetch.disabled = true;
  btnFetch.classList.add('loading');
  fetchLabel.textContent = 'Fetching…';

  try {
    const urls = (typeof GAMES_LIST !== 'undefined') ? GAMES_LIST : [];
    if (urls.length === 0) {
        throw new Error('No legitimate ZIP URLs mapped inside native games_assets.js');
    }

    // Select random pgnmentor zip URL dynamically seamlessly!
    const zipUrl = urls[Math.floor(Math.random() * urls.length)];
    const playerName = zipUrl.split('/').pop().replace('.zip', '');
    showToast(`📥 Fetching ${playerName}'s GM games...`);
    
    const pgn = await fetchZipAndLoad(zipUrl);
    pgnInput.value = pgn;
    
    showToast(`✓ Loaded game from ${playerName}!`, 'ok');
    loadGame();
  } catch (err) {
    console.warn('[Fetch Crash]:', err.message);
    const fallback = SAMPLE_GAMES[Math.floor(Math.random() * SAMPLE_GAMES.length)];
    pgnInput.value = fallback.pgn;
    showToast(`⚡ Fallback Loaded: ${fallback.name}`, 'err');
    loadGame();
  } finally {
    btnFetch.disabled = false;
    btnFetch.classList.remove('loading');
    fetchLabel.textContent = 'Load a Game';
  }
}

if (btnFetch) {
  btnFetch.addEventListener('click', loadRandomGameFromList);
}

let currentGameHeaders = {};
function displayGameInfo(headers) {
  currentGameHeaders = headers;
  const btnExplain = $('btn-explain');
  if (btnExplain) btnExplain.disabled = false;

  const hasInfo = headers.Event || headers.White || headers.Date;
  if (!hasInfo) { gameInfoEl.classList.add('hidden'); return; }
  gameInfoEl.classList.remove('hidden');
  const set = (el, label, val) => {
    if (val) el.innerHTML = `<span class="info-label">${label}</span><span class="info-value">${val}</span>`;
    else el.textContent = '';
  };
  set(infoEvent,   'Event',   headers.Event);
  set(infoPlayers, 'Players', headers.White && headers.Black ? `${headers.White} vs ${headers.Black}` : null);
  set(infoDate,    'Date',    headers.Date);
  if (headers.Result) {
    const r = headers.Result === '1-0' ? 'White wins' : headers.Result === '0-1' ? 'Black wins' : '½–½ Draw';
    set(infoResult, 'Result', r);
  } else infoResult.textContent = '';
}

// ── Full Reset ────────────────────────────────────────────────────
function fullReset() {
  stopPlay();
  if (window.speechSynthesis) speechSynthesis.cancel();

  engine = new ChessEngine();
  allMoves = [];
  gameHistory = [];
  boardStates = [[...engine.board]];
  captureStates = [{ capturedByWhite: [], capturedByBlack: [] }];
  moveEvaluations = [];

  currentStep = 0;
  totalSteps = 0;
  lastVoiceStep = -1;

  if (pgnInput) {
    pgnInput.value = '';
    pgnInput.focus();
  }
  if (moveListEl) moveListEl.innerHTML = '';
  if (statusText) statusText.textContent = 'Paste a PGN and click Visualize Game';
  if (statusDot) statusDot.className = 'status-dot';

  displayGameInfo({});
  renderCaptures([], []);
  jumpToStep(0);
  
  showToast('Interface Cleared', 'ok');
}

// ── Load Game ─────────────────────────────────────────────────────
function loadGame() {
  const pgn = pgnInput.value.trim();
  if (!pgn) { showToast('Paste a PGN first', 'err'); return; }
  stopPlay();
  speechSynthesis.cancel();
  engine = new ChessEngine();
  allMoves = []; gameHistory = []; boardStates = []; captureStates = [];
  moveEvaluations = [];

  currentStep = 0; lastVoiceStep = -1;

  let parsed;
  try { parsed = engine.parsePGN(pgn); }
  catch { showToast('Could not parse PGN', 'err'); return; }
  if (!parsed.moves?.length) { showToast('No moves found in PGN', 'err'); return; }

  allMoves = parsed.moves;
  boardStates.push([...engine.board]);
  captureStates.push({ capturedByWhite: [], capturedByBlack: [] });

  let failedAt = -1;
  for (let i = 0; i < allMoves.length; i++) {
    const result = engine.applySAN(allMoves[i]);
    if (!result) { failedAt = i; break; }
    const hist = engine.history[engine.history.length - 1];
    gameHistory.push(hist);
    boardStates.push([...hist.boardSnapshot]);
    captureStates.push({ capturedByWhite: [...hist.capturedByWhite], capturedByBlack: [...hist.capturedByBlack] });
  }

  totalSteps = boardStates.length - 1;

  if (failedAt > -1) {
    showToast(`Parsed ${totalSteps} of ${allMoves.length} moves (stopped at "${allMoves[failedAt]}")`, 'err');
    allMoves = allMoves.slice(0, failedAt);
  } else {
    showToast(`✓ Loaded ${totalSteps} moves`, 'ok');
  }

  renderMoveList(allMoves.slice(0, totalSteps));
  displayGameInfo(parsed.headers);
  btnPlayPause.disabled = false;
  
  // Clean UI load action
  const pgnModal = $('pgn-modal');
  if (pgnModal && pgnModal.open) pgnModal.close();

  jumpToStep(0);
}

btnAnalyze.addEventListener('click', loadGame);

// ── Init ─────────────────────────────────────────────────────────
// ── Engine / Stockfish ──────────────────────────────────────────
function initStockfish() {
  try {
      // 1. Create a Blob shim to bypass origin restrictions on file://
      const blobCode = `
        importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        var engine = typeof STOCKFISH === 'function' ? STOCKFISH() : null;
        if (engine) {
          self.onmessage = function(e) { engine.postMessage(e.data); };
          engine.onmessage = function(e) { self.postMessage(e.data); };
        }
      `;
      const blob = new Blob([blobCode], { type: 'application/javascript' });
      const blobURL = URL.createObjectURL(blob);
      
      stockfish = new Worker(blobURL);
      console.log('[Engine] Stockfish initialized via Blob Shim (file:// compatible).');
      
      stockfish.onmessage = (msg) => {
          const line = typeof msg === 'string' ? msg : (msg.data || '');
          if (typeof line !== 'string') return;
          
          if (line.includes('score cp') || line.includes('score mate')) {
              const cpMatch = line.match(/score cp (-?\d+)/);
              const mateMatch = line.match(/score mate (-?\d+)/);
              
              if (cpMatch) {
                  updateEvalBar(parseInt(cpMatch[1]));
              } else if (mateMatch) {
                  const mate = parseInt(mateMatch[1]);
                  updateEvalBar(mate > 0 ? 1000 : -1000);
              }
          }
      };
      
      stockfish.postMessage('uci');
      stockfish.postMessage('ucinewgame');
      stockfish.postMessage('isready');
  } catch (e) {
      console.error('[Engine] Failed to init Stockfish:', e);
  }
}

function updateEvalBar(cp) {
  const score = cp / 100;
  lastEval = score;
  
  if (evaluatingStep !== -1) {
    moveEvaluations[evaluatingStep] = score;
  }

  const fill = $('eval-bar-fill');
  const valText = $('eval-val');
  if (!fill || !valText) return;

  // Percentage for UI: +10 is 95%, 0 is 50%, -10 is 5%
  let pct = 50 + (score * 4.5);
  pct = Math.max(5, Math.min(95, pct));
  
  fill.style.height = `${pct}%`;
  valText.textContent = (score > 0 ? '+' : '') + score.toFixed(1);

  // Update Nav Score Tile
  const navTile = $('nav-eval-tile');
  const navVal  = $('nav-eval-val');
  if (navTile && navVal) {
      navTile.style.display = 'flex';
      navVal.textContent = (score > 0 ? '+' : '') + score.toFixed(1);
      
      navTile.classList.remove('nav-eval-pos', 'nav-eval-neg', 'nav-eval-neu');
      if (score > 0.2)       navTile.classList.add('nav-eval-pos');
      else if (score < -0.2) navTile.classList.add('nav-eval-neg');
      else                   navTile.classList.add('nav-eval-neu');
  }

  // Update Transcript if live
  updateExplainTranscript();
}

function getMoveRating(step) {
  if (step === 0) return null;
  const current = moveEvaluations[step];
  const prev    = moveEvaluations[step - 1];
  
  if (current === undefined || prev === undefined) return null;

  const diff = current - prev;
  const isWhiteMove = step % 2 !== 0;
  const loss = isWhiteMove ? -diff : diff;

  if (loss > 2.0) return { label: 'Blunder', color: '#ff4b4b', icon: '??' };
  if (loss > 1.0) return { label: 'Mistake', color: '#ffa500', icon: '?' };
  if (loss > 0.5) return { label: 'Inaccuracy', color: '#dbdb00', icon: '?!' };
  if (loss < -0.5) return { label: 'Great Move', color: '#00d0ff', icon: '!!' };
  if (loss < 0.1)  return { label: 'Best Move', color: '#45e645', icon: '★' };
  return { label: 'Good Move', color: '#45e645', icon: '✓' };
}

function init() {
  initBoard();
  initStockfish();
  speedVal.textContent = `${(playSpeed / 1000).toFixed(1)}s`;
  speedSlider.value = playSpeed;
  syncSpeedSlider();
  syncVoiceButton();
  syncExplainButton();

  engine = new ChessEngine();
  boardStates   = [[...engine.board]];
  captureStates = [{ capturedByWhite: [], capturedByBlack: [] }];
  currentStep = 0; totalSteps = 0;

  renderBoard(engine.board);
  updateProgress();
  syncButtons();
  showToast('♟  Paste a PGN or load a sample game');
}

init();

// Arrow Button Listeners for Top Move List
const scrollLeftBtn = $('move-scroll-left');
const scrollRightBtn = $('move-scroll-right');
const topMoveListEl = $('move-list');
if (scrollLeftBtn && topMoveListEl) {
    scrollLeftBtn.addEventListener('click', () => {
        topMoveListEl.scrollBy({ left: -300, behavior: 'smooth' });
    });
}
if (scrollRightBtn && topMoveListEl) {
    scrollRightBtn.addEventListener('click', () => {
        topMoveListEl.scrollBy({ left: 300, behavior: 'smooth' });
    });
}

if (btnExplain) {
    btnExplain.addEventListener('click', () => {
        explainOn = !explainOn;
        syncExplainButton();
        if (explainOn) updateExplainTranscript();
    });
}

// Mobile Menu Logic
const menuModal = $('menu-modal');
const btnHamburger = $('btn-hamburger');
const menuBody = $('menu-modal-body');
const topActions = $('top-bar-actions');

if (btnHamburger && menuModal) {
    btnHamburger.addEventListener('click', () => {
        const buttons = Array.from(topActions.querySelectorAll('.md-btn'));
        buttons.forEach(btn => menuBody.appendChild(btn));
        menuModal.showModal();
    });

    const btnCloseMenu = $('btn-close-menu');
    if (btnCloseMenu) btnCloseMenu.addEventListener('click', () => menuModal.close());
    
    menuModal.addEventListener('close', () => {
        const buttons = Array.from(menuBody.querySelectorAll('.md-btn'));
        buttons.forEach(btn => topActions.insertBefore(btn, btnHamburger));
    });
    
    menuModal.addEventListener('click', e => {
        if(e.target === menuModal) menuModal.close();
    });
}

function syncExplainButton() {
    if (!btnExplain) return;
    btnExplain.classList.toggle('active', explainOn);
    if (explainLabel) explainLabel.textContent = explainOn ? 'Explain On' : 'Explain Off';
    if (explainPanel) explainPanel.classList.toggle('hidden', !explainOn);

    // Dynamic Status Bar relocation
    const statusBar = $('status-bar');
    const boardLoc = $('board-footer-container');
    const sidebarLoc = $('explain-status-container');
    
    if (statusBar && boardLoc && sidebarLoc) {
        if (explainOn) {
            sidebarLoc.appendChild(statusBar);
            statusBar.style.boxShadow = 'none';
            statusBar.style.marginTop = '0';
        } else {
            boardLoc.appendChild(statusBar);
            statusBar.style.boxShadow = 'var(--nm-raised-sm)';
            statusBar.style.marginTop = 'auto';
        }
    }
}

function updateExplainTranscript() {
    if (!explainOn) return;
    const transcriptEl = $('explain-transcript');
    if (!transcriptEl) return;
    
    // If it's the start, just clear if it's many moves in? 
    // Usually transcript grows as you play.
    if (currentStep === 0 && !analyzedSteps.has(0)) {
        transcriptEl.innerHTML = '';
    } else {
        const placeholder = transcriptEl.querySelector('.transcript-placeholder');
        if (placeholder) placeholder.remove();
    }

    if (analyzedSteps.has(currentStep)) return; 

    const evalScore = lastEval || 0;
    const rating = getMoveRating(currentStep);
    if (!rating && currentStep > 0 && Math.abs(evalScore) < 0.01) return; // Wait for real eval

    const item = document.createElement('div');
    item.className = 'transcript-item';
    if (rating) item.style.borderLeftColor = rating.color;

    let outlook = "Balanced.";
    if (evalScore > 1.5) outlook = "White dominating.";
    else if (evalScore > 0.6) outlook = "White has clear edge.";
    else if (evalScore < -1.5) outlook = "Black dominating.";
    else if (evalScore < -0.6) outlook = "Black has clear edge.";

    const moveStr = currentStep > 0 ? allMoves[currentStep - 1] : "Start";
    const speechDesc = buildSpeechText(currentStep);

    item.innerHTML = `
        <div class="transcript-header">
            <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">Step ${currentStep}: ${speechDesc}</span>
            <span class="transcript-eval">${(evalScore > 0 ? '+' : '')}${evalScore.toFixed(1)}</span>
        </div>
        ${rating ? `
        <div class="transcript-rating" style="color:${rating.color}">
            <span style="background:${rating.color}; color:#fff; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75rem;">${rating.icon}</span>
            <span style="font-size:0.85rem;">${rating.label}</span>
        </div>` : ''}
        <div class="transcript-text">
            <div style="font-size:0.85rem; color:var(--text-2); line-height:1.5;">
                ${currentStep === 0 ? 'Engine analysis initiated at starting position.' : `This move brings the evaluation to <b>${evalScore.toFixed(1)}</b>. ${outlook}`}
            </div>
        </div>
    `;
    
    transcriptEl.appendChild(item);
    analyzedSteps.add(currentStep);
    transcriptEl.scrollTo({ top: transcriptEl.scrollHeight, behavior: 'smooth' });
}


// Modal Interactions
const pgnModal = $('pgn-modal');
const detailsModal = $('details-modal');
const btnOpenPgn = $('btn-open-pgn');
const btnClosePgn = $('btn-close-pgn');
const btnOpenDetails = $('btn-open-details');
const btnCloseDetails = $('btn-close-details');
const btnLoadPgn = $('btn-load-pgn');
if (btnLoadPgn && pgnModal) {
    btnLoadPgn.addEventListener('click', () => {
        if ($('pgn-modal-title')) $('pgn-modal-title').textContent = "Load PGN Game";
        pgnInput.placeholder = "Paste a PGN here (e.g. 1. e4 e5...)";
        pgnModal.showModal();
    });
}

if (btnOpenPgn && pgnModal) {
    btnOpenPgn.addEventListener('click', () => {
        if ($('pgn-modal-title')) $('pgn-modal-title').textContent = "View/Export PGN";
        pgnModal.showModal();
    });
    btnClosePgn.addEventListener('click', () => pgnModal.close());
    pgnModal.addEventListener('click', e => {
        if(e.target === pgnModal) pgnModal.close();
    });
}
if (btnOpenDetails && detailsModal) {
    btnOpenDetails.addEventListener('click', () => detailsModal.showModal());
    btnCloseDetails.addEventListener('click', () => detailsModal.close());
    detailsModal.addEventListener('click', e => {
        if(e.target === detailsModal) detailsModal.close();
    });
}

// Score Modal Interactions
const capturesModal = $('captures-modal');
const btnCloseCaptures = $('btn-close-captures');
const btnScoreWhite = $('btn-score-white');
const btnScoreBlack = $('btn-score-black');

if (btnScoreWhite && capturesModal) {
    btnScoreWhite.addEventListener('click', () => {
        if (typeof capturesTeamView !== 'undefined') capturesTeamView = 'white';
        if (typeof updateCapturesModal === 'function') updateCapturesModal();
        capturesModal.showModal();
    });
}
if (btnScoreBlack && capturesModal) {
    btnScoreBlack.addEventListener('click', () => {
        if (typeof capturesTeamView !== 'undefined') capturesTeamView = 'black';
        if (typeof updateCapturesModal === 'function') updateCapturesModal();
        capturesModal.showModal();
    });
}
if (btnCloseCaptures) btnCloseCaptures.addEventListener('click', () => capturesModal.close());
if (capturesModal) capturesModal.addEventListener('click', e => { 
    if (e.target === capturesModal) capturesModal.close(); 
});
