import Image from "next/image";
import PlayGameButton from "@/components/PlayGameButton";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
格子状に並んだランプが順番に光ります。その後、ユーザーは同じ順番でランプをタップしていきます。正しい順番でタップできれば、次のレベルに進みます。レベルが上がるごとに、ランプの数や光る順番が複雑になります。ユーザーは記憶力と集中力を駆使して、できるだけ多くのレベルをクリアすることを目指します。
`,
  `
3回までのミスを許容するようにしてください。ミスをした場合は、どこで間違えたかをフィードバックして、再度同じレベルから挑戦できるようにしてください。
`,
];

export default function Page() {
  return (
    <Report>
      <h1>フラッシュシーケンス</h1>

      <p>
        格子状に並んだランプが順番に光るパターンを記憶し、同じ順番でタップして再現する記憶力ゲームです。レベルが上がるとグリッドが大きくなり、シーケンスも長くなります。
      </p>

      <Image
        src="/images/flash-sequence.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameButton link="/flash-sequence/game" />
      </div>

      <h2>ルール</h2>

      <ul>
        <li>ランプが順番に光るので、そのパターンを覚えてください</li>
        <li>パターン表示後、同じ順番でランプをタップしてください</li>
        <li>正しい順番で全てタップできれば次のレベルに進みます</li>
        <li>レベルが上がるとグリッドサイズやシーケンスの長さが増加します</li>
        <li>ミスは3回まで、3回目のミスでゲームオーバーです</li>
      </ul>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Github Copilot</li>
        <li>使用モデル: Claude Opus 4.6</li>
        <li>制作時間: 15分</li>
      </ul>

      <Prompt prompts={prompts} />
    </Report>
  );
}
