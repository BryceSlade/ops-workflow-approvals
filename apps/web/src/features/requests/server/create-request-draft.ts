"use server";

import { RequestStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import { requireRequestWorkspaceMember } from "@/features/requests/server/permissions";

export async function createRequestDraft(
  workspaceId: string,
  formData: FormData,
) {
  const user = await requireCurrentUser();
  await requireRequestWorkspaceMember(workspaceId);

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

  const request = await prisma.workflowRequest.create({
    data: {
      workspaceId,
      createdByUserId: user.id,
      title,
      description: description || null,
      status: RequestStatus.DRAFT,
    },
  });

  await prisma.auditEvent.create({
    data: {
      workspaceId,
      actorUserId: user.id,
      action: "request.draft_created",
      message: `Created draft request "${request.title}"`,
      metadata: {
        requestId: request.id,
        title: request.title,
        status: request.status,
      },
    },
  });

  revalidatePath(`/workspaces/${workspaceId}/requests`);
}
