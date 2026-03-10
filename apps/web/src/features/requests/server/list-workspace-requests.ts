import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRequestReviewer } from "@/features/requests/server/permissions";

export type WorkspaceRequestListItem = {
  id: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
};

export async function listWorkspaceRequests(
  workspaceId: string,
): Promise<WorkspaceRequestListItem[]> {
  await requireRequestReviewer(workspaceId);

  return prisma.workflowRequest.findMany({
    where: {
      workspaceId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdByUserId: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });
}
