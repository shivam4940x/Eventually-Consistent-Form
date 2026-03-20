import type { FormValues, SubmissionResult, ApiError } from "../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500;

type Outcome = "success" | "failure" | "delayed";

// ---------------------------------------------------------------------------
// In-memory idempotency store
// key → result  (prevents duplicate records across retries)
// ---------------------------------------------------------------------------
const processedKeys = new Map<string, SubmissionResult>();

// ---------------------------------------------------------------------------
// Single mock API call
// ---------------------------------------------------------------------------
function mockApiCall(
  payload: FormValues,
  idempotencyKey: string,
): Promise<SubmissionResult> {
  // Idempotency guard — return cached result if key already succeeded
  if (processedKeys.has(idempotencyKey)) {
    return Promise.resolve(processedKeys.get(idempotencyKey)!);
  }

  const outcomes: Outcome[] = ["success", "failure", "delayed"];
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

  if (outcome === "failure") {
    const err: ApiError = {
      status: 503,
      message: "Service temporarily unavailable",
    };
    return Promise.reject(err);
  }

  const delay =
    outcome === "delayed"
      ? 5_000 + Math.random() * 5_000 // 5–10 s
      : 300 + Math.random() * 400; // 0.3–0.7 s

  return new Promise<SubmissionResult>((resolve) =>
    setTimeout(() => {
      const result: SubmissionResult = {
        id: crypto.randomUUID(),
        email: payload.email,
        amount: payload.amount,
        idempotencyKey,
        confirmedAt: new Date().toISOString(),
      };
      processedKeys.set(idempotencyKey, result);
      resolve(result);
    }, delay),
  );
}

// ---------------------------------------------------------------------------
// Retry wrapper with exponential back-off
// ---------------------------------------------------------------------------
export async function submitWithRetry(
  payload: FormValues,
  idempotencyKey: string,
  /** Called before each retry with the current attempt number (1-based). */
  onAttempt: (attempt: number) => void,
): Promise<SubmissionResult> {
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      onAttempt(attempt);
      // Exponential back-off: 1.5 s → 3 s → 6 s
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }

    try {
      return await mockApiCall(payload, idempotencyKey);
    } catch (err) {
      const apiErr = err as ApiError;
      lastError = apiErr;
      // Only retry on 503; anything else is a permanent failure
      if (apiErr.status !== 503) break;
    }
  }

  throw new Error(
    lastError?.message ?? "Request failed after maximum retries.",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
