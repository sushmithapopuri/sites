/**
 * chess-engine.js
 * A self-contained chess logic engine:
 * - Board representation (8×8 array)
 * - PGN parser (headers + move list)
 * - Move application (SAN → from/to squares)
 * - Castling, en-passant, promotion, check detection
 */

'use strict';

// ── Piece constants ──────────────────────────────
const PIECES = {
  // White
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  // Black
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

const COLOR = { WHITE: 'w', BLACK: 'b' };

// Starting FEN
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// ── ChessEngine class ────────────────────────────
class ChessEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.board = this._parseFen(STARTING_FEN);
    this.turn = COLOR.WHITE;
    this.castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    this.enPassantTarget = null;  // square index or null
    this.history = [];            // list of applied move objects
    this.capturedByWhite = [];    // pieces white captured
    this.capturedByBlack = [];    // pieces black captured
  }

  // ──────────────────────────────────────────────
  // FEN parsing
  // ──────────────────────────────────────────────
  _parseFen(fen) {
    const board = new Array(64).fill(null);
    const [placement, turn, castling, ep] = fen.split(' ');
    let rank = 7, file = 0;
    for (const ch of placement) {
      if (ch === '/') { rank--; file = 0; }
      else if ('12345678'.includes(ch)) { file += parseInt(ch); }
      else {
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        const type  = ch.toUpperCase();
        board[rank * 8 + file] = color + type;
        file++;
      }
    }
    this.turn = turn || 'w';
    // castling
    this.castlingRights = {
      wK: (castling||'').includes('K'),
      wQ: (castling||'').includes('Q'),
      bK: (castling||'').includes('k'),
      bQ: (castling||'').includes('q'),
    };
    // en-passant
    this.enPassantTarget = ep && ep !== '-' ? this._squareToIndex(ep) : null;
    return board;
  }

  /**
   * Generates a standard FEN string from the current engine state.
   */
  generateFen() {
    let fen = '';
    for (let rank = 7; rank >= 0; rank--) {
      let emptyCount = 0;
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank * 8 + file];
        if (piece) {
          if (emptyCount > 0) { fen += emptyCount; emptyCount = 0; }
          const color = piece[0], type = piece[1];
          fen += color === 'w' ? type.toUpperCase() : type.toLowerCase();
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) fen += emptyCount;
      if (rank > 0) fen += '/';
    }

    fen += ` ${this.turn} `;

    let castling = '';
    if (this.castlingRights.wK) castling += 'K';
    if (this.castlingRights.wQ) castling += 'Q';
    if (this.castlingRights.bK) castling += 'k';
    if (this.castlingRights.bQ) castling += 'q';
    fen += (castling || '-') + ' ';

    fen += (this.enPassantTarget ? this._indexToSquare(this.enPassantTarget) : '-') + ' 0 1';
    return fen;
  }

  // ──────────────────────────────────────────────
  // Square helpers
  // ──────────────────────────────────────────────
  _squareToIndex(sq) {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1]) - 1;
    return rank * 8 + file;
  }
  _indexToSquare(idx) {
    const file = String.fromCharCode(97 + (idx % 8));
    const rank = Math.floor(idx / 8) + 1;
    return file + rank;
  }
  _rank(idx) { return Math.floor(idx / 8); }
  _file(idx) { return idx % 8; }

  // ──────────────────────────────────────────────
  // Piece helpers
  // ──────────────────────────────────────────────
  _color(piece) { return piece ? piece[0] : null; }
  _type(piece)  { return piece ? piece[1] : null; }

  // ──────────────────────────────────────────────
  // PGN Parser
  // ──────────────────────────────────────────────
  parsePGN(pgn) {
    const headers = {};
    const tokens  = [];

    // Extract headers
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let m;
    while ((m = headerRegex.exec(pgn)) !== null) {
      headers[m[1]] = m[2];
    }

    // Remove header section and comments/annotations
    let moveText = pgn
      .replace(/\[.*?\]/gs, '')
      .replace(/\{[^}]*\}/gs, '')   // Remove { } comments
      .replace(/\([^)]*\)/gs, '')   // Remove ( ) variations
      .replace(/\$\d+/g, '')        // Remove NAG annotations
      .replace(/\d+\./g, ' ')       // Remove move numbers (1. 2. 3.)
      .replace(/\.\.\./g, ' ')      // Remove ...
      .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove result
      .trim();

    // Tokenize moves (SAN tokens)
    const moveRegex = /[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O-O[+#]?|O-O[+#]?/g;
    let t;
    while ((t = moveRegex.exec(moveText)) !== null) {
      if (t[0].trim()) tokens.push(t[0].trim());
    }

    return { headers, moves: tokens };
  }

  // ──────────────────────────────────────────────
  // Apply a SAN move string from PGN
  // Returns a move object { from, to, piece, captured, san, ... } or null
  // ──────────────────────────────────────────────
  applySAN(san) {
    const move = this._sanToMove(san);
    if (!move) return null;
    this._applyMove(move);
    return move;
  }

  _sanToMove(san) {
    const color = this.turn;
    const board = this.board;

    // ── Castling ──
    if (san === 'O-O' || san === 'O-O+' || san === 'O-O#') {
      return this._buildCastleMove(color, 'K');
    }
    if (san === 'O-O-O' || san === 'O-O-O+' || san === 'O-O-O#') {
      return this._buildCastleMove(color, 'Q');
    }

    // ── Promotion ──
    let promotion = null;
    const promoMatch = san.match(/=([QRBN])$/);
    if (promoMatch) {
      promotion = promoMatch[1];
      san = san.slice(0, san.indexOf('='));
    }

    // Strip check/mate symbols
    const cleanSan = san.replace(/[+#!?]/g, '');

    // ── Parse standard SAN ──
    // Patterns: Pe4, Nf3, Bxc4, Rxe1, Qd8+, a4, exd5, Nbd2, R1e1 etc.
    const sanRegex = /^([KQRBN]?)([a-h]?)([1-8]?)(x?)([a-h][1-8])$/;
    const match = sanRegex.exec(cleanSan);
    if (!match) return null;

    let [, pieceChar, fileDisamb, rankDisamb, , toSq] = match;
    if (!pieceChar) pieceChar = 'P';

    const toIdx = this._squareToIndex(toSq);
    const pieceCode = color + pieceChar;

    // Find candidate squares
    const candidates = [];
    for (let i = 0; i < 64; i++) {
      if (board[i] !== pieceCode) continue;
      // Disambiguation
      if (fileDisamb && String.fromCharCode(97 + this._file(i)) !== fileDisamb) continue;
      if (rankDisamb && (this._rank(i) + 1).toString() !== rankDisamb) continue;
      // Check if this piece can legally reach toIdx
      if (this._canPieceMoveTo(i, toIdx, color, pieceChar)) {
        candidates.push(i);
      }
    }

    if (candidates.length === 0) return null;
    const fromIdx = candidates[0];

    const captured = board[toIdx];

    // En passant
    let isEnPassant = false;
    let epCapturedIdx = null;
    if (pieceChar === 'P' && toIdx === this.enPassantTarget && !captured) {
      isEnPassant = true;
      epCapturedIdx = color === 'w' ? toIdx - 8 : toIdx + 8;
    }

    return {
      from: fromIdx,
      to: toIdx,
      piece: pieceCode,
      captured: isEnPassant ? board[epCapturedIdx] : captured,
      promotion: promotion ? color + promotion : null,
      isEnPassant,
      epCapturedIdx,
      isCastle: false,
      san: san + (promotion ? `=${promotion}` : ''),
    };
  }

  _buildCastleMove(color, side) {
    const rank = color === 'w' ? 0 : 7;
    const fromIdx = rank * 8 + 4; // e-file king
    const toIdx   = side === 'K' ? rank * 8 + 6 : rank * 8 + 2;
    return {
      from: fromIdx, to: toIdx,
      piece: color + 'K', captured: null,
      isCastle: true, castleSide: side,
      promotion: null, isEnPassant: false,
      san: side === 'K' ? 'O-O' : 'O-O-O',
    };
  }

  _applyMove(move) {
    const board = this.board;
    const color = this.turn;

    // Track captures
    if (move.captured) {
      if (color === 'w') this.capturedByWhite.push(move.captured);
      else               this.capturedByBlack.push(move.captured);
    }

    // Move piece
    board[move.to] = move.promotion || move.piece;
    board[move.from] = null;

    // En passant capture
    if (move.isEnPassant && move.epCapturedIdx != null) {
      board[move.epCapturedIdx] = null;
    }

    // Castling rook
    if (move.isCastle) {
      const rank = color === 'w' ? 0 : 7;
      if (move.castleSide === 'K') {
        board[rank * 8 + 5] = board[rank * 8 + 7];
        board[rank * 8 + 7] = null;
      } else {
        board[rank * 8 + 3] = board[rank * 8 + 0];
        board[rank * 8 + 0] = null;
      }
    }

    // Update en-passant target
    const pieceType = this._type(move.piece);
    if (pieceType === 'P' && Math.abs(move.to - move.from) === 16) {
      this.enPassantTarget = (move.from + move.to) >> 1;
    } else {
      this.enPassantTarget = null;
    }

    // Update castling rights
    if (pieceType === 'K') {
      this.castlingRights[color + 'K'] = false;
      this.castlingRights[color + 'Q'] = false;
    }
    if (pieceType === 'R') {
      const f = this._file(move.from);
      const r = this._rank(move.from);
      if (color === 'w' && r === 0) {
        if (f === 0) this.castlingRights.wQ = false;
        if (f === 7) this.castlingRights.wK = false;
      } else if (color === 'b' && r === 7) {
        if (f === 0) this.castlingRights.bQ = false;
        if (f === 7) this.castlingRights.bK = false;
      }
    }

    // Save history snapshot
    this.history.push({
      move,
      boardSnapshot: [...board],
      capturedByWhite: [...this.capturedByWhite],
      capturedByBlack: [...this.capturedByBlack],
      enPassantTarget: this.enPassantTarget,
      castlingRights: { ...this.castlingRights },
    });

    // Flip turn
    this.turn = color === 'w' ? 'b' : 'w';
  }

  // ──────────────────────────────────────────────
  // Movement validators per piece type
  // ──────────────────────────────────────────────
  _canPieceMoveTo(fromIdx, toIdx, color, type) {
    const board = this.board;
    const tgt   = board[toIdx];

    // Can't capture own piece
    if (tgt && this._color(tgt) === color) return false;

    const fr = this._rank(fromIdx), ff = this._file(fromIdx);
    const tr = this._rank(toIdx),   tf = this._file(toIdx);
    const dr = tr - fr, df = tf - ff;

    switch (type) {
      case 'P': return this._pawnCanMove(fromIdx, toIdx, color, fr, ff, dr, df);
      case 'N': return (Math.abs(dr) === 2 && Math.abs(df) === 1) || (Math.abs(dr) === 1 && Math.abs(df) === 2);
      case 'B': return Math.abs(dr) === Math.abs(df) && Math.abs(dr) > 0 && this._clearDiag(fromIdx, toIdx, dr, df);
      case 'R': return (dr === 0 || df === 0) && (dr !== 0 || df !== 0) && this._clearLine(fromIdx, toIdx, dr, df);
      case 'Q': return (Math.abs(dr) === Math.abs(df) && Math.abs(dr) > 0 && this._clearDiag(fromIdx, toIdx, dr, df))
                    || ((dr === 0 || df === 0) && (dr !== 0 || df !== 0) && this._clearLine(fromIdx, toIdx, dr, df));
      case 'K': return Math.abs(dr) <= 1 && Math.abs(df) <= 1 && (dr !== 0 || df !== 0);
      default: return false;
    }
  }

  _pawnCanMove(fromIdx, toIdx, color, fr, ff, dr, df) {
    const board = this.board;
    const dir   = color === 'w' ? 1 : -1;

    // Single push
    if (df === 0 && dr === dir && !board[toIdx]) return true;
    // Double push
    if (df === 0 && dr === 2 * dir) {
      const startRank = color === 'w' ? 1 : 6;
      if (fr === startRank && !board[toIdx] && !board[fromIdx + dir * 8]) return true;
    }
    // Capture (including en-passant)
    if (Math.abs(df) === 1 && dr === dir) {
      if (board[toIdx] && this._color(board[toIdx]) !== color) return true;
      if (toIdx === this.enPassantTarget) return true;
    }
    return false;
  }

  _clearLine(from, to, dr, df) {
    const stepR = Math.sign(dr), stepF = Math.sign(df);
    let r = this._rank(from) + stepR, f = this._file(from) + stepF;
    while (r !== this._rank(to) || f !== this._file(to)) {
      if (this.board[r * 8 + f]) return false;
      r += stepR; f += stepF;
    }
    return true;
  }

  _clearDiag(from, to, dr, df) { return this._clearLine(from, to, dr, df); }

  // ──────────────────────────────────────────────
  // Check detection (basic king finder)
  // ──────────────────────────────────────────────
  isInCheck(color) {
    const board      = this.board;
    const oppColor   = color === 'w' ? 'b' : 'w';
    const kingPiece  = color + 'K';
    const kingIdx    = board.indexOf(kingPiece);
    if (kingIdx === -1) return false;
    // Check if any opponent piece attacks the king
    for (let i = 0; i < 64; i++) {
      if (!board[i] || this._color(board[i]) !== oppColor) continue;
      if (this._canPieceMoveTo(i, kingIdx, oppColor, this._type(board[i]))) return true;
    }
    return false;
  }
}

// ── Export ──────────────────────────────────────
window.ChessEngine = ChessEngine;
window.PIECES = PIECES;
