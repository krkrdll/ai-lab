"use client";

export default function PlayGameLink({ link }: Readonly<{ link: string }>) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg hover:cursor-pointer transition-all active:scale-95 flex items-center gap-2"
    >
      ゲームをプレイする
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="size-6"
      >
        <title>Play Game</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
        />
      </svg>
    </a>
  );
}
