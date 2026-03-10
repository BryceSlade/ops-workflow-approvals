import { RequestStatus, WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireWorkspaceMember } from "@/features/workspaces/server/permissions";

export type RequestAccess = {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  status: RequestStatus;
};

export async function requireRequestWorkspaceMember(workspaceId: string) {
  return requireWorkspaceMember(workspaceId);
}

export function isRequestReviewerRole(role: WorkspaceRole): boolean {
  return (
    role === WorkspaceRole.ADMIN ||
    role === WorkspaceRole.MANAGER ||
    role === WorkspaceRole.APPROVER
  );
}

export async function requireRequestReviewer(workspaceId: string) {
  const membership = await requireWorkspaceMember(workspaceId);

  if (!isRequestReviewerRole(membership.role)) {
    throw new Error("Forbidden");
  }

  return membership;
}

export async function requireDraftOwner(
  requestId: string,
): Promise<RequestAccess> {
  const user = await requireCurrentUser();

  const request = await prisma.workflowRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      workspaceId: true,
      createdByUserId: true,
      status: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.createdByUserId !== user.id) {
    throw new Error("Forbidden");
  }

  if (request.status !== RequestStatus.DRAFT) {
    throw new Error("Only draft requests can be modified");
  }

  return request;
}
