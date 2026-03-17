"use server";

import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireDraftOwner } from "@/features/requests/server/permissions";

export type RequestActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

export async function submitRequest(
  requestId: string,
  _prevState: RequestActionState,
  _formData: FormData,
): Promise<RequestActionState> {
  try {
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
    revalidatePath(
      `/workspaces/${updatedRequest.workspaceId}/requests/${updatedRequest.id}`,
    );

    return { ok: true, message: "Request submitted successfully" };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: "Unable to submit request right now" };
  }
}
