"use client";

import { useActionState } from "react";
import { WorkspaceRole } from "@prisma/client";
import {
  addWorkspaceMember,
  type WorkspaceMemberActionState,
} from "@/features/workspaces/server/add-workspace-member";

const initialState: WorkspaceMemberActionState = { ok: true };

type AddMemberFormProps = {
  workspaceId: string;
};

export function AddMemberForm({ workspaceId }: AddMemberFormProps) {
  const [state, formAction, isPending] = useActionState(
    addWorkspaceMember.bind(null, workspaceId),
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]"
    >
      <input
        type="email"
        name="email"
        placeholder="user@example.com"
        className="rounded-md border px-3 py-2 text-sm"
        required
      />

      <select
        name="role"
        className="rounded-md border px-3 py-2 text-sm"
        defaultValue={WorkspaceRole.REQUESTER}
      >
        {Object.values(WorkspaceRole).map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isPending ? "Adding..." : "Add member"}
      </button>

      {"error" in state ? (
        <p className="text-sm text-red-600 md:col-span-3">{state.error}</p>
      ) : null}

      {"message" in state && state.message ? (
        <p className="text-sm text-muted-foreground md:col-span-3">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
