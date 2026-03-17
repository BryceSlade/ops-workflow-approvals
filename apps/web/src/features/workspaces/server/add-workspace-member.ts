"use server";

import { WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireWorkspaceAdmin } from "@/features/workspaces/server/permissions";

export type WorkspaceMemberActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function addWorkspaceMember(
  workspaceId: string,
  _prevState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  try {
    const actor = await requireCurrentUser();
    await requireWorkspaceAdmin(workspaceId);

    const rawEmail = formData.get("email");
    const rawRole = formData.get("role");

    const email =
      typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const role = typeof rawRole === "string" ? rawRole : "";

    if (!email) {
      return { ok: false, error: "Email is required" };
    }

    if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
      return { ok: false, error: "Valid role is required" };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return {
        ok: false,
        error: "That user has not signed in yet. Ask them to log in first.",
      };
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (existingMembership) {
      return { ok: false, error: "User is already a member of this workspace" };
    }

    await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: role as WorkspaceRole,
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: actor.id,
        action: "member.added",
        message: `Added ${user.email} to workspace as ${role}`,
        metadata: {
          addedUserId: user.id,
          addedUserEmail: user.email,
          role,
        },
      },
    });

    revalidatePath(`/workspaces/${workspaceId}/settings/members`);

    return { ok: true, message: "Member added successfully" };
  } catch {
    return { ok: false, error: "Unable to add member right now" };
  }
}
