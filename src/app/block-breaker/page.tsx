import Image from "next/image";
import PlayGameButton from "@/components/PlayGameButton";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
以下の仕様を満たすピンボールゲームを作成してください。

* 画面の上部にブロックが並び、ボールが当たると破壊される
* ブロックが破壊されると一定の割合でアイテムが降ってくる
* 画面下部を左右に移動できるバーがあり、ボールを跳ね返す
* アイテムにはバーが10%長くなる、ボールが2倍に増える、ブロックが壊れなくなる効果を持つ3つがある
`,
  `s:ブロック不壊を取るとステージクリアになりますが、一定時間ブロックが壊れない効果に変更してください`,
];

export default function Page() {
  return (
    <Report>
      <h1>ブロック崩し</h1>

      <p>
        プレイヤーがパドルを操作してボールを跳ね返し、画面上のブロックをすべて破壊することを目的としたクラシックなアーケードゲームです。
      </p>

      <Image
        src="/images/block-breaker.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameButton link="/block-breaker/game" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Github Copilot</li>
        <li>使用モデル: Gemini 3 Pro</li>
        <li>制作時間: 10分</li>
      </ul>

      <p>
        ルールが単純で、サンプルになるコードも豊富にあると思われるので、問題なく生成されるだろうと思い作成。案の定ゲームとしては問題ないレベルのものができたと思う。グラフィックに関しても想像以上。
      </p>

      <p>
        プロンプトとしては下記のような指示で作成。1回目で若干バグがあったので、それを2回目の指示で直した。コードは生成されたものそのままで手直しなし。
      </p>

      <Prompt prompts={prompts} />
    </Report>
  );
}
