import type { Status, SubmissionResult } from "../types";
import { MAX_RETRIES } from "../apis/Mockapi";

interface Props {
  status: Status;
  attempts: number;
  error: string | null;
  submission: Partial<SubmissionResult> | null;
  onReset: () => void;
}

interface BannerConfig {
  borderColor: string;
  bgColor: string;
  iconColor: string;
  icon: string;
  headline: string;
  body: string;
}

export default function StatusBanner({
  status,
  attempts,
  error,
  submission,
  onReset,
}: Props) {
  if (status === "idle") return null;

  const configs: Record<Exclude<Status, "idle">, BannerConfig> = {
    pending: {
      borderColor: "border-l-sky",
      bgColor: "bg-sky-dim",
      iconColor: "text-sky animate-pulse-soft",
      icon: "◎",
      headline:
        attempts === 0 ? "Sending…" : `Retrying… (${attempts}/${MAX_RETRIES})`,
      body:
        attempts === 0
          ? "Your request is on its way."
          : "Temporary failure — automatically retrying with back-off.",
    },
    success: {
      borderColor: "border-l-mint",
      bgColor: "bg-mint-dim",
      iconColor: "text-mint",
      icon: "✓",
      headline: "Request Confirmed",
      body: `Recorded for ${submission?.email} · $${Number(submission?.amount).toFixed(2)}`,
    },
    failed: {
      borderColor: "border-l-danger",
      bgColor: "bg-danger-dim",
      iconColor: "text-danger",
      icon: "✕",
      headline: "Submission Failed",
      body: error ?? "Max retries reached. Please try again.",
    },
  };

  const cfg = configs[status as Exclude<Status, "idle">];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        flex items-start gap-4 px-5 py-4
        border-l-[3px] ${cfg.borderColor} ${cfg.bgColor}
        animate-slide-in
      `}
    >
      {/* Icon */}
      <span className={`text-lg leading-none mt-0.5 shrink-0 ${cfg.iconColor}`}>
        {cfg.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <p className="font-display font-bold text-[0.95rem] text-ink">
          {cfg.headline}
        </p>
        <p className="font-mono text-[0.7rem] text-muted leading-relaxed">
          {cfg.body}
        </p>

        {/* Retry progress bar */}
        {status === "pending" && (
          <div
            className="mt-1.5 h-0.5 bg-border-bright overflow-hidden"
            aria-label="Retry progress"
          >
            <div
              className="h-full bg-sky transition-[width] duration-500 ease-out"
              style={{ width: `${(attempts / MAX_RETRIES) * 100}%` }}
            />
          </div>
        )}

        {/* Idempotency key */}
        {status === "success" && submission?.idempotencyKey && (
          <p className="font-mono text-[0.58rem] text-dim tracking-widest mt-1 break-all">
            KEY <span className="text-mint">{submission.idempotencyKey}</span>
          </p>
        )}
      </div>

      {/* Reset button */}
      {(status === "success" || status === "failed") && (
        <button
          onClick={onReset}
          aria-label="Start over"
          className="
            shrink-0 font-mono text-sm text-muted
            border border-border-bright px-2 py-1 mt-0.5
            hover:text-ink hover:border-ink
            transition-colors duration-150 rounded-none
          "
        >
          ↩
        </button>
      )}
    </div>
  );
}
