"use client";

import Link from "next/link";
import Report from "@/components/Report";

type Notice = {
  date: string;
  content: string;
  link?: string;
};

const notices: Notice[] = [
  {
    date: "2026-02-25",
    content: "「Chat Logger」を追加",
    link: "/chat-logger",
  },
  {
    date: "2026-02-23",
    content: "「Sound Generator」を追加",
    link: "/sound-generator",
  },
  {
    date: "2026-02-22",
    content: "「浮遊するオブジェクト」を追加",
    link: "/floating-objects",
  },
];

export default function Page() {
  return (
    <Report>
      <h1>AIラボ</h1>

      <p>
        AIを使用して作成したものを紹介します。AIによってどのようなものが生成されるのかを確認するため、手直しは極力減らすことを目的にしています。
      </p>

      <h2>お知らせ</h2>
      <ul>
        {notices.map((notice) => (
          <li key={`${notice.date}-${notice.content}`} className="mb-4">
            {notice.date}: {notice.content}
            {notice.link && (
              <Link
                href={notice.link}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded ml-2"
              >
                リンク
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Report>
  );
}
