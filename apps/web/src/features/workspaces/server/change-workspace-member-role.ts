"use server";

import { WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireWorkspaceAdmin } from "@/features/workspaces/server/permissions";

export async function changeWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  formData: FormData,
) {
  const actor = await requireCurrentUser();
  await requireWorkspaceAdmin(workspaceId);

  const rawRole = formData.get("role");
  const role = typeof rawRole === "string" ? rawRole : "";

  if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
    throw new Error("Valid role is required");
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
    throw new Error("Workspace member not found");
  }

  if (membership.role === role) {
    return;
  }

  if (membership.role === WorkspaceRole.ADMIN && role !== WorkspaceRole.ADMIN) {
    const adminCount = await prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.ADMIN,
      },
    });

    if (adminCount <= 1) {
      throw new Error("Cannot remove the last admin from a workspace");
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
}
