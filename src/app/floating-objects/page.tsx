import Image from "next/image";
import PlayGameLink from "@/components/PlayGameLink";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
three.jsを使用して、無数のオブジェクトが浮かぶ空間を作成して。
オブジェクトは時間経過とともに七色に変化し、ゆっくりと上昇していくよ。
`,
  `
カメラを回転できるようにして、自由に360度見られるようにしてください
`,
  `
オブジェクトの数を増やし、画面いっぱいに広がるようにしてください
`,
  `
オブジェクトのサイズを2倍にしてください。
上昇するときにまっすぐ上昇するのではなく、揺らぎを表現するためにランダム性を追加してください
`,
  `
オブジェクトをクリックできるようにしてください。クリックしたオブジェクトはパーティクルが発生し消滅するようにしてください
`,
];

export default function Page() {
  return (
    <Report>
      <h1>浮遊するオブジェクト</h1>

      <p>Three.jsを使用して、オブジェクトが移動するだけの空間。</p>

      <Image
        src="/images/floating-objects.png"
        alt="Game Screenshot"
        width={600}
        height={400}
        className="my-4 mx-auto"
      />

      <div className="flex justify-center">
        <PlayGameLink link="https://floatrainbow-xx8yiazx.manus.space/" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Manus</li>
        <li>制作時間: 20分</li>
      </ul>

      <p>Three.jsを使って何かできないかと考えたて作り始めた。</p>

      <Prompt prompts={prompts} />

      <p>
        オブジェクトを隕石に見立て、クリックして破壊することで自分の宇宙船を守るようなゲームはできそうな気がする。
      </p>
    </Report>
  );
}
