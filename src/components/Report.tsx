export default function Report({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <section
      className={`my-10 border-2 border-zinc-300 mx-auto max-w-4xl rounded-md shadow-md p-8 bg-zinc-50 ${className}`}
    >
      {children}
    </section>
  );
}
