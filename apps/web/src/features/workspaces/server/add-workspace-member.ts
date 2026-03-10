"use server";

import { WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireWorkspaceAdmin } from "@/features/workspaces/server/permissions";

export async function addWorkspaceMember(
  workspaceId: string,
  formData: FormData,
) {
  const actor = await requireCurrentUser();
  await requireWorkspaceAdmin(workspaceId);

  const rawEmail = formData.get("email");
  const rawRole = formData.get("role");

  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const role = typeof rawRole === "string" ? rawRole : "";

  if (!email) {
    throw new Error("Email is required");
  }

  if (!Object.values(WorkspaceRole).includes(role as WorkspaceRole)) {
    throw new Error("Valid role is required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    throw new Error("User not found");
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
    throw new Error("User is already a member of this workspace");
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
}
