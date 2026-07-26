export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-700">
        {label}
        {hint && <span className="ml-1 font-normal text-zinc-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
