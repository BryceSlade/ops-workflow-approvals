"use server";

import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireRequestReviewer } from "@/features/requests/server/permissions";
import type { RequestActionState } from "@/features/requests/server/submit-request";

export async function rejectRequest(
  requestId: string,
  _prevState: RequestActionState,
  _formData: FormData,
): Promise<RequestActionState> {
  try {
    const actor = await requireCurrentUser();

    const request = await prisma.workflowRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        createdByUserId: true,
        title: true,
        status: true,
      },
    });

    if (!request) {
      return { ok: false, error: "Request not found" };
    }

    await requireRequestReviewer(request.workspaceId);

    if (request.createdByUserId === actor.id) {
      return { ok: false, error: "You cannot reject your own request" };
    }

    if (request.status !== RequestStatus.SUBMITTED) {
      return { ok: false, error: "Only submitted requests can be rejected" };
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
    revalidatePath(
      `/workspaces/${updatedRequest.workspaceId}/requests/${updatedRequest.id}`,
    );

    return { ok: true, message: "Request rejected successfully" };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: "Unable to reject request right now" };
  }
}
