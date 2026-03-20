import { useState } from "react";
import type { FormValues } from "../types";

interface Props {
  onSubmit: (values: FormValues) => void;
  disabled: boolean;
}

interface FieldErrors {
  email: string | null;
  amount: string | null;
}

interface Touched {
  email: boolean;
  amount: boolean;
}

export default function SubmissionForm({ onSubmit, disabled }: Props) {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [touched, setTouched] = useState<Touched>({
    email: false,
    amount: false,
  });

  const errors: FieldErrors = {
    email:
      touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Valid email required"
        : null,
    amount:
      touched.amount && (isNaN(Number(amount)) || Number(amount) <= 0)
        ? "Positive number required"
        : null,
  };

  const isValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && Number(amount) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, amount: true });
    if (!isValid || disabled) return;
    onSubmit({ email, amount: Number(amount) });
  }

  const inputBase =
    "w-full bg-surface2 border text-ink font-mono text-sm px-4 py-3 outline-none " +
    "transition-all duration-150 rounded-none placeholder:text-dim " +
    "focus:border-lime focus:shadow-[0_0_0_3px_rgba(232,255,71,0.12)] " +
    "disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative bg-surface border border-border p-8 flex flex-col gap-6"
    >
      {/* Corner accent */}
      <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-lime pointer-events-none" />

      {/* EMAIL */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.12em] uppercase text-muted"
        >
          <span className="text-lime">01</span> Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="you@domain.com"
          disabled={disabled}
          autoComplete="email"
          className={`${inputBase} ${errors.email ? "border-danger" : "border-border"}`}
        />
        {errors.email && (
          <span className="font-mono text-[0.65rem] text-danger tracking-wide">
            {errors.email}
          </span>
        )}
      </div>

      {/* AMOUNT */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="amount"
          className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.12em] uppercase text-muted"
        >
          <span className="text-lime">02</span> Amount (USD)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 font-mono text-sm text-muted pointer-events-none">
            $
          </span>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
            placeholder="0.00"
            disabled={disabled}
            min="0.01"
            step="0.01"
            className={`${inputBase} pl-7 ${errors.amount ? "border-danger" : "border-border"}`}
          />
        </div>
        {errors.amount && (
          <span className="font-mono text-[0.65rem] text-danger tracking-wide">
            {errors.amount}
          </span>
        )}
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={disabled}
        aria-busy={disabled}
        className={`
          mt-2 flex items-center justify-center gap-2
          font-mono text-[0.8rem] tracking-widest uppercase
          px-6 py-4 transition-all duration-150 rounded-none border-0
          ${
            disabled
              ? "bg-surface2 text-muted border border-border cursor-not-allowed"
              : "bg-lime text-bg cursor-pointer hover:-translate-y-px hover:bg-[#f4ff6e] active:translate-y-0"
          }
        `}
      >
        {disabled ? (
          <>
            <span
              className="w-3 h-3 rounded-full border border-muted border-t-sky animate-spin-slow"
              aria-hidden="true"
            />
            Processing…
          </>
        ) : (
          <>
            <span className="text-base leading-none">→</span>
            Submit Request
          </>
        )}
      </button>
    </form>
  );
}
