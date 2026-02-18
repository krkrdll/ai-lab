export default function Prompt({
  prompts,
  className,
}: Readonly<{ prompts: string[]; className?: string }>) {
  return (
    <>
      {prompts.map((text) => (
        <div
          key={text}
          className={`bg-zinc-800 text-white my-4 p-2 rounded ${className}`}
        >
          {text.split("\n").map((line, index) => (
            <span key={crypto.randomUUID()}>
              {line}
              {index > 0 && index < text.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}
