"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireDraftOwner } from "@/features/requests/server/permissions";

export async function updateRequestDraft(
  requestId: string,
  formData: FormData,
) {
  const actor = await requireCurrentUser();
  const request = await requireDraftOwner(requestId);

  const rawTitle = formData.get("title");
  const rawDescription = formData.get("description");

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const description =
    typeof rawDescription === "string" ? rawDescription.trim() : "";

  if (!title) {
    throw new Error("Title is required");
  }

  if (title.length > 200) {
    throw new Error("Title must be 200 characters or fewer");
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
}
