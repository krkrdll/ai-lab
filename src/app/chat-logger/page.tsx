import Image from "next/image";
import PlayGameLink from "@/components/PlayGameLink";
import Prompt from "@/components/Prompt";
import Report from "@/components/Report";

const prompts = [
  `
自分のチャットを保存できるサイトを作成してください。
* メッセージアプリのようにテキスト入力エリアに文字を入力するとログとして記録されていく
* ログは日付ごとに分けて表示させることができる
* ログはLocalStorageに保存される`,
  `
テキストは複数行入力できるようにし、Enterキーで改行、Crtl+Enterキーで送信できるようにしてください。
テキストがURL形式の場合にはリンクを貼ってください。
`,
  `
日付ごとにログをダウンロードできる機能を追加してください。ファイル形式はMarkdownで、ファイル名は「chatlog-YYYY-MM-DD.md」としてください。
`,
  `
メッセージを削除する前に確認用のダイアログを表示するようにしてください
`,
];

export default function Page() {
  return (
    <Report>
      <h1>Chat Logger</h1>

      <p>簡易的なメモを保存できるサイト。</p>

      <div className="flex justify-center">
        <PlayGameLink link="https://chatlogg-qehhhqtp.manus.space/" />
      </div>

      <h2>制作</h2>

      <ul>
        <li>使用サービス: Manus</li>
        <li>制作時間: 30分</li>
      </ul>

      <p>
        ちょっとしたメモを保存しておけるものが欲しくて作成。投稿できるのはテキストのみで、データはローカルストレージに保存される。
      </p>

      <Prompt prompts={prompts} />

      <p>プロンプトに対してできたものはほぼ想定通りの機能で申し分なし。</p>
    </Report>
  );
}
