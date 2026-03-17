"use server";

import { WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireWorkspaceAdmin } from "@/features/workspaces/server/permissions";
import type { WorkspaceMemberActionState } from "@/features/workspaces/server/add-workspace-member";

export async function changeWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  _prevState: WorkspaceMemberActionState,
  formData: FormData,
): Promise<WorkspaceMemberActionState> {
  try {
    const actor = await requireCurrentUser();
    await requireWorkspaceAdmin(workspaceId);

    const rawRole = formData.get("role");
    const role = typeof rawRole === "string" ? rawRole : "";

    if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
      return { ok: false, error: "Valid role is required" };
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
        role: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!membership || membership.workspaceId !== workspaceId) {
      return { ok: false, error: "Workspace member not found" };
    }

    if (membership.userId === actor.id) {
      return { ok: false, error: "You cannot change your own role" };
    }

    if (membership.role === role) {
      return { ok: true, message: "No role change needed" };
    }

    if (
      membership.role === WorkspaceRole.ADMIN &&
      role !== WorkspaceRole.ADMIN
    ) {
      const adminCount = await prisma.workspaceMember.count({
        where: {
          workspaceId,
          role: WorkspaceRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        return {
          ok: false,
          error: "Cannot remove the last admin from a workspace",
        };
      }
    }

    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        role: role as WorkspaceRole,
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId,
        actorUserId: actor.id,
        action: "member.role_changed",
        message: `Changed ${membership.user.email} from ${membership.role} to ${role}`,
        metadata: {
          memberId: membership.id,
          targetUserId: membership.userId,
          targetUserEmail: membership.user.email,
          previousRole: membership.role,
          newRole: role,
        },
      },
    });

    revalidatePath(`/workspaces/${workspaceId}/settings/members`);

    return { ok: true, message: "Role updated successfully" };
  } catch {
    return { ok: false, error: "Unable to update role right now" };
  }
}
