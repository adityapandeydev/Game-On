/**
 * Stackfall simulation: a bit-for-bit twin of backend/internal/games/stackfall/sim.go.
 * The server replays the input log through the Go version, so ANY change here
 * must be made there too (and fixtures regenerated). See sim.test.ts.
 */

export const WIDTH = 10;
export const HEIGHT = 22;
export const HIDDEN = 2;
export const TICKS_PER_SEC = 60;
const LOCK_DELAY = 30;
const MAX_RESETS = 15;

export const In = { Left: 1, Right: 2, RotateCW: 3, RotateCCW: 4, SoftDrop: 5, HardDrop: 6 } as const;

export const KINDS = "IJLOSTZ";
const GRAVITY = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1];
const CLEAR_POINTS = [0, 100, 300, 500, 800];
const KICKS: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
const BOX = [4, 3, 3, 2, 3, 3, 3];

/** SHAPES[kind][rotation] = filled [row, col] offsets in row-major order. */
export const SHAPES: [number, number][][][] = (() => {
  const base: number[][][] = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[1, 1], [1, 1]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  ];
  return base.map((m0) => {
    const rots: [number, number][][] = [];
    let m = m0;
    for (let rot = 0; rot < 4; rot++) {
      const cells: [number, number][] = [];
      m.forEach((row, r) => row.forEach((v, c) => v === 1 && cells.push([r, c])));
      rots.push(cells);
      const n = m.length;
      m = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => m[n - 1 - c][r]));
    }
    return rots;
  });
})();

export interface Piece {
  kind: number;
  rot: number;
  row: number;
  col: number;
}

export class Sim {
  board: Int8Array = new Int8Array(WIDTH * HEIGHT); // row-major, 0 empty, 1-7 kind+1
  piece: Piece = { kind: 0, rot: 0, row: 0, col: 0 };
  queue: number[] = [];
  rng: number;
  tick = 0;
  score = 0;
  lines = 0;
  over = false;
  gravity = 0;
  lock = 0;
  resets = 0;
  /** Rows cleared by the most recent lock (presentation only; not part of the shared state). */
  lastCleared: number[] = [];

  constructor(seed: number) {
    this.rng = seed >>> 0;
    this.refill();
    this.spawn();
  }

  level() {
    return Math.floor(this.lines / 10) + 1;
  }

  private gravityFrames() {
    return GRAVITY[Math.min(this.level(), GRAVITY.length) - 1];
  }

  /** mulberry32, identical to the Go uint32 arithmetic. */
  private next(): number {
    this.rng = (this.rng + 0x6d2b79f5) >>> 0;
    let t = this.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
    t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
    return (t ^ (t >>> 14)) >>> 0;
  }

  private refill() {
    while (this.queue.length < 7) {
      const bag = [0, 1, 2, 3, 4, 5, 6];
      for (let i = 6; i > 0; i--) {
        const j = this.next() % (i + 1);
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.queue.push(...bag);
    }
  }

  private spawn() {
    const k = this.queue.shift()!;
    this.refill();
    this.piece = { kind: k, rot: 0, row: 0, col: Math.floor((WIDTH - BOX[k]) / 2) };
    this.gravity = 0;
    this.lock = 0;
    this.resets = 0;
    if (this.collides(this.piece)) this.over = true;
  }

  cell(r: number, c: number) {
    return this.board[r * WIDTH + c];
  }

  collides(p: Piece): boolean {
    for (const [dr, dc] of SHAPES[p.kind][p.rot]) {
      const r = p.row + dr;
      const c = p.col + dc;
      if (c < 0 || c >= WIDTH || r < 0 || r >= HEIGHT || this.board[r * WIDTH + c] !== 0) return true;
    }
    return false;
  }

  private try(p: Piece): boolean {
    if (this.collides(p)) return false;
    this.piece = p;
    if (this.lock > 0 && this.resets < MAX_RESETS) {
      this.lock = 0;
      this.resets++;
    }
    return true;
  }

  private grounded() {
    return this.collides({ ...this.piece, row: this.piece.row + 1 });
  }

  private rotate(dir: number) {
    const rot = (this.piece.rot + dir + 4) % 4;
    for (const [dc, dr] of KICKS) {
      if (this.try({ ...this.piece, rot, col: this.piece.col + dc, row: this.piece.row + dr })) return;
    }
  }

  /** Where the current piece would land (for the ghost preview). */
  dropRow(): number {
    const p = { ...this.piece };
    while (!this.collides({ ...p, row: p.row + 1 })) p.row++;
    return p.row;
  }

  apply(code: number) {
    if (this.over) return;
    const p = { ...this.piece };
    switch (code) {
      case In.Left:
        p.col--;
        this.try(p);
        break;
      case In.Right:
        p.col++;
        this.try(p);
        break;
      case In.RotateCW:
        this.rotate(1);
        break;
      case In.RotateCCW:
        this.rotate(-1);
        break;
      case In.SoftDrop:
        p.row++;
        if (!this.collides(p)) {
          this.piece = p;
          this.score++;
          this.gravity = 0;
        }
        break;
      case In.HardDrop: {
        let n = 0;
        for (;;) {
          p.row++;
          if (this.collides(p)) break;
          n++;
        }
        this.piece = { ...this.piece, row: this.piece.row + n };
        this.score += 2 * n;
        this.lockPiece();
        break;
      }
    }
  }

  step(events: readonly number[]) {
    for (const e of events) {
      if (this.over) break;
      this.apply(e);
    }
    if (this.over) return;
    this.gravity++;
    if (this.gravity >= this.gravityFrames()) {
      this.gravity = 0;
      const p = { ...this.piece, row: this.piece.row + 1 };
      if (!this.collides(p)) this.piece = p;
    }
    if (this.grounded()) {
      this.lock++;
      if (this.lock >= LOCK_DELAY) this.lockPiece();
    } else {
      this.lock = 0;
    }
    this.tick++;
  }

  private lockPiece() {
    let allHidden = true;
    for (const [dr, dc] of SHAPES[this.piece.kind][this.piece.rot]) {
      const r = this.piece.row + dr;
      this.board[r * WIDTH + this.piece.col + dc] = this.piece.kind + 1;
      if (r >= HIDDEN) allHidden = false;
    }
    if (allHidden) {
      this.over = true;
      return;
    }
    const level = this.level();
    const cleared: number[] = [];
    for (let r = HEIGHT - 1; r >= 0; r--) {
      let full = true;
      for (let c = 0; c < WIDTH; c++) {
        if (this.board[r * WIDTH + c] === 0) {
          full = false;
          break;
        }
      }
      if (!full) continue;
      cleared.push(r - cleared.length); // original row index, for the flash effect
      this.board.copyWithin(WIDTH, 0, r * WIDTH);
      this.board.fill(0, 0, WIDTH);
      r++;
    }
    this.lastCleared = cleared;
    if (cleared.length > 0) {
      this.lines += cleared.length;
      this.score += CLEAR_POINTS[cleared.length] * level;
    }
    this.spawn();
  }
}
