import Image from "next/image";
import PlayGameLink from "@/components/PlayGameLink";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
オセロゲームを作ってください
`,
];

export default function Page() {
  return (
    <Report>
      <h1>オセロ</h1>

      <p>
        オセロゲームです。プレイヤーは黒と白の石を交互に置き、相手の石を挟んで自分の色に変えていきます。最終的に盤面上の石の数が多い方が勝利となります。
      </p>

      <Image
        src="/images/othello.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameLink link="/static/othello/index.html" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Genspark</li>
        <li>制作時間: 20分</li>
      </ul>

      <p>Gensparkお試し第1弾。指示プロンプトは下記のみ。</p>

      <Prompt prompts={prompts} />

      <p>生成されたファイルは下記。</p>

      <Image
        src="/images/othello2.png"
        alt="Generated Files"
        width={300}
        height={200}
        className="my-4"
      />
    </Report>
  );
}
