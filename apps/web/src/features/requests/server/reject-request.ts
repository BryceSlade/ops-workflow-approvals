"use server";

import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireRequestReviewer } from "@/features/requests/server/permissions";

export async function rejectRequest(requestId: string) {
  const actor = await requireCurrentUser();

  const request = await prisma.workflowRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  await requireRequestReviewer(request.workspaceId);

  if (request.status !== RequestStatus.SUBMITTED) {
    throw new Error("Only submitted requests can be approved");
  }

  const updatedRequest = await prisma.workflowRequest.update({
    where: { id: request.id },
    data: {
      status: RequestStatus.REJECTED,
    },
    select: {
      id: true,
      workspaceId: true,
      title: true,
      status: true,
    },
  });

  await prisma.auditEvent.create({
    data: {
      workspaceId: updatedRequest.workspaceId,
      actorUserId: actor.id,
      action: "request.rejected",
      message: `Rejected request "${updatedRequest.title}"`,
      metadata: {
        requestId: updatedRequest.id,
        title: updatedRequest.title,
        status: updatedRequest.status,
      },
    },
  });

  revalidatePath(`/workspaces/${updatedRequest.workspaceId}/requests`);
}
