"use client";

import { useActionState } from "react";
import { WorkspaceRole } from "@prisma/client";
import { changeWorkspaceMemberRole } from "@/features/workspaces/server/change-workspace-member-role";
import type { WorkspaceMemberActionState } from "@/features/workspaces/server/add-workspace-member";

const initialState: WorkspaceMemberActionState = { ok: true };

type ChangeRoleFormProps = {
  workspaceId: string;
  memberId: string;
  currentRole: WorkspaceRole;
};

export function ChangeRoleForm({
  workspaceId,
  memberId,
  currentRole,
}: ChangeRoleFormProps) {
  const [state, formAction, isPending] = useActionState(
    changeWorkspaceMemberRole.bind(null, workspaceId, memberId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2 md:flex-row">
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded-md border px-3 py-2 text-sm"
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
        {isPending ? "Updating..." : "Update role"}
      </button>

      {"error" in state ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}
