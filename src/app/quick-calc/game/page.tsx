"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── 型定義 ───
type Operator = "+" | "-" | "×" | "÷";
type Phase = "settings" | "playing" | "result";

interface GameRecord {
  date: string;
  timestamp: number;
  correct: number;
  wrong: number;
  operators: Operator[];
  maxDigits: number;
}

interface Problem {
  a: number;
  b: number;
  operator: Operator;
  answer: number;
}

// ─── 定数 ───
const STORAGE_KEY = "quick-calc-history";
const TIME_LIMIT = 60;
const ALL_OPERATORS: Operator[] = ["+", "-", "×", "÷"];

// ─── ユーティリティ ───
function loadHistory(): GameRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecord(record: GameRecord) {
  const history = loadHistory();
  history.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function generateProblem(operators: Operator[], maxDigits: number): Problem {
  const operator = operators[Math.floor(Math.random() * operators.length)];
  const max = 10 ** maxDigits - 1;

  let a: number;
  let b: number;
  let answer: number;

  switch (operator) {
    case "+": {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * max) + 1;
      answer = a + b;
      break;
    }
    case "-": {
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    }
    case "×": {
      // 乗算は桁数を少し制限して計算しやすくする
      const mulMax = Math.min(
        max,
        maxDigits === 1 ? 9 : maxDigits === 2 ? 20 : 30,
      );
      a = Math.floor(Math.random() * mulMax) + 1;
      b = Math.floor(Math.random() * (maxDigits === 1 ? 9 : 12)) + 1;
      answer = a * b;
      break;
    }
    case "÷": {
      // 割り切れる問題のみ生成
      b =
        Math.floor(Math.random() * (maxDigits === 1 ? 8 : Math.min(max, 20))) +
        2;
      const quotient =
        Math.floor(
          Math.random() * (maxDigits === 1 ? 9 : Math.min(max / b, 30)),
        ) + 1;
      a = b * quotient;
      answer = quotient;
      break;
    }
  }

  return { a, b, operator, answer };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ─── コンポーネント ───

function SettingsPanel({
  operators,
  setOperators,
  maxDigits,
  setMaxDigits,
  onStart,
}: {
  operators: Operator[];
  setOperators: (ops: Operator[]) => void;
  maxDigits: number;
  setMaxDigits: (d: number) => void;
  onStart: () => void;
}) {
  const toggleOperator = (op: Operator) => {
    if (operators.includes(op)) {
      if (operators.length > 1) {
        setOperators(operators.filter((o) => o !== op));
      }
    } else {
      setOperators([...operators, op]);
    }
  };

  const operatorLabels: Record<Operator, string> = {
    "+": "加算 (+)",
    "-": "減算 (-)",
    "×": "乗算 (×)",
    "÷": "除算 (÷)",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold border-none">ゲーム設定</h2>

      <div className="w-full max-w-md">
        <h3 className="font-semibold mb-3 text-lg">出題する演算</h3>
        <div className="grid grid-cols-2 gap-2">
          {ALL_OPERATORS.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => toggleOperator(op)}
              className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                operators.includes(op)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
              }`}
            >
              {operatorLabels[op]}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        <h3 className="font-semibold mb-3 text-lg">最大桁数</h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setMaxDigits(d)}
              className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                maxDigits === d
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400"
              }`}
            >
              {d}桁
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="bg-green-600 text-white font-bold py-4 px-10 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg hover:cursor-pointer transition-all active:scale-95 text-xl"
      >
        ゲーム開始
      </button>
    </div>
  );
}

function GamePlay({
  operators,
  maxDigits,
  onFinish,
}: {
  operators: Operator[];
  maxDigits: number;
  onFinish: (correct: number, wrong: number) => void;
}) {
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [problem, setProblem] = useState<Problem>(() =>
    generateProblem(operators, maxDigits),
  );
  const [input, setInput] = useState("");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishedRef = useRef(false);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);

  // タイマー
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!finishedRef.current) {
            finishedRef.current = true;
            // 小さなdelayで終了コールバック
            setTimeout(
              () => onFinish(correctRef.current, wrongRef.current),
              100,
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onFinish]);

  // 入力フォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (finishedRef.current) return;

      const userAnswer = Number.parseInt(input, 10);
      if (Number.isNaN(userAnswer)) return;

      if (userAnswer === problem.answer) {
        const newCorrect = correct + 1;
        setCorrect(newCorrect);
        correctRef.current = newCorrect;
        setFeedback("correct");
      } else {
        const newWrong = wrong + 1;
        setWrong(newWrong);
        wrongRef.current = newWrong;
        setFeedback("wrong");
      }

      setTimeout(() => {
        setFeedback(null);
        setInput("");
        setProblem(generateProblem(operators, maxDigits));
      }, 300);
    },
    [input, problem, correct, wrong, operators, maxDigits],
  );

  const timerColor =
    timeLeft <= 10
      ? "text-red-500"
      : timeLeft <= 20
        ? "text-yellow-500"
        : "text-zinc-700";

  const timerBarWidth = (timeLeft / TIME_LIMIT) * 100;
  const timerBarColor =
    timeLeft <= 10
      ? "bg-red-500"
      : timeLeft <= 20
        ? "bg-yellow-500"
        : "bg-green-500";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* タイマー */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-4xl font-mono font-bold ${timerColor}`}>
            {timeLeft}
          </span>
          <div className="flex gap-6 text-lg">
            <span className="text-green-600 font-semibold">⭕ {correct}</span>
            <span className="text-red-500 font-semibold">❌ {wrong}</span>
          </div>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ${timerBarColor}`}
            style={{ width: `${timerBarWidth}%` }}
          />
        </div>
      </div>

      {/* 問題表示 */}
      <div
        className={`mt-8 p-8 rounded-2xl border-4 transition-colors duration-200 ${
          feedback === "correct"
            ? "border-green-400 bg-green-50"
            : feedback === "wrong"
              ? "border-red-400 bg-red-50"
              : "border-zinc-300 bg-white"
        }`}
      >
        <div className="text-5xl font-bold text-center font-mono tracking-wider">
          {problem.a} {problem.operator} {problem.b} = ?
        </div>
      </div>

      {/* 入力 */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          ref={inputRef}
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="答えを入力"
          className="text-3xl text-center font-mono w-48 p-3 border-2 border-zinc-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          autoComplete="off"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-6 rounded-lg hover:bg-blue-700 transition-colors text-xl"
        >
          回答
        </button>
      </form>

      <p className="text-zinc-400 text-sm mt-2">Enterキーで回答を送信</p>
    </div>
  );
}

function HistoryChart({ records }: { records: GameRecord[] }) {
  // 日付ごとに集計
  const dailyData = useMemo(() => {
    const map = new Map<
      string,
      { correct: number; wrong: number; games: number }
    >();
    for (const r of records) {
      const existing = map.get(r.date) ?? { correct: 0, wrong: 0, games: 0 };
      existing.correct += r.correct;
      existing.wrong += r.wrong;
      existing.games += 1;
      map.set(r.date, existing);
    }

    // 最新14日分を表示
    const entries = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14);

    return entries.map(([date, data]) => ({ date, ...data }));
  }, [records]);

  if (dailyData.length === 0) {
    return (
      <p className="text-zinc-400 text-center py-8">
        まだ記録がありません。ゲームをプレイしましょう！
      </p>
    );
  }

  const maxValue = Math.max(...dailyData.map((d) => d.correct + d.wrong), 1);

  const chartHeight = 200;
  const barWidth = Math.min(40, Math.floor(600 / dailyData.length) - 8);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-fit mx-auto flex flex-col items-center">
        <div
          className="flex items-end gap-2"
          style={{ height: chartHeight + 40 }}
        >
          {dailyData.map((d) => {
            const total = d.correct + d.wrong;
            const correctH = (d.correct / maxValue) * chartHeight;
            const wrongH = (d.wrong / maxValue) * chartHeight;
            return (
              <div key={d.date} className="flex flex-col items-center">
                <span className="text-xs text-zinc-500 mb-1 font-mono">
                  {total}
                </span>
                <div
                  className="flex flex-col-reverse"
                  style={{ height: chartHeight }}
                >
                  <div
                    className="bg-green-500 rounded-t-sm transition-all"
                    style={{ width: barWidth, height: correctH }}
                    title={`正解: ${d.correct}`}
                  />
                  <div
                    className="bg-red-400 rounded-t-sm transition-all"
                    style={{ width: barWidth, height: wrongH }}
                    title={`不正解: ${d.wrong}`}
                  />
                </div>
                <span className="text-xs text-zinc-500 mt-1 whitespace-nowrap">
                  {formatDate(d.date)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-6 mt-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-sm" />
            正解
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-400 rounded-sm" />
            不正解
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  correct,
  wrong,
  onReplay,
  onSettings,
}: {
  correct: number;
  wrong: number;
  onReplay: () => void;
  onSettings: () => void;
}) {
  const [history, setHistory] = useState<GameRecord[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <h2 className="text-2xl font-bold border-none">タイムアップ！</h2>

      <div className="grid grid-cols-3 gap-6 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-600">{correct}</div>
          <div className="text-sm text-zinc-500 mt-1">正解</div>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-red-500">{wrong}</div>
          <div className="text-sm text-zinc-500 mt-1">不正解</div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
          <div className="text-sm text-zinc-500 mt-1">正解率</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onReplay}
          className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 hover:cursor-pointer transition-all active:scale-95"
        >
          もう一度プレイ
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="bg-zinc-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-zinc-600 hover:cursor-pointer transition-all active:scale-95"
        >
          設定に戻る
        </button>
      </div>

      {/* 履歴グラフ */}
      <div className="w-full mt-4">
        <h2 className="text-xl font-bold border-none mb-4 text-center">
          📊 プレイ履歴（最新14日間）
        </h2>
        <HistoryChart records={history} />
      </div>

      {/* 直近の記録テーブル */}
      {history.length > 0 && (
        <div className="w-full mt-2">
          <h3 className="font-semibold mb-2">直近の記録</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-300">
                  <th className="text-left p-2">日付</th>
                  <th className="text-center p-2">正解</th>
                  <th className="text-center p-2">不正解</th>
                  <th className="text-center p-2">演算</th>
                  <th className="text-center p-2">桁数</th>
                </tr>
              </thead>
              <tbody>
                {history
                  .slice(-10)
                  .reverse()
                  .map((r) => (
                    <tr key={r.timestamp} className="border-b border-zinc-200">
                      <td className="p-2">{formatDate(r.date)}</td>
                      <td className="text-center p-2 text-green-600 font-semibold">
                        {r.correct}
                      </td>
                      <td className="text-center p-2 text-red-500 font-semibold">
                        {r.wrong}
                      </td>
                      <td className="text-center p-2 font-mono">
                        {r.operators.join(" ")}
                      </td>
                      <td className="text-center p-2">{r.maxDigits}桁</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── メインページ ───
export default function QuickCalcGame() {
  const [phase, setPhase] = useState<Phase>("settings");
  const [operators, setOperators] = useState<Operator[]>(["+", "-"]);
  const [maxDigits, setMaxDigits] = useState(1);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [lastWrong, setLastWrong] = useState(0);

  const handleStart = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleFinish = useCallback(
    (correct: number, wrong: number) => {
      setLastCorrect(correct);
      setLastWrong(wrong);

      const record: GameRecord = {
        date: new Date().toISOString().split("T")[0],
        timestamp: Date.now(),
        correct,
        wrong,
        operators: [...operators],
        maxDigits,
      };
      saveRecord(record);

      setPhase("result");
    },
    [operators, maxDigits],
  );

  const handleReplay = useCallback(() => {
    setPhase("playing");
  }, []);

  const handleBackToSettings = useCallback(() => {
    setPhase("settings");
  }, []);

  return (
    <div className="min-h-full flex items-start justify-center p-6">
      <div className="w-full max-w-2xl bg-zinc-50 border-2 border-zinc-300 rounded-xl shadow-lg p-8">
        <h1 className="text-center">計算ゲーム</h1>

        {phase === "settings" && (
          <SettingsPanel
            operators={operators}
            setOperators={setOperators}
            maxDigits={maxDigits}
            setMaxDigits={setMaxDigits}
            onStart={handleStart}
          />
        )}

        {phase === "playing" && (
          <GamePlay
            key={Date.now()}
            operators={operators}
            maxDigits={maxDigits}
            onFinish={handleFinish}
          />
        )}

        {phase === "result" && (
          <ResultPanel
            correct={lastCorrect}
            wrong={lastWrong}
            onReplay={handleReplay}
            onSettings={handleBackToSettings}
          />
        )}
      </div>
    </div>
  );
}
