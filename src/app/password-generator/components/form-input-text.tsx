export const FormInputText = ({
  value,
  onChange,
  placeholder,
  className,
  id,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}) => {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full mt-2 p-2 text-base font-mono bg-white border border-zinc-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all ${className}`}
    />
  );
};
