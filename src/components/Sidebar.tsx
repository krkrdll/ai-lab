import Link from "next/link";

const NavItem = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="hover:bg-zinc-200 p-2 rounded transition-colors block"
    >
      {children}
    </Link>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-64 bg-zinc-100 border-r-2 border-zinc-300 p-4 shrink-0 overflow-y-auto hidden md:block">
      <nav className="flex flex-col gap-2">
        <NavItem href="/">Home</NavItem>

        <h2>Applications</h2>

        <NavItem href="/chat-logger">Chat Logger</NavItem>
        <NavItem href="/sound-generator">Sound Generator</NavItem>
        <NavItem href="/password-generator">Password Generator</NavItem>

        <h2>Games</h2>

        <NavItem href="/quick-calc">計算ゲーム</NavItem>
        <NavItem href="/block-breaker">ブロック崩し</NavItem>
        <NavItem href="/mosquito">蚊を撃退するゲーム</NavItem>
        <NavItem href="/flash-sequence">フラッシュシーケンス</NavItem>
        <NavItem href="/othello">オセロ</NavItem>

        <h2>Others</h2>

        <NavItem href="/floating-objects">浮遊するオブジェクト</NavItem>
      </nav>
    </aside>
  );
}
