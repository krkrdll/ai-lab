import Image from "next/image";
import PlayGameButton from "@/components/PlayGameButton";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
蚊を退治するゲームです。以下の仕様を満たすようなゲームを作成してください。

* Mediapipeを使用してプレイヤーの手の動きを検出し、画面上のクロスヘアを手の動きに合わせて移動させる
* 画面上にランダムに現れる蚊をクロスヘアで撃退する
* 撃退した蚊の数をカウントし、一定数撃退するとゲームクリアとする
`,
  `
余白を少なくして、ゲーム画面を大きく表示するようにしてください。
`,
];

export default function Page() {
  return (
    <Report>
      <h1>蚊を撃退するゲーム</h1>

      <p>
        プレイヤーが手の動きを使って画面上のクロスヘアを操作し、ランダムに現れる蚊を撃退することを目的としたゲームです。手をグー・パーして蚊を潰してください。
      </p>

      <Image
        src="/images/mosquito.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameButton link="/mosquito/game" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Github Copilot</li>
        <li>使用モデル: Claude Opus 4.6</li>
        <li>制作時間: 10分</li>
      </ul>

      <p>
        Mediapipeの手を認識するゲームで思いついたアイデアをプロンプトに入力してみた結果。期待以上の出来で、線や円などを使用して「蚊」を描画しているのがすごい。
      </p>

      <Prompt prompts={[prompts[0]]} />

      <p>
        ゲームのプレイ画面が少し小さかったので、以下のプロンプトを追加で入力。
      </p>

      <Prompt prompts={[prompts[1]]} />
    </Report>
  );
}
