export const FormCheckbox = ({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`w-5 h-5 accent-blue-600 rounded cursor-pointer ${className}`}
    />
  );
};
