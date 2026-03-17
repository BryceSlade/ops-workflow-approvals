"use client";

import { useActionState } from "react";
import { approveRequest } from "@/features/requests/server/approve-request";
import { rejectRequest } from "@/features/requests/server/reject-request";
import type { RequestActionState } from "@/features/requests/server/submit-request";

const initialState: RequestActionState = { ok: true };

type ReviewRequestActionsProps = {
  requestId: string;
};

export function ReviewRequestActions({ requestId }: ReviewRequestActionsProps) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveRequest.bind(null, requestId),
    initialState,
  );

  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectRequest.bind(null, requestId),
    initialState,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <form action={approveAction}>
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {approvePending ? "Approving..." : "Approve"}
          </button>
        </form>

        <form action={rejectAction}>
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {rejectPending ? "Rejecting..." : "Reject"}
          </button>
        </form>
      </div>

      {"error" in approveState ? (
        <p className="text-sm text-red-600">{approveState.error}</p>
      ) : null}

      {"error" in rejectState ? (
        <p className="text-sm text-red-600">{rejectState.error}</p>
      ) : null}
    </div>
  );
}
