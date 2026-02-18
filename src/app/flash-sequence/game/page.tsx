"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── 定数 ───
const BASE_GRID = 3; // レベル1は3x3
const BASE_SEQ = 3; // レベル1は3ステップ
const FLASH_ON_MS = 500;
const FLASH_OFF_MS = 200;
const FLASH_COLOR = "#facc15"; // 黄色
const LAMP_COLOR = "#334155"; // 消灯
const LAMP_ACTIVE_COLOR = "#475569"; // ホバー
const CORRECT_FLASH = "#22c55e"; // 正解
const WRONG_FLASH = "#ef4444"; // 不正解
const CORRECT_ANSWER_FLASH = "#3b82f6"; // 正解位置表示（青）
const MAX_MISTAKES = 3;

type Phase = "idle" | "showing" | "input" | "correct" | "wrong" | "gameover";

function getGridSize(level: number) {
  // レベル1-3: 3x3, 4-6: 4x4, 7-9: 5x5, 10+: 6x6
  return Math.min(6, BASE_GRID + Math.floor((level - 1) / 3));
}

function getSeqLength(level: number) {
  // レベルが上がるごとにシーケンスが長くなる
  return BASE_SEQ + level - 1;
}

export default function FlashSequenceGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [sequence, setSequence] = useState<number[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [flashingLamp, setFlashingLamp] = useState<number | null>(null);
  const [feedbackLamp, setFeedbackLamp] = useState<{
    idx: number;
    color: string;
  } | null>(null);
  const [bestLevel, setBestLevel] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [correctLamp, setCorrectLamp] = useState<number | null>(null);
  const timeoutIds = useRef<ReturnType<typeof setTimeout>[]>([]);

  const gridSize = getGridSize(level);
  const totalLamps = gridSize * gridSize;
  const seqLength = getSeqLength(level);

  // タイムアウトをクリア
  const clearAllTimeouts = useCallback(() => {
    for (const id of timeoutIds.current) clearTimeout(id);
    timeoutIds.current = [];
  }, []);

  // シーケンス生成
  const generateSequence = useCallback((len: number, total: number) => {
    const seq: number[] = [];
    for (let i = 0; i < len; i++) {
      seq.push(Math.floor(Math.random() * total));
    }
    return seq;
  }, []);

  // シーケンスを表示
  const showSequence = useCallback((seq: number[]) => {
    setPhase("showing");
    setFlashingLamp(null);

    let delay = 400; // 初期待ち
    for (let i = 0; i < seq.length; i++) {
      const onId = setTimeout(() => {
        setFlashingLamp(seq[i]);
      }, delay);
      timeoutIds.current.push(onId);
      delay += FLASH_ON_MS;

      const offId = setTimeout(() => {
        setFlashingLamp(null);
      }, delay);
      timeoutIds.current.push(offId);
      delay += FLASH_OFF_MS;
    }

    const doneId = setTimeout(() => {
      setPhase("input");
      setInputIndex(0);
    }, delay);
    timeoutIds.current.push(doneId);
  }, []);

  // ゲーム開始 / レベル開始
  const startLevel = useCallback(
    (lv: number, existingSeq?: number[]) => {
      clearAllTimeouts();
      setLevel(lv);
      setInputIndex(0);
      setFlashingLamp(null);
      setFeedbackLamp(null);
      setCorrectLamp(null);

      const grid = getGridSize(lv);
      const total = grid * grid;
      const len = getSeqLength(lv);
      const seq = existingSeq ?? generateSequence(len, total);
      setSequence(seq);

      // 少し遅らせてからシーケンス表示
      const id = setTimeout(() => showSequence(seq), 600);
      timeoutIds.current.push(id);
    },
    [clearAllTimeouts, generateSequence, showSequence],
  );

  const startGame = useCallback(() => {
    setBestLevel(0);
    setMistakes(0);
    startLevel(1);
  }, [startLevel]);

  // ランプタップ
  const handleLampClick = useCallback(
    (idx: number) => {
      if (phase !== "input") return;

      if (idx === sequence[inputIndex]) {
        // 正解
        setFeedbackLamp({ idx, color: CORRECT_FLASH });
        const id1 = setTimeout(() => setFeedbackLamp(null), 200);
        timeoutIds.current.push(id1);

        const nextInput = inputIndex + 1;

        if (nextInput >= sequence.length) {
          // レベルクリア
          setPhase("correct");
          const newBest = Math.max(bestLevel, level);
          setBestLevel(newBest);

          const id2 = setTimeout(() => {
            startLevel(level + 1);
          }, 1000);
          timeoutIds.current.push(id2);
        } else {
          setInputIndex(nextInput);
        }
      } else {
        // 不正解 — 正解位置もフィードバック
        setFeedbackLamp({ idx, color: WRONG_FLASH });
        setCorrectLamp(sequence[inputIndex]);
        setPhase("wrong");

        const newMistakes = mistakes + 1;
        setMistakes(newMistakes);

        if (newMistakes >= MAX_MISTAKES) {
          // ライフ切れ → ゲームオーバー
          const newBest = Math.max(bestLevel, level - 1);
          setBestLevel(newBest);
          const id = setTimeout(() => {
            setFeedbackLamp(null);
            setCorrectLamp(null);
            setPhase("gameover");
          }, 1500);
          timeoutIds.current.push(id);
        } else {
          // ライフ残りあり → 同じレベルを再挑戦
          const id = setTimeout(() => {
            setFeedbackLamp(null);
            setCorrectLamp(null);
            startLevel(level, sequence);
          }, 1500);
          timeoutIds.current.push(id);
        }
      }
    },
    [phase, sequence, inputIndex, level, bestLevel, mistakes, startLevel],
  );

  // クリーンアップ
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // ランプの色を決定
  const getLampColor = (idx: number) => {
    if (feedbackLamp?.idx === idx) return feedbackLamp.color;
    if (correctLamp === idx) return CORRECT_ANSWER_FLASH;
    if (flashingLamp === idx) return FLASH_COLOR;
    return LAMP_COLOR;
  };

  const getLampShadow = (idx: number) => {
    if (flashingLamp === idx)
      return "0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(250, 204, 21, 0.4)";
    if (feedbackLamp?.idx === idx && feedbackLamp.color === CORRECT_FLASH)
      return "0 0 20px rgba(34, 197, 94, 0.8)";
    if (feedbackLamp?.idx === idx && feedbackLamp.color === WRONG_FLASH)
      return "0 0 20px rgba(239, 68, 68, 0.8)";
    if (correctLamp === idx) return "0 0 20px rgba(59, 130, 246, 0.8)";
    return "none";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0f172a] select-none gap-4 p-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-8 text-white">
        <div className="text-center">
          <div className="text-sm text-slate-400">レベル</div>
          <div className="text-3xl font-bold">{level}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">シーケンス</div>
          <div className="text-3xl font-bold">
            {phase === "input" ? `${inputIndex} / ${seqLength}` : seqLength}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">グリッド</div>
          <div className="text-3xl font-bold">
            {gridSize}×{gridSize}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-slate-400">ライフ</div>
          <div className="text-2xl">
            {Array.from({ length: MAX_MISTAKES }, (_, i) => (
              <span
                key={`life-${i === 0 ? "first" : i === 1 ? "second" : "third"}`}
                className={i < MAX_MISTAKES - mistakes ? "" : "opacity-25"}
              >
                ❤️
              </span>
            ))}
          </div>
        </div>
        {bestLevel > 0 && (
          <div className="text-center">
            <div className="text-sm text-slate-400">ベスト</div>
            <div className="text-3xl font-bold text-yellow-400">
              Lv.{bestLevel}
            </div>
          </div>
        )}
      </div>

      {/* ステータス表示 */}
      <div className="h-8 flex items-center">
        {phase === "idle" && (
          <span className="text-slate-400 text-lg">
            STARTボタンを押してゲーム開始
          </span>
        )}
        {phase === "showing" && (
          <span className="text-yellow-400 text-lg font-bold animate-pulse">
            👀 よく見て覚えてください...
          </span>
        )}
        {phase === "input" && (
          <span className="text-green-400 text-lg font-bold">
            👆 同じ順番でタップしてください
          </span>
        )}
        {phase === "correct" && (
          <span className="text-green-400 text-lg font-bold">
            🎉 正解！次のレベルへ...
          </span>
        )}
        {phase === "wrong" && mistakes < MAX_MISTAKES && (
          <span className="text-red-400 text-lg font-bold">
            ❌ 不正解！正解は青のランプです（残り {MAX_MISTAKES - mistakes} 回）
          </span>
        )}
        {phase === "wrong" && mistakes >= MAX_MISTAKES && (
          <span className="text-red-400 text-lg font-bold">
            ❌ 不正解！ライフがなくなりました...
          </span>
        )}
        {phase === "gameover" && (
          <span className="text-red-400 text-lg font-bold">
            ゲームオーバー — レベル {level} で失敗
          </span>
        )}
      </div>

      {/* ランプグリッド */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: `min(90vw, ${gridSize * 80 + (gridSize - 1) * 8}px)`,
          maxWidth: 500,
        }}
      >
        {Array.from({ length: totalLamps }, (_, idx) => {
          const row = Math.floor(idx / gridSize);
          const col = idx % gridSize;
          return (
            <button
              type="button"
              key={`lamp-${gridSize}-r${row}c${col}`}
              onClick={() => handleLampClick(idx)}
              disabled={phase !== "input"}
              className="aspect-square rounded-lg transition-all duration-150 border-2 border-slate-600"
              style={{
                backgroundColor: getLampColor(idx),
                boxShadow: getLampShadow(idx),
                cursor: phase === "input" ? "pointer" : "default",
                transform: flashingLamp === idx ? "scale(1.05)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (phase === "input") {
                  e.currentTarget.style.backgroundColor = LAMP_ACTIVE_COLOR;
                }
              }}
              onMouseLeave={(e) => {
                if (phase === "input") {
                  e.currentTarget.style.backgroundColor = getLampColor(idx);
                }
              }}
            />
          );
        })}
      </div>

      {/* ボタン */}
      <div className="flex gap-4 mt-2">
        {(phase === "idle" || phase === "gameover") && (
          <button
            type="button"
            onClick={startGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-colors cursor-pointer shadow-lg"
          >
            {phase === "idle" ? "🎮 START" : "🔄 RESTART"}
          </button>
        )}
      </div>

      {/* 進捗バー */}
      {phase === "input" && (
        <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300 rounded-full"
            style={{ width: `${(inputIndex / seqLength) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
