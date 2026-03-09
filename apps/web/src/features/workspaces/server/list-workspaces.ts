import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

export type WorkspaceListItem = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  members: {
    role: WorkspaceRole;
  }[];
};

export async function listMyWorkspaces(): Promise<WorkspaceListItem[]> {
  const user = await requireCurrentUser();

  return prisma.workspace.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });
}
