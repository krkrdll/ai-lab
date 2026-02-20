import Image from "next/image";
import PlayGameButton from "@/components/PlayGameButton";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
計算ゲームアプリを作成してください。

* ゲームを開始すると簡単な四則演算の問題が画面に表示される。キー入力で回答を入力すると次の問題が出題される
* 制限時間は60秒で、タイムアウト後に正解数、間違い数がローカルストレージに保存される
* 日々の記録がグラフになって表示される
* 設定により、加算のみの出題、減算のみの出題、最大2桁まで等の難易度が設定できる
`,
];

export default function Page() {
  return (
    <Report>
      <h1>計算ゲーム</h1>

      <p>
        制限時間60秒以内にできるだけ多くの四則演算の問題に正解しましょう。設定で出題される演算の種類や桁数を変更できます。日々の成績はグラフで確認できます。
      </p>

      <Image
        src="/images/quick-calc.png"
        alt="Game Screenshot"
        width={400}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center my-6">
        <PlayGameButton link="/quick-calc/game" />
      </div>

      <h2>ルール</h2>

      <ul>
        <li>ゲーム開始後、四則演算の問題が表示されます</li>
        <li>答えをキーボードで入力し、Enterで回答します</li>
        <li>正解すると次の問題が出題されます</li>
        <li>制限時間は60秒です</li>
        <li>
          タイムアウト後、正解数と間違い数が記録され、履歴グラフに反映されます
        </li>
        <li>出題する演算の種類（加算、減算、乗算、除算）を選択できます</li>
        <li>最大桁数（1桁〜3桁）を設定できます</li>
      </ul>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Github Copilot</li>
        <li>使用モデル: Claude Opus 4.6</li>
        <li>制作開始: 2026/02/21</li>
        <li>制作時間: 10分</li>
      </ul>

      <Prompt prompts={prompts} />

      <p>
        難易度設定できるようにしたが、結果がまとまってしまうので成長の記録としてはわかりにくくなっている。初級～上級などの難易度ごとに分け、結果も別々に表示するようにすればわかりやすくなるか？
      </p>
    </Report>
  );
}
