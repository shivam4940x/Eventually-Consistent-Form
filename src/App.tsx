import { useState, useCallback } from "react";
import type { Status, FormValues, SubmissionResult } from "./types";
import { submitWithRetry } from "./apis/Mockapi";
import StatusBanner from "./components/Statusbanner";
import SubmissionForm from "./components/Submissionform";
import { generateIdempotencyKey } from "./utils/idempotency";

export default function App() {
  const [status, setStatus] = useState<Status>("idle");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] =
    useState<Partial<SubmissionResult> | null>(null);

  const handleSubmit = useCallback(
    async ({ email, amount }: FormValues) => {
      if (status === "pending") return; // duplicate-submission guard

      const idempotencyKey = generateIdempotencyKey(email, amount);

      setSubmission({ email, amount, idempotencyKey });
      setStatus("pending");
      setAttempts(0);
      setError(null);

      try {
        const result = await submitWithRetry(
          { email, amount },
          idempotencyKey,
          (n) => setAttempts(n),
        );
        setStatus("success");
        setSubmission(result);
      } catch (err) {
        setStatus("failed");
        setError((err as Error).message);
      }
    },
    [status],
  );

  const handleReset = () => {
    setStatus("idle");
    setSubmission(null);
    setAttempts(0);
    setError(null);
  };

  return (
    <div className="relative min-h-screen bg-bg flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Grid lines */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40 z-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise overlay via SVG data-uri */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          width: "200%",
          height: "200%",
          top: "-50%",
          left: "-50%",
        }}
      />

      {/* Page content */}
      <main className="relative z-10 w-full max-w-120 flex flex-col gap-10 animate-fade-up">
        {/* Header */}
        <header className="flex flex-col gap-1.5">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-lime">
            Eventually Consistent
          </p>
          <h1
            className="font-display font-extrabold text-ink leading-[0.93] tracking-[-0.03em]"
            style={{ fontSize: "clamp(3rem,10vw,4.5rem)" }}
          >
            Payment
            <br />
            Request
          </h1>
          <p className="font-mono text-[0.72rem] tracking-[0.05em] text-muted mt-1">
            Resilient · Retrying · Reliable
          </p>
        </header>

        {/* Form area */}
        <div className="flex flex-col gap-3">
          <StatusBanner
            status={status}
            attempts={attempts}
            error={error}
            submission={submission}
            onReset={handleReset}
          />

          {(status === "idle" || status === "pending") && (
            <SubmissionForm
              onSubmit={handleSubmit}
              disabled={status === "pending"}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="font-mono text-[0.6rem] text-dim tracking-widest uppercase border-t border-border pt-4">
          Auto-retry · Idempotency · Duplicate-safe
        </footer>
      </main>
    </div>
  );
}
