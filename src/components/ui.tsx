import type { ChangeEventHandler, ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Card({ title, description, children }: CardProps) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-6 shadow-sm ring-1 ring-[var(--border)]">
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          )}
          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children }: { children: ReactNode }) {
  return (
    <button className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary-strong)]">
      {children}
    </button>
  );
}

export function SecondaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
      {children}
    </button>
  );
}

export function Input({ name, defaultValue, placeholder, type = "text" }: { name: string; defaultValue?: string; placeholder?: string; type?: string }) {
  return (
    <input
      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
    />
  );
}

export function Select({
  name,
  defaultValue,
  children,
  onChange,
}: {
  name: string;
  defaultValue?: string;
  children: ReactNode;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}) {
  return (
    <select
      className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
    >
      {children}
    </select>
  );
}