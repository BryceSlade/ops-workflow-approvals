"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireDraftOwner } from "@/features/requests/server/permissions";
import type { RequestActionState } from "@/features/requests/server/submit-request";

export async function updateRequestDraft(
  requestId: string,
  _prevState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  try {
    const actor = await requireCurrentUser();
    const request = await requireDraftOwner(requestId);

    const rawTitle = formData.get("title");
    const rawDescription = formData.get("description");

    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    const description =
      typeof rawDescription === "string" ? rawDescription.trim() : "";

    if (!title) {
      return { ok: false, error: "Title is required" };
    }

    if (title.length > 200) {
      return { ok: false, error: "Title must be 200 characters or fewer" };
    }

    const updatedRequest = await prisma.workflowRequest.update({
      where: { id: request.id },
      data: {
        title,
        description: description || null,
      },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        status: true,
      },
    });

    await prisma.auditEvent.create({
      data: {
        workspaceId: updatedRequest.workspaceId,
        actorUserId: actor.id,
        action: "request.updated",
        message: `Updated draft request "${updatedRequest.title}"`,
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

    return { ok: true, message: "Draft updated successfully" };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: "Unable to update draft right now" };
  }
}
