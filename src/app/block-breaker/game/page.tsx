"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── 定数 ───
const CANVAS_W = 600;
const CANVAS_H = 700;
const BALL_R = 6;
const BALL_SPEED = 5;
const PADDLE_H = 14;
const PADDLE_INIT_W = 100;
const BLOCK_ROWS = 5;
const BLOCK_COLS = 10;
const BLOCK_W = CANVAS_W / BLOCK_COLS;
const BLOCK_H = 22;
const BLOCK_TOP_OFFSET = 50;
const ITEM_DROP_RATE = 0.3; // 30%
const ITEM_W = 20;
const ITEM_H = 20;
const ITEM_SPEED = 2.5;

// アイテム種別
type ItemKind = "extend" | "multiball" | "shield";
const ITEM_COLORS: Record<ItemKind, string> = {
  extend: "#22d3ee", // シアン — バー拡大
  multiball: "#facc15", // イエロー — ボール倍増
  shield: "#a855f7", // パープル — ブロック不壊
};
const ITEM_LABELS: Record<ItemKind, string> = {
  extend: "L",
  multiball: "B",
  shield: "S",
};

// ─── 型 ───
interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}
interface Block {
  x: number;
  y: number;
  alive: boolean;
  color: string;
  unbreakable: boolean;
}
interface Item {
  x: number;
  y: number;
  kind: ItemKind;
}

// ─── ブロック色 ───
const ROW_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

// ─── ゲーム本体 ───
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<
    "title" | "playing" | "clear" | "gameover"
  >("title");
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // ゲーム内部状態(ref で保持)
  const balls = useRef<Ball[]>([]);
  const blocks = useRef<Block[]>([]);
  const items = useRef<Item[]>([]);
  const paddleW = useRef(PADDLE_INIT_W);
  const paddleX = useRef(CANVAS_W / 2);
  const score = useRef(0);
  const shieldTimer = useRef(0); // 残りフレーム
  const keysRef = useRef<Set<string>>(new Set());

  // ─── 初期化 ───
  const initGame = useCallback(() => {
    balls.current = [
      {
        x: CANVAS_W / 2,
        y: CANVAS_H - 60,
        dx: BALL_SPEED * 0.7,
        dy: -BALL_SPEED * 0.7,
      },
    ];
    blocks.current = [];
    items.current = [];
    paddleW.current = PADDLE_INIT_W;
    paddleX.current = CANVAS_W / 2;
    score.current = 0;
    shieldTimer.current = 0;

    for (let r = 0; r < BLOCK_ROWS; r++) {
      for (let c = 0; c < BLOCK_COLS; c++) {
        blocks.current.push({
          x: c * BLOCK_W,
          y: BLOCK_TOP_OFFSET + r * BLOCK_H,
          alive: true,
          color: ROW_COLORS[r],
          unbreakable: false,
        });
      }
    }
    setGameState("playing");
  }, []);

  // ─── メインループ ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === " " || e.key === "ArrowLeft" || e.key === "ArrowRight")
        e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = () => {
      update();
      draw(ctx);
      animId = requestAnimationFrame(loop);
    };

    const update = () => {
      if (gameStateRef.current !== "playing") return;
      const keys = keysRef.current;

      // パドル移動
      const speed = 7;
      if (keys.has("ArrowLeft"))
        paddleX.current = Math.max(
          paddleW.current / 2,
          paddleX.current - speed,
        );
      if (keys.has("ArrowRight"))
        paddleX.current = Math.min(
          CANVAS_W - paddleW.current / 2,
          paddleX.current + speed,
        );

      // シールドタイマー
      if (shieldTimer.current > 0) shieldTimer.current--;

      // アイテム落下
      for (let i = items.current.length - 1; i >= 0; i--) {
        const it = items.current[i];
        it.y += ITEM_SPEED;
        // パドルとの衝突
        const px = paddleX.current - paddleW.current / 2;
        if (
          it.y + ITEM_H >= CANVAS_H - PADDLE_H &&
          it.y <= CANVAS_H &&
          it.x + ITEM_W >= px &&
          it.x <= px + paddleW.current
        ) {
          applyItem(it.kind);
          items.current.splice(i, 1);
          continue;
        }
        if (it.y > CANVAS_H) {
          items.current.splice(i, 1);
        }
      }

      // ボール移動 & 衝突
      const newBalls: Ball[] = [];
      for (let i = balls.current.length - 1; i >= 0; i--) {
        const b = balls.current[i];
        b.x += b.dx;
        b.y += b.dy;

        // 壁
        if (b.x - BALL_R <= 0) {
          b.x = BALL_R;
          b.dx = Math.abs(b.dx);
        }
        if (b.x + BALL_R >= CANVAS_W) {
          b.x = CANVAS_W - BALL_R;
          b.dx = -Math.abs(b.dx);
        }
        if (b.y - BALL_R <= 0) {
          b.y = BALL_R;
          b.dy = Math.abs(b.dy);
        }

        // 落下
        if (b.y - BALL_R > CANVAS_H) {
          balls.current.splice(i, 1);
          continue;
        }

        // パドル
        const pLeft = paddleX.current - paddleW.current / 2;
        const pRight = paddleX.current + paddleW.current / 2;
        if (
          b.dy > 0 &&
          b.y + BALL_R >= CANVAS_H - PADDLE_H &&
          b.y + BALL_R <= CANVAS_H &&
          b.x >= pLeft &&
          b.x <= pRight
        ) {
          b.dy = -Math.abs(b.dy);
          // 当たった位置で角度を変える
          const hit = (b.x - paddleX.current) / (paddleW.current / 2); // -1〜1
          const angle = hit * (Math.PI / 3); // 最大60度
          const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
          b.dx = spd * Math.sin(angle);
          b.dy = -spd * Math.cos(angle);
        }

        // ブロック
        for (const block of blocks.current) {
          if (!block.alive) continue;
          if (
            b.x + BALL_R > block.x &&
            b.x - BALL_R < block.x + BLOCK_W &&
            b.y + BALL_R > block.y &&
            b.y - BALL_R < block.y + BLOCK_H
          ) {
            // 反射方向
            const overlapLeft = b.x + BALL_R - block.x;
            const overlapRight = block.x + BLOCK_W - (b.x - BALL_R);
            const overlapTop = b.y + BALL_R - block.y;
            const overlapBottom = block.y + BLOCK_H - (b.y - BALL_R);
            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);
            if (minOverlapX < minOverlapY) {
              b.dx = -b.dx;
            } else {
              b.dy = -b.dy;
            }

            if (!block.unbreakable) {
              block.alive = false;
              score.current += 10;
              // アイテムドロップ
              if (Math.random() < ITEM_DROP_RATE) {
                const kinds: ItemKind[] = ["extend", "multiball", "shield"];
                const kind = kinds[Math.floor(Math.random() * kinds.length)];
                items.current.push({
                  x: block.x + BLOCK_W / 2 - ITEM_W / 2,
                  y: block.y + BLOCK_H,
                  kind,
                });
              }
            }
            break; // 1フレームにつき1ブロック
          }
        }
      }

      // multiball で追加されたボール
      if (newBalls.length > 0) balls.current.push(...newBalls);

      // ゲームオーバー判定
      if (balls.current.length === 0) {
        setGameState("gameover");
      }

      // クリア判定（シールド中はスキップ）
      if (shieldTimer.current === 0 && blocks.current.every((b) => !b.alive)) {
        setGameState("clear");
      }
    };

    const applyItem = (kind: ItemKind) => {
      switch (kind) {
        case "extend":
          paddleW.current = Math.min(CANVAS_W * 0.6, paddleW.current * 1.1);
          break;
        case "multiball": {
          const cur = [...balls.current];
          for (const b of cur) {
            const angle = Math.random() * Math.PI * 0.4 - Math.PI * 0.2;
            const spd = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
            balls.current.push({
              x: b.x,
              y: b.y,
              dx: spd * Math.sin(angle),
              dy: -spd * Math.cos(angle) * (b.dy > 0 ? -1 : 1),
            });
          }
          break;
        }
        case "shield":
          // 残っている全ブロックを一定時間壊れなくする
          shieldTimer.current = 300; // 約5秒
          for (const block of blocks.current) {
            if (block.alive) block.unbreakable = true;
          }
          break;
      }
    };

    // シールド解除
    const origUpdate = update;
    const wrappedUpdate = () => {
      origUpdate();
      if (shieldTimer.current === 0) {
        for (const block of blocks.current) block.unbreakable = false;
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      // 背景
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      if (gameStateRef.current === "title") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("BREAKOUT", CANVAS_W / 2, CANVAS_H / 2 - 40);
        ctx.font = "18px sans-serif";
        ctx.fillText("Press SPACE to Start", CANVAS_W / 2, CANVAS_H / 2 + 20);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("← → キーでバーを操作", CANVAS_W / 2, CANVAS_H / 2 + 60);
        return;
      }

      // ブロック
      for (const block of blocks.current) {
        if (!block.alive) continue;
        ctx.fillStyle = block.unbreakable ? "#6b7280" : block.color;
        ctx.fillRect(block.x + 1, block.y + 1, BLOCK_W - 2, BLOCK_H - 2);
        if (block.unbreakable) {
          ctx.strokeStyle = "#9ca3af";
          ctx.lineWidth = 2;
          ctx.strokeRect(block.x + 1, block.y + 1, BLOCK_W - 2, BLOCK_H - 2);
        }
      }

      // アイテム
      for (const it of items.current) {
        ctx.fillStyle = ITEM_COLORS[it.kind];
        ctx.beginPath();
        ctx.roundRect(it.x, it.y, ITEM_W, ITEM_H, 4);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          ITEM_LABELS[it.kind],
          it.x + ITEM_W / 2,
          it.y + ITEM_H - 5,
        );
      }

      // パドル
      const pLeft = paddleX.current - paddleW.current / 2;
      const grad = ctx.createLinearGradient(
        pLeft,
        CANVAS_H - PADDLE_H,
        pLeft,
        CANVAS_H,
      );
      grad.addColorStop(0, "#38bdf8");
      grad.addColorStop(1, "#0284c7");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(pLeft, CANVAS_H - PADDLE_H, paddleW.current, PADDLE_H, 6);
      ctx.fill();

      // ボール
      for (const b of balls.current) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // スコア
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${score.current}`, 10, 24);
      ctx.textAlign = "right";
      ctx.fillText(`Balls: ${balls.current.length}`, CANVAS_W - 10, 24);

      // シールド表示
      if (shieldTimer.current > 0) {
        ctx.fillStyle = "#a855f7";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          `Shield: ${Math.ceil(shieldTimer.current / 60)}s`,
          CANVAS_W / 2,
          24,
        );
      }

      // ゲームオーバー / クリア
      if (gameStateRef.current === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillStyle = "#fff";
        ctx.font = "18px sans-serif";
        ctx.fillText(
          `Score: ${score.current}`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 20,
        );
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Press SPACE to Restart", CANVAS_W / 2, CANVAS_H / 2 + 60);
      }

      if (gameStateRef.current === "clear") {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CLEAR!", CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillStyle = "#fff";
        ctx.font = "18px sans-serif";
        ctx.fillText(
          `Score: ${score.current}`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 20,
        );
        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Press SPACE to Restart", CANVAS_W / 2, CANVAS_H / 2 + 60);
      }
    };

    // Space キーでスタート / リスタート
    const handleSpace = (e: KeyboardEvent) => {
      if (e.key === " ") {
        const st = gameStateRef.current;
        if (st === "title" || st === "gameover" || st === "clear") {
          initGame();
        }
      }
    };
    window.addEventListener("keydown", handleSpace);

    // wrappedUpdate を使ってシールド解除も処理
    const gameLoop = () => {
      wrappedUpdate();
      draw(ctx);
      animId = requestAnimationFrame(gameLoop);
    };
    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", handleSpace);
    };
  }, [initGame]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          BREAKOUT
        </h1>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-lg shadow-2xl border border-zinc-700"
        />
        <div className="flex gap-6 text-sm text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-4 rounded"
              style={{ background: ITEM_COLORS.extend }}
            />
            L: バー拡大
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-4 rounded"
              style={{ background: ITEM_COLORS.multiball }}
            />
            B: ボール倍増
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-4 h-4 rounded"
              style={{ background: ITEM_COLORS.shield }}
            />
            S: ブロック不壊
          </span>
        </div>
      </div>
    </div>
  );
}
