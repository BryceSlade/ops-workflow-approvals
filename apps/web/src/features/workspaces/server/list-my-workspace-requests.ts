import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireRequestWorkspaceMember } from "@/features/requests/server/permissions";

export type MyWorkspaceRequestListItem = {
  id: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export async function listMyWorkspaceRequests(
  workspaceId: string,
): Promise<MyWorkspaceRequestListItem[]> {
  const user = await requireCurrentUser();
  await requireRequestWorkspaceMember(workspaceId);

  return prisma.workflowRequest.findMany({
    where: {
      workspaceId,
      createdByUserId: user.id,
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
    },
  });
}
