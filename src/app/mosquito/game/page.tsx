"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── 定数 ───
const MOSQUITO_SIZE = 40;
const CROSSHAIR_SIZE = 30;
const MOSQUITO_SPEED_MIN = 1;
const MOSQUITO_SPEED_MAX = 3;
const MOSQUITO_SPAWN_INTERVAL = 1500; // ms
const MAX_MOSQUITOES = 8;
const GOAL_KILLS = 20;
const HIT_RADIUS = 45;
const GAME_TIME_LIMIT = 60; // 秒

// ─── 型 ───
interface Mosquito {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  wingPhase: number;
  alive: boolean;
  deathTimer: number;
}

// ─── ゲーム本体 ───
export default function MosquitoGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [gameState, setGameState] = useState<
    "waiting" | "playing" | "clear" | "gameover"
  >("waiting");
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 動的キャンバスサイズ
  const canvasW = useRef(800);
  const canvasH = useRef(600);

  // ゲーム内部状態
  const mosquitoes = useRef<Mosquito[]>([]);
  const crosshairX = useRef(canvasW.current / 2);
  const crosshairY = useRef(canvasH.current / 2);
  const kills = useRef(0);
  const killsDisplay = useRef(0);
  const nextMosquitoId = useRef(0);
  const lastSpawnTime = useRef(0);
  const isClenched = useRef(false);
  const wasClenched = useRef(false);
  const startTime = useRef(0);
  const remainingTime = useRef(GAME_TIME_LIMIT);
  const handDetected = useRef(false);
  const splatEffects = useRef<{ x: number; y: number; timer: number }[]>([]);

  // MediaPipe
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe types not available
  const handsRef = useRef<any>(null);
  // biome-ignore lint/suspicious/noExplicitAny: MediaPipe types not available
  const cameraRef = useRef<any>(null);

  const startCamera = useCallback(async () => {
    const { Hands } = await import("@mediapipe/hands");
    const { Camera } = await import("@mediapipe/camera_utils");

    const video = videoRef.current;
    if (!video) return;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5,
    });

    // biome-ignore lint/suspicious/noExplicitAny: MediaPipe result type
    hands.onResults((results: any) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        handDetected.current = true;

        // 手のひら中心（中指の付け根）で操作。x は左右反転
        const handX = (1 - landmarks[9].x) * canvasW.current;
        const handY = landmarks[9].y * canvasH.current;

        // スムーズに追従
        crosshairX.current += (handX - crosshairX.current) * 0.4;
        crosshairY.current += (handY - crosshairY.current) * 0.4;

        // グー判定: 指先が付け根より手首に近いかどうか
        const palmBase = landmarks[0];
        const fingerTips = [8, 12, 16, 20];
        const fingerBases = [5, 9, 13, 17];

        let closedFingers = 0;
        for (let i = 0; i < fingerTips.length; i++) {
          const tip = landmarks[fingerTips[i]];
          const base = landmarks[fingerBases[i]];
          const tipDist = Math.sqrt(
            (tip.x - palmBase.x) ** 2 + (tip.y - palmBase.y) ** 2,
          );
          const baseDist = Math.sqrt(
            (base.x - palmBase.x) ** 2 + (base.y - palmBase.y) ** 2,
          );
          if (tipDist < baseDist * 1.1) {
            closedFingers++;
          }
        }

        isClenched.current = closedFingers >= 3;
      } else {
        handDetected.current = false;
      }
    });

    handsRef.current = hands;

    const camera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    await camera.start();
  }, []);

  // ─── 蚊を生成 ───
  const spawnMosquito = useCallback(() => {
    const W = canvasW.current;
    const H = canvasH.current;
    const edge = Math.floor(Math.random() * 4);
    let x: number;
    let y: number;
    const speed =
      MOSQUITO_SPEED_MIN +
      Math.random() * (MOSQUITO_SPEED_MAX - MOSQUITO_SPEED_MIN);
    let angle: number;

    switch (edge) {
      case 0: // 上
        x = Math.random() * W;
        y = -MOSQUITO_SIZE;
        angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
        break;
      case 1: // 右
        x = W + MOSQUITO_SIZE;
        y = Math.random() * H;
        angle = (3 * Math.PI) / 4 + (Math.random() * Math.PI) / 2;
        break;
      case 2: // 下
        x = Math.random() * W;
        y = H + MOSQUITO_SIZE;
        angle = -(Math.PI / 4) - (Math.random() * Math.PI) / 2;
        break;
      default: // 左
        x = -MOSQUITO_SIZE;
        y = Math.random() * H;
        angle = -(Math.PI / 4) + (Math.random() * Math.PI) / 2;
        break;
    }

    mosquitoes.current.push({
      id: nextMosquitoId.current++,
      x,
      y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: MOSQUITO_SIZE,
      wingPhase: Math.random() * Math.PI * 2,
      alive: true,
      deathTimer: 0,
    });
  }, []);

  // ─── ゲーム初期化 ───
  const initGame = useCallback(() => {
    mosquitoes.current = [];
    kills.current = 0;
    killsDisplay.current = 0;
    nextMosquitoId.current = 0;
    lastSpawnTime.current = Date.now();
    startTime.current = Date.now();
    remainingTime.current = GAME_TIME_LIMIT;
    splatEffects.current = [];
    crosshairX.current = canvasW.current / 2;
    crosshairY.current = canvasH.current / 2;
    setGameState("playing");
  }, []);

  // ─── カメラ起動＆ゲーム開始 ───
  const handleStart = useCallback(async () => {
    await startCamera();
    initGame();
  }, [startCamera, initGame]);

  // ─── キャンバスリサイズ ───
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      // ボタン領域分を差し引き
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      canvasW.current = w;
      canvasH.current = h;
      canvas.width = w;
      canvas.height = h;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ─── メインループ ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;

    const update = () => {
      if (gameStateRef.current !== "playing") return;

      const now = Date.now();

      // 残り時間
      const elapsed = (now - startTime.current) / 1000;
      remainingTime.current = Math.max(0, GAME_TIME_LIMIT - elapsed);
      if (remainingTime.current <= 0) {
        setGameState("gameover");
        return;
      }

      // 蚊を定期的に生成
      if (
        now - lastSpawnTime.current > MOSQUITO_SPAWN_INTERVAL &&
        mosquitoes.current.filter((m) => m.alive).length < MAX_MOSQUITOES
      ) {
        spawnMosquito();
        lastSpawnTime.current = now;
      }

      // グー → パー の瞬間で撃退判定
      const currentClenched = isClenched.current;
      if (wasClenched.current && !currentClenched) {
        for (const m of mosquitoes.current) {
          if (!m.alive) continue;
          const dist = Math.sqrt(
            (m.x - crosshairX.current) ** 2 + (m.y - crosshairY.current) ** 2,
          );
          if (dist < HIT_RADIUS) {
            m.alive = false;
            m.deathTimer = 30;
            kills.current++;
            killsDisplay.current = kills.current;
            splatEffects.current.push({
              x: m.x,
              y: m.y,
              timer: 20,
            });

            if (kills.current >= GOAL_KILLS) {
              setGameState("clear");
              return;
            }
          }
        }
      }
      wasClenched.current = currentClenched;

      // 蚊の移動
      for (let i = mosquitoes.current.length - 1; i >= 0; i--) {
        const m = mosquitoes.current[i];

        if (!m.alive) {
          m.deathTimer--;
          if (m.deathTimer <= 0) {
            mosquitoes.current.splice(i, 1);
          }
          continue;
        }

        // ランダムな方向転換
        if (Math.random() < 0.02) {
          const newAngle = Math.random() * Math.PI * 2;
          const speed = Math.sqrt(m.dx ** 2 + m.dy ** 2);
          m.dx = Math.cos(newAngle) * speed;
          m.dy = Math.sin(newAngle) * speed;
        }

        m.x += m.dx;
        m.y += m.dy;
        m.wingPhase += 0.3;

        // 画面外に出すぎたら中央方向へ戻す
        const W = canvasW.current;
        const H = canvasH.current;
        if (
          m.x < -MOSQUITO_SIZE * 2 ||
          m.x > W + MOSQUITO_SIZE * 2 ||
          m.y < -MOSQUITO_SIZE * 2 ||
          m.y > H + MOSQUITO_SIZE * 2
        ) {
          const a = Math.atan2(H / 2 - m.y, W / 2 - m.x);
          const speed = Math.sqrt(m.dx ** 2 + m.dy ** 2);
          m.dx = Math.cos(a) * speed;
          m.dy = Math.sin(a) * speed;
        }
      }

      // スプラットエフェクト更新
      for (let i = splatEffects.current.length - 1; i >= 0; i--) {
        splatEffects.current[i].timer--;
        if (splatEffects.current[i].timer <= 0) {
          splatEffects.current.splice(i, 1);
        }
      }
    };

    const drawMosquito = (ctx: CanvasRenderingContext2D, m: Mosquito) => {
      ctx.save();
      ctx.translate(m.x, m.y);

      if (!m.alive) {
        ctx.globalAlpha = m.deathTimer / 30;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(0, 0, m.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      const dir = Math.atan2(m.dy, m.dx);
      ctx.rotate(dir);

      // 体
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.ellipse(0, 0, m.size / 2, m.size / 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 頭
      ctx.fillStyle = "#2a2a2a";
      ctx.beginPath();
      ctx.arc(m.size / 2.5, 0, m.size / 6, 0, Math.PI * 2);
      ctx.fill();

      // 口（針）
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(m.size / 2.5 + m.size / 6, 0);
      ctx.lineTo(m.size / 2.5 + m.size / 3, 0);
      ctx.stroke();

      // 羽
      const wingFlap = Math.sin(m.wingPhase) * 0.4;
      ctx.fillStyle = "rgba(200, 200, 255, 0.4)";
      ctx.save();
      ctx.translate(-m.size / 8, 0);

      ctx.save();
      ctx.rotate(-Math.PI / 4 + wingFlap);
      ctx.beginPath();
      ctx.ellipse(0, -m.size / 4, m.size / 3, m.size / 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(Math.PI / 4 - wingFlap);
      ctx.beginPath();
      ctx.ellipse(0, m.size / 4, m.size / 3, m.size / 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // 脚
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const lx = -m.size / 6 + i * (m.size / 6);
        ctx.beginPath();
        ctx.moveTo(lx, -m.size / 6);
        ctx.lineTo(lx - 3, -m.size / 3);
        ctx.lineTo(lx - 6, -m.size / 2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, m.size / 6);
        ctx.lineTo(lx - 3, m.size / 3);
        ctx.lineTo(lx - 6, m.size / 2.5);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawCrosshair = (ctx: CanvasRenderingContext2D) => {
      const cx = crosshairX.current;
      const cy = crosshairY.current;
      const s = CROSSHAIR_SIZE;

      const color = isClenched.current
        ? "rgba(255, 50, 50, 0.9)"
        : "rgba(50, 255, 50, 0.9)";

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      // 外円
      ctx.beginPath();
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      ctx.stroke();

      // 十字
      const gap = 8;
      ctx.beginPath();
      ctx.moveTo(cx - s, cy);
      ctx.lineTo(cx - gap, cy);
      ctx.moveTo(cx + gap, cy);
      ctx.lineTo(cx + s, cy);
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx, cy - gap);
      ctx.moveTo(cx, cy + gap);
      ctx.lineTo(cx, cy + s);
      ctx.stroke();

      // 中心
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSplats = (ctx: CanvasRenderingContext2D) => {
      for (const s of splatEffects.current) {
        ctx.save();
        ctx.globalAlpha = s.timer / 20;
        ctx.fillStyle = "#cc0000";
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          const r = 10 + Math.random() * 15;
          ctx.beginPath();
          ctx.arc(
            s.x + Math.cos(a) * r,
            s.y + Math.sin(a) * r,
            3 + Math.random() * 4,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      const W = canvasW.current;
      const H = canvasH.current;
      // 背景
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, W, H);

      // 星空風の点
      ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 137) % W;
        const sy = (i * 97) % H;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (gameStateRef.current === "waiting") {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🦟 蚊を撃退せよ！", W / 2, H / 2 - 60);
        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("カメラで手の動きを検出します", W / 2, H / 2);
        ctx.fillText("手を握って開く動作で蚊を退治！", W / 2, H / 2 + 30);
        ctx.fillText(`${GOAL_KILLS}匹退治でクリア！`, W / 2, H / 2 + 60);
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#22c55e";
        ctx.fillText("▶ 「START」ボタンを押してゲーム開始", W / 2, H / 2 + 120);
        return;
      }

      // 蚊
      for (const m of mosquitoes.current) {
        drawMosquito(ctx, m);
      }

      // スプラット
      drawSplats(ctx);

      // クロスヘア
      drawCrosshair(ctx);

      // HUD
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, W, 40);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(
        `🦟 撃退数: ${killsDisplay.current} / ${GOAL_KILLS}`,
        15,
        27,
      );

      ctx.textAlign = "center";
      const timeColor = remainingTime.current <= 10 ? "#ef4444" : "#ffffff";
      ctx.fillStyle = timeColor;
      ctx.fillText(`⏱ ${Math.ceil(remainingTime.current)}秒`, W / 2, 27);

      ctx.textAlign = "right";
      ctx.fillStyle = handDetected.current ? "#22c55e" : "#ef4444";
      ctx.fillText(
        handDetected.current ? "✋ 手を検出中" : "❌ 手が見つかりません",
        W - 15,
        27,
      );

      // プログレスバー
      const progress = kills.current / GOAL_KILLS;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 40, W, 4);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(0, 40, W * progress, 4);

      // ゲームクリア
      if (gameStateRef.current === "clear") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#22c55e";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎉 GAME CLEAR!", W / 2, H / 2 - 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        const clearTime = GAME_TIME_LIMIT - remainingTime.current;
        ctx.fillText(
          `${GOAL_KILLS}匹の蚊を ${clearTime.toFixed(1)}秒 で撃退！`,
          W / 2,
          H / 2 + 20,
        );

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("「RESTART」でもう一度プレイ", W / 2, H / 2 + 70);
      }

      // ゲームオーバー
      if (gameStateRef.current === "gameover") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("💀 TIME UP!", W / 2, H / 2 - 40);

        ctx.fillStyle = "#ffffff";
        ctx.font = "24px sans-serif";
        ctx.fillText(
          `撃退数: ${killsDisplay.current} / ${GOAL_KILLS}`,
          W / 2,
          H / 2 + 20,
        );

        ctx.font = "18px sans-serif";
        ctx.fillStyle = "#aaa";
        ctx.fillText("「RESTART」でもう一度プレイ", W / 2, H / 2 + 70);
      }
    };

    const loop = () => {
      update();
      draw(ctx);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [spawnMosquito]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full bg-[#0d1117]">
      <video
        ref={videoRef}
        style={{ display: "none" }}
        playsInline
        autoPlay
        muted
      />

      <div ref={containerRef} className="h-full w-full">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* オーバーレイボタン */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
        {gameState === "waiting" && (
          <button
            type="button"
            onClick={handleStart}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-colors cursor-pointer shadow-lg"
          >
            🎮 START
          </button>
        )}
        {(gameState === "clear" || gameState === "gameover") && (
          <button
            type="button"
            onClick={initGame}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-lg transition-colors cursor-pointer shadow-lg"
          >
            🔄 RESTART
          </button>
        )}
      </div>

      {gameState !== "waiting" && (
        <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-500 text-xs">
          手を握って開くと蚊を退治できます
        </p>
      )}
    </div>
  );
}
