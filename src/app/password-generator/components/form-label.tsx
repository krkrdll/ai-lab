export const FormLabel = ({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-base font-medium text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      {children}
    </label>
  );
};
