# Eventually Consistent Form — React + TypeScript + Tailwind

## Quick Start

```bash
npm create vite@latest eventually-consistent-form -- --template react-ts
cd eventually-consistent-form
npm install
npm install -D tailwindcss @tailwindcss/vite

# Replace vite.config.ts and src/ with the provided files, then:
npm run dev
```

---

## File Structure

```
src/
  api/
    mockApi.ts            ← mock network layer + typed retry logic
  components/
    SubmissionForm.tsx    ← controlled form with validation
    StatusBanner.tsx      ← live state display
  utils/
    idempotency.ts        ← deterministic key generation
  types.ts                ← shared TypeScript interfaces
  App.tsx                 ← state machine / orchestration
  index.css               ← Tailwind v4 + custom tokens + keyframes
  main.tsx
vite.config.ts            ← @tailwindcss/vite plugin
```

---

## State Transitions

```
idle ──(submit)──▶ pending ──(success)──────────────▶ success
                      │                                   │
                      └──(503, attempt < MAX)──▶ pending  │ (↩ reset)
                      │                                   │
                      └──(503 × MAX  |  non-503)──▶ failed┘
```

| State     | UI                                                        |
|-----------|-----------------------------------------------------------|
| `idle`    | Clean form ready to fill                                  |
| `pending` | Spinner on button, status banner with attempt counter     |
| `success` | Green banner with email/amount/idempotency key confirmed  |
| `failed`  | Red banner with error message, ↩ reset button             |

---

## Retry Logic

`src/api/mockApi.ts` → `submitWithRetry`

- **Max retries**: `MAX_RETRIES = 3` (exported, shared with the UI progress bar)
- **Back-off**: exponential — `1500 × 2^(attempt-1)` ms → 1.5 s → 3 s → 6 s
- **Retry condition**: **503 only**. Other errors are treated as permanent and bail immediately.
- The UI progress bar width is driven by `attempts / MAX_RETRIES`.

---

## How Duplicates Are Prevented

### Layer 1 — UI lock
`handleSubmit` in `App.tsx` short-circuits if `status === "pending"`:
```ts
if (status === "pending") return;
```
The form is also hidden and the button disabled, so there's no way to fire a second request through the UI.

### Layer 2 — Idempotency key
Before the first request, a deterministic key is derived:
```
key = base62(djb2(`${email}::${amount.toFixed(2)}::${sessionUUID}`))
```
The mock API stores `key → SubmissionResult` in a `Map<string, SubmissionResult>`. If the same key arrives again (retry after a request that silently succeeded server-side), the cached result is returned immediately — **no second record is created**.

In production, this map lives in Redis or as a DB unique constraint on `idempotency_key`.

---

## Mock API Behaviour

Each call randomly picks one of three outcomes:

| Outcome         | Probability | Details                  |
|-----------------|-------------|--------------------------|
| Immediate 200   | ~33%        | Resolves in 0.3–0.7 s   |
| 503 failure     | ~33%        | Rejects → triggers retry |
| Delayed 200     | ~33%        | Resolves after 5–10 s   |

---
The entire project is done by claude alone.