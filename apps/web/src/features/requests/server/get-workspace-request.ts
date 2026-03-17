import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRequestWorkspaceMember } from "@/features/requests/server/permissions";

export type WorkspaceRequestDetail = {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
  };
};

export async function getWorkspaceRequest(
  workspaceId: string,
  requestId: string,
): Promise<WorkspaceRequestDetail> {
  await requireRequestWorkspaceMember(workspaceId);

  const request = await prisma.workflowRequest.findFirst({
    where: {
      id: requestId,
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
      createdByUserId: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  return request;
}
