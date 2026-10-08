// Tangram Studio — Game Controller & Solver Engine

// ── 1. Geometric Definition of Tans (Local Coordinate Centroids) ──
const LOCAL_VERTICES = {
  LT1: [[-120, -40], [120, -40], [0, 80]],       // Large Triangle 1 (base=240, height=120)
  LT2: [[-120, -40], [120, -40], [0, 80]],       // Large Triangle 2 (base=240, height=120)
  MT:  [[40, 40], [40, -80], [-80, 40]],          // Medium Triangle (legs=120)
  ST1: [[-60, -20], [60, -20], [0, 40]],          // Small Triangle 1 (base=120, height=60)
  ST2: [[-60, -20], [60, -20], [0, 40]],          // Small Triangle 2 (base=120, height=60)
  SQ:  [[0, -60], [60, 0], [0, 60], [-60, 0]],    // Square (side=84.85, rotated 45 deg)
  PL:  [[-90, 30], [30, 30], [90, -30], [-30, -30]] // Parallelogram (base=120, height=60)
};

// Premium HSL Pastel Theme for Pieces
const PIECE_COLORS = {
  LT1: "linear-gradient(135deg, #a78bfa, #8b5cf6)", // Violet
  LT2: "linear-gradient(135deg, #f472b6, #ec4899)", // Pink
  MT:  "linear-gradient(135deg, #fb7185, #f43f5e)", // Rose
  SQ:  "linear-gradient(135deg, #38bdf8, #0ea5e9)", // Light Blue
  ST1: "linear-gradient(135deg, #4ade80, #22c55e)", // Green
  ST2: "linear-gradient(135deg, #facc15, #eab308)", // Yellow
  PL:  "linear-gradient(135deg, #fb923c, #f97316)"  // Orange
};

const SVG_PIECE_COLORS = {
  LT1: "#8b5cf6",
  LT2: "#ec4899",
  MT:  "#f43f5e",
  SQ:  "#0ea5e9",
  ST1: "#22c55e",
  ST2: "#eab308",
  PL:  "#f97316"
};

// Default Tray/Scatter Centroids
const SCATTER_POSITIONS = {
  LT1: { x: 75,  y: 110, rotation: 0,   flipped: false },
  LT2: { x: 75,  y: 280, rotation: 90,  flipped: false },
  MT:  { x: 75,  y: 450, rotation: 180, flipped: false },
  SQ:  { x: 525, y: 120, rotation: 0,   flipped: false },
  PL:  { x: 525, y: 240, rotation: 45,  flipped: false },
  ST1: { x: 525, y: 370, rotation: 90,  flipped: false },
  ST2: { x: 525, y: 480, rotation: 270, flipped: false }
};

// ── 2. Application State ──
let activeLevel = null;
let currentPieces = []; // array of { name, x, y, rotation, flipped }
let selectedPieceName = null;
let overlappingPieceNames = new Set();
let isSandboxMode = false;
let customLevels = [];

// History stacks for Undo/Redo
let undoStack = [];
let redoStack = [];

// Timer and moves
let timerInterval = null;
let timeElapsed = 0; // seconds
let movesCount = 0;
let isSolved = false;

// Drag & Drop State
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };
let hasMovedDuringDrag = false;

// ── 3. DOM Elements ──
const boardSvg = document.getElementById("tangram-board");
const piecesLayer = document.getElementById("pieces-layer");
const silhouetteLayer = document.getElementById("target-silhouette");
const guidesLayer = document.getElementById("guides-layer");

const timerValEl = document.getElementById("timer-val");
const movesValEl = document.getElementById("moves-val");
const completenessTextEl = document.getElementById("completeness-percentage");
const completenessFillEl = document.getElementById("completeness-fill");

const levelNameEl = document.getElementById("level-name");
const levelDiffEl = document.getElementById("level-difficulty");
const statusBarEl = document.getElementById("status-bar");
const statusTextEl = document.getElementById("status-text");
const statusDotEl = document.getElementById("status-dot");

const actionLogEl = document.getElementById("action-log");

const btnRotCw = document.getElementById("btn-rot-cw");
const btnRotCcw = document.getElementById("btn-rot-ccw");
const btnFlip = document.getElementById("btn-flip");
const btnUndo = document.getElementById("btn-undo");
const btnRedo = document.getElementById("btn-redo");
const btnScatter = document.getElementById("btn-scatter");
const btnReset = document.getElementById("btn-reset");
const btnModeToggle = document.getElementById("btn-mode-toggle");
const btnDarkToggle = document.getElementById("btn-dark-toggle");
const btnHelp = document.getElementById("btn-help");

const builtInListEl = document.getElementById("built-in-list");
const customListEl = document.getElementById("custom-list");
const tabBuiltIn = document.getElementById("tab-built-in");
const tabCustom = document.getElementById("tab-custom");

const sandboxPanel = document.getElementById("sandbox-panel");
const txtLevelName = document.getElementById("txt-level-name");
const selLevelDifficulty = document.getElementById("sel-level-difficulty");
const btnSaveLevel = document.getElementById("btn-save-level");
const txtJsonExport = document.getElementById("txt-json-export");
const btnImportLevel = document.getElementById("btn-import-level");

const helpDialog = document.getElementById("help-dialog");
const btnCloseHelp = document.getElementById("btn-close-help");
const winDialog = document.getElementById("win-dialog");
const winLevelName = document.getElementById("win-level-name");
const winTimeEl = document.getElementById("win-time");
const winMovesEl = document.getElementById("win-moves");
const btnWinNext = document.getElementById("btn-win-next");

const logScrollLeft = document.getElementById("log-scroll-left");
const logScrollRight = document.getElementById("log-scroll-right");

// ── 4. Initializer ──
function init() {
  loadCustomLevels();
  renderLevelLists();
  
  // Set default level (The Square)
  loadLevel(BUILT_IN_LEVELS[0]);
  
  setupEventListeners();
  startTimer();
  
  // Support default system appearance
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add("dark-theme");
    btnDarkToggle.innerHTML = "<span>☀️</span> Light Mode";
  }
}

// ── 5. Mathematical Geometry Utilities ──

// Calculates global vertices of a piece based on its centroid location, rotation, and flip state
function getGlobalVertices(piece) {
  const local = LOCAL_VERTICES[piece.name];
  const rad = (piece.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const flip = piece.flipped ? -1 : 1;

  return local.map(pt => {
    // Apply horizontal flip relative to its local centroid
    const xFlipped = pt[0] * flip;
    const yFlipped = pt[1];
    
    // Apply rotation matrix
    const xRot = xFlipped * cos - yFlipped * sin;
    const yRot = xFlipped * sin + yFlipped * cos;
    
    // Translate to current coordinates
    return {
      x: xRot + piece.x,
      y: yRot + piece.y
    };
  });
}

// ── 6. Separating Axis Theorem (SAT) Overlap Checker ──
function checkOverlap(pieceA, pieceB) {
  const polyA = getGlobalVertices(pieceA);
  const polyB = getGlobalVertices(pieceB);
  
  const polys = [polyA, polyB];
  const epsilon = 1.0; // overlap tolerance in pixels (1px)
  
  for (let i = 0; i < polys.length; i++) {
    const poly = polys[i];
    for (let j = 0; j < poly.length; j++) {
      // Get edge vector
      const p1 = poly[j];
      const p2 = poly[(j + 1) % poly.length];
      
      // Compute normal vector (projection axis)
      const edgeX = p2.x - p1.x;
      const edgeY = p2.y - p1.y;
      const axis = { x: -edgeY, y: edgeX };
      
      // Normalize axis
      const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
      axis.x /= length;
      axis.y /= length;
      
      // Project both polygons onto axis
      const projA = projectPolygon(polyA, axis);
      const projB = projectPolygon(polyB, axis);
      
      // Check if intervals do NOT overlap
      if (projA.max <= projB.min + epsilon || projB.max <= projA.min + epsilon) {
        return false; // Found separating axis, polygons do NOT overlap
      }
    }
  }
  return true; // Overlap detected on all axes
}

function projectPolygon(poly, axis) {
  let min = poly[0].x * axis.x + poly[0].y * axis.y;
  let max = min;
  for (let i = 1; i < poly.length; i++) {
    const val = poly[i].x * axis.x + poly[i].y * axis.y;
    if (val < min) min = val;
    if (val > max) max = val;
  }
  return { min, max };
}

// Evaluates all pairs of pieces for overlaps
function checkAllOverlaps() {
  overlappingPieceNames.clear();
  
  for (let i = 0; i < currentPieces.length; i++) {
    for (let j = i + 1; j < currentPieces.length; j++) {
      if (checkOverlap(currentPieces[i], currentPieces[j])) {
        overlappingPieceNames.add(currentPieces[i].name);
        overlappingPieceNames.add(currentPieces[j].name);
      }
    }
  }
  
  // Highlight overlapping pieces
  currentPieces.forEach(p => {
    const el = document.getElementById(`piece-el-${p.name}`);
    if (el) {
      if (overlappingPieceNames.has(p.name)) {
        el.classList.add("overlapping");
      } else {
        el.classList.remove("overlapping");
      }
    }
  });

  updateStatusMessage();
}

// ── 7. Intersection over Union (IoU) Solver ──
// Compares the target silhouette with the user shape in an offscreen canvas to verify solutions.
function evaluateMatch() {
  if (isSandboxMode) return; // Solver inactive in Sandbox Mode

  const size = 150;
  const margin = 15;
  const targetAreaSize = size - 2 * margin; // 120px bounding box max

  // Bounding box of target level layout
  const targetPolyVertices = activeLevel.pieces.flatMap(p => getGlobalVertices(p));
  const targetBounds = getBoundingBox(targetPolyVertices);
  const scaleTarget = targetAreaSize / Math.max(targetBounds.w, targetBounds.h);

  // Bounding box of user's current layout
  const userPolyVertices = currentPieces.flatMap(p => getGlobalVertices(p));
  const userBounds = getBoundingBox(userPolyVertices);
  const scaleUser = targetAreaSize / Math.max(userBounds.w, userBounds.h);

  // Canvas 1: Target Shape
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = size;
  targetCanvas.height = size;
  const ctxTarget = targetCanvas.getContext("2d");
  ctxTarget.fillStyle = "white";
  ctxTarget.fillRect(0, 0, size, size);
  ctxTarget.fillStyle = "black";

  // Draw target silhouette centered and scaled
  activeLevel.pieces.forEach(p => {
    const verts = getGlobalVertices(p);
    ctxTarget.beginPath();
    verts.forEach((v, index) => {
      const xCentered = (v.x - targetBounds.cx) * scaleTarget + size / 2;
      const yCentered = (v.y - targetBounds.cy) * scaleTarget + size / 2;
      if (index === 0) ctxTarget.moveTo(xCentered, yCentered);
      else ctxTarget.lineTo(xCentered, yCentered);
    });
    ctxTarget.closePath();
    ctxTarget.fill();
  });

  // Canvas 2: User Shape
  const userCanvas = document.createElement("canvas");
  userCanvas.width = size;
  userCanvas.height = size;
  const ctxUser = userCanvas.getContext("2d");
  ctxUser.fillStyle = "white";
  ctxUser.fillRect(0, 0, size, size);
  ctxUser.fillStyle = "black";

  // Draw user's pieces centered and scaled
  currentPieces.forEach(p => {
    const verts = getGlobalVertices(p);
    ctxUser.beginPath();
    verts.forEach((v, index) => {
      const xCentered = (v.x - userBounds.cx) * scaleUser + size / 2;
      const yCentered = (v.y - userBounds.cy) * scaleUser + size / 2;
      if (index === 0) ctxUser.moveTo(xCentered, yCentered);
      else ctxUser.lineTo(xCentered, yCentered);
    });
    ctxUser.closePath();
    ctxUser.fill();
  });

  // Compare canvases pixel by pixel
  const imgTarget = ctxTarget.getImageData(0, 0, size, size).data;
  const imgUser = ctxUser.getImageData(0, 0, size, size).data;

  let intersectionCount = 0;
  let unionCount = 0;

  for (let i = 0; i < imgTarget.length; i += 4) {
    const isTargetBlack = imgTarget[i] < 200; // dark color
    const isUserBlack = imgUser[i] < 200;

    if (isTargetBlack || isUserBlack) {
      unionCount++;
      if (isTargetBlack && isUserBlack) {
        intersectionCount++;
      }
    }
  }

  const iou = unionCount > 0 ? (intersectionCount / unionCount) : 0;
  const percentage = Math.round(iou * 100);
  
  // Update progress bar
  completenessTextEl.innerText = `${percentage}%`;
  completenessFillEl.style.width = `${percentage}%`;

  // Solve criteria: Overlap percentage high and no physical overlaps
  if (percentage >= 95 && overlappingPieceNames.size === 0 && !isSolved) {
    triggerWin();
  }
}

function getBoundingBox(vertices) {
  let minX = vertices[0].x, maxX = vertices[0].x;
  let minY = vertices[0].y, maxY = vertices[0].y;
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return {
    minX, maxX, minY, maxY,
    w: maxX - minX,
    h: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2
  };
}

// ── 8. Drag and Drop Engine ──
function setupPieceDrag(el, pieceName) {
  el.addEventListener("mousedown", e => onDragStart(e, pieceName));
  el.addEventListener("touchstart", e => onDragStart(e, pieceName), { passive: false });
}

function onDragStart(e, pieceName) {
  if (isSolved) return;
  e.preventDefault();

  selectPiece(pieceName);

  const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

  // Convert client coordinates to SVG viewport coords
  const pt = boardSvg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(boardSvg.getScreenCTM().inverse());

  const piece = currentPieces.find(p => p.name === pieceName);
  dragTarget = piece;
  dragOffset.x = svgPt.x - piece.x;
  dragOffset.y = svgPt.y - piece.y;
  hasMovedDuringDrag = false;

  // Capture current state for history before movement occurs
  saveStateToUndo();

  document.addEventListener("mousemove", onDragMove);
  document.addEventListener("mouseup", onDragEnd);
  document.addEventListener("touchmove", onDragMove, { passive: false });
  document.addEventListener("touchend", onDragEnd);
}

function onDragMove(e) {
  if (!dragTarget) return;
  e.preventDefault();

  const clientX = e.type.startsWith("touch") ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.startsWith("touch") ? e.touches[0].clientY : e.clientY;

  const pt = boardSvg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const svgPt = pt.matrixTransform(boardSvg.getScreenCTM().inverse());

  let targetX = svgPt.x - dragOffset.x;
  let targetY = svgPt.y - dragOffset.y;

  // Boundary checks (clamp to SVG 0-600 space)
  targetX = Math.max(10, Math.min(590, targetX));
  targetY = Math.max(10, Math.min(590, targetY));

  // Determine if it actually moved
  if (Math.abs(targetX - dragTarget.x) > 1 || Math.abs(targetY - dragTarget.y) > 1) {
    hasMovedDuringDrag = true;
  }

  dragTarget.x = targetX;
  dragTarget.y = targetY;

  updatePieceTransform(dragTarget.name);
  checkAllOverlaps();
  evaluateMatch();
}

function onDragEnd() {
  if (!dragTarget) return;

  document.removeEventListener("mousemove", onDragMove);
  document.removeEventListener("mouseup", onDragEnd);
  document.removeEventListener("touchmove", onDragMove);
  document.removeEventListener("touchend", onDragEnd);

  // Apply snapping on drop
  const snapGrid = document.getElementById("chk-snap-grid").checked;
  if (snapGrid) {
    dragTarget.x = Math.round(dragTarget.x / 10) * 10;
    dragTarget.y = Math.round(dragTarget.y / 10) * 10;
    updatePieceTransform(dragTarget.name);
  }

  if (hasMovedDuringDrag) {
    movesCount++;
    movesValEl.innerText = movesCount;
    logAction(`${dragTarget.name} moved to (${Math.round(dragTarget.x)}, ${Math.round(dragTarget.y)})`);
    redoStack = []; // Clear redo stack on new action
    updateUndoRedoButtons();
  } else {
    // If it didn't move, discard the undo save we pre-emptively created
    undoStack.pop();
    updateUndoRedoButtons();
  }

  dragTarget = null;
  checkAllOverlaps();
  evaluateMatch();
}

// ── 9. State Modifications & Logic Controls ──

function selectPiece(name) {
  selectedPieceName = name;
  
  // Highlight active pieces in SVG
  currentPieces.forEach(p => {
    const el = document.getElementById(`piece-el-${p.name}`);
    if (el) {
      if (p.name === name) el.classList.add("selected");
      else el.classList.remove("selected");
    }
  });

  // Enable piece rotation/flip controls
  btnRotCw.disabled = false;
  btnRotCcw.disabled = false;
  btnFlip.disabled = false;
}

function rotateSelected(angle) {
  if (!selectedPieceName || isSolved) return;
  
  const piece = currentPieces.find(p => p.name === selectedPieceName);
  if (!piece) return;

  saveStateToUndo();

  const snapAngle = document.getElementById("chk-snap-angle").checked;
  let newRot = piece.rotation + angle;
  if (snapAngle) {
    newRot = Math.round(newRot / 45) * 45;
  }
  // Wrap rotation
  piece.rotation = (newRot % 360 + 360) % 360;

  updatePieceTransform(piece.name);
  
  movesCount++;
  movesValEl.innerText = movesCount;
  logAction(`${piece.name} rotated to ${piece.rotation}°`);
  redoStack = [];
  updateUndoRedoButtons();
  
  checkAllOverlaps();
  evaluateMatch();
}

function flipSelected() {
  if (!selectedPieceName || isSolved) return;
  
  const piece = currentPieces.find(p => p.name === selectedPieceName);
  if (!piece) return;

  saveStateToUndo();

  piece.flipped = !piece.flipped;
  updatePieceTransform(piece.name);

  movesCount++;
  movesValEl.innerText = movesCount;
  logAction(`${piece.name} mirrored (flipped: ${piece.flipped})`);
  redoStack = [];
  updateUndoRedoButtons();

  checkAllOverlaps();
  evaluateMatch();
}

// Updates SVG transform attributes
function updatePieceTransform(name) {
  const piece = currentPieces.find(p => p.name === name);
  const el = document.getElementById(`piece-el-${name}`);
  if (piece && el) {
    // Math logic: translate to centroid, then rotate, then scale horizontally for flip
    el.setAttribute(
      "transform",
      `translate(${piece.x}, ${piece.y}) rotate(${piece.rotation}) scale(${piece.flipped ? -1 : 1}, 1)`
    );
  }
}

// ── 10. Undo / Redo History Tracker ──
function saveStateToUndo() {
  const snap = JSON.stringify(currentPieces);
  undoStack.push(snap);
  // Cap undo stack at 50
  if (undoStack.length > 50) undoStack.shift();
  updateUndoRedoButtons();
}

function undo() {
  if (undoStack.length === 0 || isSolved) return;
  
  const snap = undoStack.pop();
  redoStack.push(JSON.stringify(currentPieces));
  
  currentPieces = JSON.parse(snap);
  
  // Re-apply SVG positions
  currentPieces.forEach(p => {
    updatePieceTransform(p.name);
  });
  
  movesCount++;
  movesValEl.innerText = movesCount;
  logAction(`Undo move`);
  
  updateUndoRedoButtons();
  checkAllOverlaps();
  evaluateMatch();
}

function redo() {
  if (redoStack.length === 0 || isSolved) return;
  
  const snap = redoStack.pop();
  undoStack.push(JSON.stringify(currentPieces));
  
  currentPieces = JSON.parse(snap);
  
  currentPieces.forEach(p => {
    updatePieceTransform(p.name);
  });
  
  movesCount++;
  movesValEl.innerText = movesCount;
  logAction(`Redo move`);
  
  updateUndoRedoButtons();
  checkAllOverlaps();
  evaluateMatch();
}

function updateUndoRedoButtons() {
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

// ── 11. Level Management ──
function loadLevel(level) {
  activeLevel = level;
  isSolved = false;
  
  levelNameEl.innerText = level.name;
  levelDiffEl.innerText = level.difficulty;
  levelDiffEl.className = `difficulty-badge ${level.difficulty.toLowerCase()}`;
  
  // Draw silhouette
  drawSilhouette(level);

  // Scatter pieces
  scatterPieces();
  
  // Reset scoreboard
  timeElapsed = 0;
  movesCount = 0;
  movesValEl.innerText = "0";
  timerValEl.innerText = "00:00";
  
  undoStack = [];
  redoStack = [];
  updateUndoRedoButtons();

  clearActionLog();
  logAction(`Level "${level.name}" loaded`);
  
  overlappingPieceNames.clear();
  
  // Deselect piece
  selectedPieceName = null;
  btnRotCw.disabled = true;
  btnRotCcw.disabled = true;
  btnFlip.disabled = true;
  
  updateStatusMessage();
  evaluateMatch();
}

function drawSilhouette(level) {
  silhouetteLayer.innerHTML = "";
  
  if (isSandboxMode) return; // Hide target silhouette in Sandbox Mode

  level.pieces.forEach(p => {
    const verts = getGlobalVertices(p);
    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    const pointsStr = verts.map(v => `${v.x},${v.y}`).join(" ");
    poly.setAttribute("points", pointsStr);
    silhouetteLayer.appendChild(poly);
  });
}

function scatterPieces() {
  piecesLayer.innerHTML = "";
  currentPieces = [];
  
  // Load default positions
  Object.keys(SCATTER_POSITIONS).forEach(name => {
    const p = SCATTER_POSITIONS[name];
    const pieceObj = {
      name,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      flipped: p.flipped
    };
    currentPieces.push(pieceObj);
    
    // Draw in SVG
    drawPieceSVG(pieceObj);
  });
}

function drawPieceSVG(piece) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", `piece-el-${piece.name}`);
  g.setAttribute("class", "tangram-piece");
  g.setAttribute("filter", "url(#shadow)");
  
  // Render polygon
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  const localPoints = LOCAL_VERTICES[piece.name];
  const pointsStr = localPoints.map(pt => `${pt[0]},${pt[1]}`).join(" ");
  poly.setAttribute("points", pointsStr);
  poly.setAttribute("fill", SVG_PIECE_COLORS[piece.name]);
  poly.setAttribute("stroke", "rgba(0, 0, 0, 0.1)");
  poly.setAttribute("stroke-width", "1");
  
  g.appendChild(poly);
  
  // Setup drag event
  setupPieceDrag(g, piece.name);
  
  piecesLayer.appendChild(g);
  updatePieceTransform(piece.name);
}

function resetLevel() {
  if (!activeLevel) return;
  saveStateToUndo();
  scatterPieces();
  checkAllOverlaps();
  evaluateMatch();
  movesCount++;
  movesValEl.innerText = movesCount;
  logAction("Level reset (pieces scattered)");
}

// ── 12. Level List Rendering ──
function renderLevelLists() {
  // 1. Built-in list
  builtInListEl.innerHTML = "";
  BUILT_IN_LEVELS.forEach(level => {
    const el = createLevelListItem(level);
    builtInListEl.appendChild(el);
  });

  // 2. Custom list
  customListEl.innerHTML = "";
  if (customLevels.length === 0) {
    customListEl.innerHTML = '<div class="empty-list-message">No custom puzzles. Go to Sandbox Mode to design one!</div>';
  } else {
    customLevels.forEach(level => {
      const el = createLevelListItem(level, true);
      customListEl.appendChild(el);
    });
  }
}

function createLevelListItem(level, isCustom = false) {
  const item = document.createElement("div");
  item.className = "level-item";
  if (activeLevel && activeLevel.id === level.id) {
    item.classList.add("active");
  }

  const info = document.createElement("div");
  info.className = "level-item-info";
  
  const name = document.createElement("span");
  name.className = "level-item-name";
  name.innerText = level.name;
  
  const meta = document.createElement("span");
  meta.className = "level-item-meta";
  meta.innerText = isCustom ? "Custom Level" : level.difficulty;
  
  info.appendChild(name);
  info.appendChild(meta);
  
  const badge = document.createElement("span");
  badge.className = `difficulty-badge ${level.difficulty.toLowerCase()}`;
  badge.innerText = level.difficulty;
  
  item.appendChild(info);
  item.appendChild(badge);
  
  item.addEventListener("click", () => {
    // De-activate other lists active states
    document.querySelectorAll(".level-item").forEach(el => el.classList.remove("active"));
    item.classList.add("active");
    loadLevel(level);
  });

  return item;
}

// ── 13. Sandbox / Level Editor Mode ──
function toggleMode() {
  isSandboxMode = !isSandboxMode;
  
  if (isSandboxMode) {
    btnModeToggle.innerText = "Puzzle Mode";
    btnModeToggle.classList.add("active");
    sandboxPanel.classList.remove("hidden");
    
    // Clear silhouette & load default title
    silhouetteLayer.innerHTML = "";
    levelNameEl.innerText = "Sandbox Editor";
    levelDiffEl.innerText = "Designer";
    levelDiffEl.className = "difficulty-badge medium";
    
    showToast("Sandbox Mode Active! Design your shape.");
    logAction("Switched to Sandbox Editor");
    updateExportCoordinates();
  } else {
    btnModeToggle.innerText = "Sandbox Mode";
    btnModeToggle.classList.remove("active");
    sandboxPanel.classList.add("hidden");
    
    // Reload active level
    loadLevel(activeLevel || BUILT_IN_LEVELS[0]);
    showToast("Returned to Puzzle Mode.");
  }
  
  // Re-run SAT overlaps
  checkAllOverlaps();
  evaluateMatch();
}

function updateExportCoordinates() {
  if (!isSandboxMode) return;
  
  // Dump coordinates as formatted JSON level
  const exported = {
    id: txtLevelName.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
    name: txtLevelName.value || "My Custom Puzzle",
    difficulty: selLevelDifficulty.value,
    description: "A custom designed geometric puzzle layout.",
    pieces: currentPieces.map(p => ({
      name: p.name,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      flipped: p.flipped
    }))
  };
  
  txtJsonExport.value = JSON.stringify(exported, null, 2);
}

function saveCustomLevel() {
  const name = txtLevelName.value.trim();
  if (!name) {
    showToast("Please enter a name for your puzzle!");
    return;
  }
  
  const exported = {
    id: "custom-" + Date.now(),
    name: name,
    difficulty: selLevelDifficulty.value,
    description: "Custom level designed in Sandbox Mode.",
    pieces: currentPieces.map(p => ({
      name: p.name,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      flipped: p.flipped
    }))
  };
  
  customLevels.push(exported);
  localStorage.setItem("tangram_custom_levels", JSON.stringify(customLevels));
  
  showToast(`Level "${name}" saved!`);
  logAction(`Level "${name}" designed and saved`);
  
  // Re-render level listing
  renderLevelLists();
  
  // Swapping tab to reveal the level list
  switchTab("custom");
}

function importLevel() {
  try {
    const raw = txtJsonExport.value.trim();
    if (!raw) return;
    const parsed = JSON.parse(raw);
    
    if (!parsed.name || !parsed.pieces || parsed.pieces.length !== 7) {
      throw new Error("Invalid levels data. Must contain a name and 7 pieces.");
    }
    
    // Load coordinates into sandbox
    currentPieces = parsed.pieces.map(p => ({
      name: p.name,
      x: p.x,
      y: p.y,
      rotation: p.rotation || 0,
      flipped: p.flipped || false
    }));
    
    // Re-draw SVG
    piecesLayer.innerHTML = "";
    currentPieces.forEach(p => {
      drawPieceSVG(p);
    });
    
    txtLevelName.value = parsed.name;
    selLevelDifficulty.value = parsed.difficulty || "Intermediate";
    
    showToast("Level coordinates imported successfully!");
    logAction("Imported custom level coordinates");
    checkAllOverlaps();
  } catch (err) {
    showToast("Failed to import. Check format.");
    console.error(err);
  }
}

function loadCustomLevels() {
  const raw = localStorage.getItem("tangram_custom_levels");
  if (raw) {
    try {
      customLevels = JSON.parse(raw);
    } catch(e) {
      customLevels = [];
    }
  }
}

// ── 14. Action Log Display (Chess Move list layout) ──
function logAction(text) {
  const empty = actionLogEl.querySelector(".empty-moves-placeholder");
  if (empty) empty.remove();
  
  const step = actionLogEl.children.length + 1;
  
  // Highlight previous active items
  document.querySelectorAll(".move-pair").forEach(el => el.classList.remove("active-move"));

  const pair = document.createElement("div");
  pair.className = "move-pair active-move";
  
  const num = document.createElement("span");
  num.className = "move-num";
  num.innerText = `${step}.`;
  
  const san = document.createElement("span");
  san.className = "move-san";
  san.innerText = text;
  
  pair.appendChild(num);
  pair.appendChild(san);
  
  actionLogEl.appendChild(pair);
  
  // Scroll to end of list
  actionLogEl.scrollLeft = actionLogEl.scrollWidth;
}

function clearActionLog() {
  actionLogEl.innerHTML = '<span class="empty-moves-placeholder" style="margin-left: 10px;">Your moves will appear here…</span>';
}

// ── 15. Timer & Win Screen ──
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isSolved && !isSandboxMode) {
      timeElapsed++;
      const mins = String(Math.floor(timeElapsed / 60)).padStart(2, "0");
      const secs = String(timeElapsed % 60).padStart(2, "0");
      timerValEl.innerText = `${mins}:${secs}`;
    }
  }, 1000);
}

function updateStatusMessage() {
  if (isSolved) {
    statusTextEl.innerText = "🏆 Puzzle Solved successfully!";
    statusDotEl.className = "status-dot success";
    return;
  }
  
  if (isSandboxMode) {
    statusTextEl.innerText = "Sandbox Mode: Drag pieces. Make shapes. Save them.";
    statusDotEl.className = "status-dot";
    return;
  }

  if (overlappingPieceNames.size > 0) {
    statusTextEl.innerText = "⚠️ Overlap detected! Pieces cannot overlap.";
    statusDotEl.className = "status-dot error";
    return;
  }
  
  statusTextEl.innerText = "Solve status: Good configuration. Keep arranging...";
  statusDotEl.className = "status-dot";
}

function triggerWin() {
  isSolved = true;
  updateStatusMessage();
  
  // Show win dialog
  winLevelName.innerText = activeLevel.name;
  const mins = String(Math.floor(timeElapsed / 60)).padStart(2, "0");
  const secs = String(timeElapsed % 60).padStart(2, "0");
  winTimeEl.innerText = `${mins}:${secs}`;
  winMovesEl.innerText = movesCount;
  
  setTimeout(() => {
    winDialog.showModal();
    logAction(`🏆 Solved puzzle in ${mins}:${secs} with ${movesCount} moves!`);
  }, 400);
}

function loadNextLevel() {
  winDialog.close();
  const currentIndex = BUILT_IN_LEVELS.findIndex(l => l.id === activeLevel.id);
  if (currentIndex !== -1 && currentIndex + 1 < BUILT_IN_LEVELS.length) {
    loadLevel(BUILT_IN_LEVELS[currentIndex + 1]);
  } else {
    // Loop back to level 1
    loadLevel(BUILT_IN_LEVELS[0]);
  }
}

// ── 16. Event Listeners Setup ──
function setupEventListeners() {
  // Rotation / Flip Buttons
  btnRotCw.addEventListener("click", () => rotateSelected(45));
  btnRotCcw.addEventListener("click", () => rotateSelected(-45));
  btnFlip.addEventListener("click", flipSelected);
  
  // Control Panel
  btnUndo.addEventListener("click", undo);
  btnRedo.addEventListener("click", redo);
  btnScatter.addEventListener("click", scatterPieces);
  btnReset.addEventListener("click", resetLevel);
  
  // Toggles
  btnModeToggle.addEventListener("click", toggleMode);
  
  btnDarkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    btnDarkToggle.innerHTML = isDark ? "<span>☀️</span> Light Mode" : "<span>🌙</span> Dark Mode";
  });
  
  // Help Modal
  btnHelp.addEventListener("click", () => helpDialog.showModal());
  btnCloseHelp.addEventListener("click", () => helpDialog.close());
  
  // Win modal Next level
  btnWinNext.addEventListener("click", loadNextLevel);

  // Tabs
  tabBuiltIn.addEventListener("click", () => switchTab("built-in"));
  tabCustom.addEventListener("click", () => switchTab("custom"));
  
  // Sandbox level editor changes
  txtLevelName.addEventListener("input", updateExportCoordinates);
  selLevelDifficulty.addEventListener("change", updateExportCoordinates);
  btnSaveLevel.addEventListener("click", saveCustomLevel);
  btnImportLevel.addEventListener("click", importLevel);

  // Scrolling Log list
  logScrollLeft.addEventListener("click", () => {
    actionLogEl.scrollBy({ left: -100, behavior: 'smooth' });
  });
  logScrollRight.addEventListener("click", () => {
    actionLogEl.scrollBy({ left: 100, behavior: 'smooth' });
  });

  // Mouse wheel rotation over SVG board
  boardSvg.addEventListener("wheel", e => {
    if (!selectedPieceName || isSolved) return;
    e.preventDefault();
    const rotAmount = e.deltaY < 0 ? -45 : 45;
    rotateSelected(rotAmount);
  }, { passive: false });

  // Right-click flip on pieces
  boardSvg.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (!selectedPieceName || isSolved) return;
    
    // Check if right-clicked over the selected piece
    if (e.target.parentNode && e.target.parentNode.id === `piece-el-${selectedPieceName}`) {
      flipSelected();
    }
  });

  // Keyboard Shortcuts (R, E, F, Z, Y)
  document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

    if (e.key.toLowerCase() === "r") {
      rotateSelected(45);
    } else if (e.key.toLowerCase() === "e") {
      rotateSelected(-45);
    } else if (e.key.toLowerCase() === "f") {
      flipSelected();
    } else if (e.key.toLowerCase() === "z" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
    } else if (e.key.toLowerCase() === "y" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      redo();
    }
  });
}

function switchTab(tab) {
  if (tab === "built-in") {
    tabBuiltIn.classList.add("active");
    tabCustom.classList.remove("active");
    builtInListEl.classList.remove("hidden");
    customListEl.classList.add("hidden");
  } else {
    tabBuiltIn.classList.remove("active");
    tabCustom.classList.add("active");
    builtInListEl.classList.add("hidden");
    customListEl.classList.remove("hidden");
  }
}

// Toast indicator utility
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// Run Initializer
window.addEventListener("DOMContentLoaded", init);
