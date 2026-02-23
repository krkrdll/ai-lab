import Image from "next/image";
import PlayGameLink from "@/components/PlayGameLink";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
「音」を作れるアプリを作成してください。
周波数やピッチなどのパラメータを調整してSEのような単純な音が生成できます。
`,
];

export default function Page() {
  return (
    <Report>
      <h1>サウンドジェネレーター</h1>

      <p>各種パラメータを調整して、オリジナルのサウンドが作れるアプリです。
      </p>

      <Image
        src="/images/sound-generator.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameLink link="https://soundgen-yu844pgo.manus.space/" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Manus</li>
        <li>制作時間: 30分</li>
      </ul>

      <p>簡単なSEを作れたらいいなと思い作成。</p>

      <Prompt prompts={prompts} />
    </Report>
  );
}
