"use server";

import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireDraftOwner } from "@/features/requests/server/permissions";

export async function submitRequest(requestId: string) {
  const actor = await requireCurrentUser();
  const request = await requireDraftOwner(requestId);

  const updatedRequest = await prisma.workflowRequest.update({
    where: { id: request.id },
    data: {
      status: RequestStatus.SUBMITTED,
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
      action: "request.submitted",
      message: `Submitted request "${updatedRequest.title}"`,
      metadata: {
        requestId: updatedRequest.id,
        title: updatedRequest.title,
        status: updatedRequest.status,
      },
    },
  });

  revalidatePath(`/workspaces/${updatedRequest.workspaceId}/requests`);
}
