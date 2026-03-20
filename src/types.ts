export type Status = "idle" | "pending" | "success" | "failed";

export interface FormValues {
  email: string;
  amount: number;
}

export interface SubmissionResult extends FormValues {
  id: string;
  idempotencyKey: string;
  confirmedAt: string;
}

export interface ApiError {
  status: number;
  message: string;
}
