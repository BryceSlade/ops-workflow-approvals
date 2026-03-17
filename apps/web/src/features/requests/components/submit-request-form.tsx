"use client";

import { useActionState } from "react";
import {
  submitRequest,
  type RequestActionState,
} from "@/features/requests/server/submit-request";

const initialState: RequestActionState = { ok: true };

type SubmitRequestFormProps = {
  requestId: string;
  buttonLabel?: string;
};

export function SubmitRequestForm({
  requestId,
  buttonLabel = "Submit",
}: SubmitRequestFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitRequest.bind(null, requestId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Submitting..." : buttonLabel}
      </button>

      {"error" in state ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
