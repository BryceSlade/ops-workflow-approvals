import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin } from "@/features/workspaces/server/permissions";

export type WorkspaceMemberListItem = {
  id: string;
  role: import("@prisma/client").WorkspaceRole;
  createdAt: Date;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

export async function listWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberListItem[]> {
  await requireWorkspaceAdmin(workspaceId);

  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },
    orderBy: [{ createdAt: "asc" }, { user: { email: "asc" } }],
    select: {
      id: true,
      role: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}
