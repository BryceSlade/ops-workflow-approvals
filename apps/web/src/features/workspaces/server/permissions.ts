import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

export type WorkspaceMembership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
};

export async function getWorkspaceMembership(
  workspaceId: string,
): Promise<WorkspaceMembership | null> {
  const user = await requireCurrentUser();

  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: user.id,
      },
    },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      role: true,
    },
  });
}

export async function requireWorkspaceMember(
  workspaceId: string,
): Promise<WorkspaceMembership> {
  const membership = await getWorkspaceMembership(workspaceId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  return membership;
}

export async function requireWorkspaceAdmin(
  workspaceId: string,
): Promise<WorkspaceMembership> {
  const membership = await requireWorkspaceMember(workspaceId);

  if (membership.role !== WorkspaceRole.ADMIN) {
    throw new Error("Forbidden");
  }

  return membership;
}

export function isWorkspaceAdminRole(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.ADMIN;
}
