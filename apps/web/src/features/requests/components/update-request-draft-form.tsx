"use client";

import { useActionState } from "react";
import { updateRequestDraft } from "@/features/requests/server/update-request-draft";
import type { RequestActionState } from "@/features/requests/server/submit-request";

const initialState: RequestActionState = { ok: true };

type UpdateRequestDraftFormProps = {
  requestId: string;
  title: string;
  description: string | null;
};

export function UpdateRequestDraftForm({
  requestId,
  title,
  description,
}: UpdateRequestDraftFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateRequestDraft.bind(null, requestId),
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-3">
      <input
        type="text"
        name="title"
        defaultValue={title}
        className="w-full rounded-md border px-3 py-2 text-sm"
        required
        maxLength={200}
      />

      <textarea
        name="description"
        defaultValue={description ?? ""}
        className="min-h-35 w-full rounded-md border px-3 py-2 text-sm"
      />

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>

        {"error" in state ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}

        {"message" in state && state.message ? (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        ) : null}
      </div>
    </form>
  );
}
